/* globals Document, DOMParser, XMLSerializer */
export class PianoRollToolkit {
  constructor () {
    this.scale = 50;
    this.width = 300;
    this.height = 150;
    this.xScale = this.scale;
    this.yScale = this.scale / 5;
    this.fontSize = 20;
    this.adjustPageHeight = false;
  }
  getPageCount () {
    // this.pages has an empty item in it.
    return this.pages.length - 1;
  }
  getTimeForElement (id) {}
  loadData (data) {
    let parser = new DOMParser();
    let doc = parser.parseFromString(data, 'text/xml');
    return this.loadDataFromDoc(doc);
  }
  loadDataFromDoc (doc) {
    this.doc = doc;
    this.lowNote = Infinity;
    this.highNote = -Infinity;
    this.data = {};
    this.data.measures = [];
    this.doc.querySelectorAll('measure').forEach(measure => {
      const measureNumber = measure.getAttribute('number');
      this.data.measures[measureNumber] = {
        notes: [],
        chordSymbols: [],
        duration: 0
      };
    });
    this.doc.querySelectorAll('measure').forEach(measure => {
      const measureNumber = measure.getAttribute('number');
      const partID = measure.closest('part').getAttribute('id');

      // Go through the notes and rests sequentially so we can get their offsets straight.
      let notes = measure.querySelectorAll('note');
      let offset = {};

      for (let i = 0; i < notes.length; i++) {
        const duration = parseInt(notes[i].querySelector('duration').innerHTML);
        const voice = notes[i].querySelector('voice').innerHTML;
        const lyric = this._getLyric(notes[i].querySelector('lyric'));
        notes[i].querySelectorAll('pitch').forEach(pitch => {
          const pitchVal = this._getPitch(pitch);
          if (pitchVal > this.highNote) {
            this.highNote = pitchVal;
          }
          if (pitchVal < this.lowNote) {
            this.lowNote = pitchVal;
          }
          this.data.measures[measureNumber].notes.push({
            duration: duration,
            lyric: lyric,
            offset: offset[voice] || 0,
            pitch: pitchVal,
            voice: partID + voice
          });
        });
        offset[voice] = (offset[voice] || 0) + duration;
      }
      // TODO: Show chord symbols in dynamic presentation?
      // measure.querySelectorAll('harmony')
    });

    // Compute some things about the song.
    this.noteRange = this.highNote - this.lowNote + 1;

    this._assignMeasuresToPages();
  }
  renderToSVG (page, options) {
    let svg = new Document().createElement('svg');
    svg.setAttribute('font-family', 'Monospace');
    svg.setAttribute('font-size', this.fontSize);
    svg.setAttribute('width', this.width);
    svg.setAttribute('height', this.height);
    let maxYOffset = -Infinity;
    this.pages[page].forEach(measurePlacement => {
      let measure = this.data.measures[measurePlacement.i];
      if (measure) {
        let measureElement = this._measure(
          this.data.measures[measurePlacement.i]
        );
        if (measurePlacement.y > maxYOffset) {
          maxYOffset = measurePlacement.y;
        }
        measureElement.setAttribute(
          'transform',
          `translate(${measurePlacement.x} ${measurePlacement.y})`
        );
        svg.appendChild(measureElement);
      }
    });
    if (this.adjustPageHeight) {
      let adjustedHeight = this._getMeasureHeight() + maxYOffset;
      svg.setAttribute('height', adjustedHeight);
    }
    return new XMLSerializer().serializeToString(svg);
  }
  setOptions (options) {
    if (options.scale) {
      this.scale = options.scale;
    }
    // For some reason, pageWidth and pageHeight options are not the actual pixel values...
    if (options.pageWidth) {
      this.width = (options.pageWidth / 100) * this.scale;
    }
    if (options.pageHeight) {
      this.height = (options.pageHeight / 100) * this.scale;
    }
    this.xScale = this.scale;
    this.yScale = this.scale / 5;
    if (options.adjustPageHeight) {
      this.adjustPageHeight = options.adjustPageHeight;
    }
  }

  // Private functions

  _assignMeasuresToPages () {
    let rowHeight = this._getMeasureHeight();
    let rowsPerSlide = Math.floor(this.height / rowHeight);
    this.pages = [[], []];
    let j = 1;
    let row = 0;
    let xOffset = 0;
    for (let i = 1; i <= this.data.measures.length; i++) {
      let measure = this.data.measures[i];
      if (measure) {
        let mWidth = this._getMeasureWidth(measure);
        if (xOffset + mWidth > this.width) {
          xOffset = 0;
          if (row + 1 < rowsPerSlide) {
            row++;
          } else {
            j++;
            this.pages[j] = [];
            row = 0;
          }
        }
        let xTransform = xOffset;
        let yTransform = row * rowHeight;
        xOffset += mWidth;
        this.pages[j].push({ x: xTransform, y: yTransform, i: i });
      }
    }
  }
  _getMeasureHeight () {
    return this.noteRange * this.yScale + 2 * this.fontSize;
  }
  _getMeasureWidth (measure) {
    // TODO: Better way of getting duration of a measure.
    let width = -Infinity;
    for (let i = 0; i < measure.notes.length; i++) {
      if (measure.notes[i].duration + measure.notes[i].offset > width) {
        width = measure.notes[i].duration + measure.notes[i].offset;
      }
    }
    return width * this.xScale;
  }
  _getLyric (lyric) {
    if (!lyric) return '';
    let text = lyric.querySelector('text').innerHTML;
    let syllabic = lyric.querySelector('syllabic').innerHTML;
    if (syllabic === 'begin') return text + '-';
    else if (syllabic === 'end') return '-' + text;
    else if (syllabic === 'middle') return '-' + text + '-';
    else return text;
  }
  _getPitch (pitch) {
    let step = pitch.querySelector('step').innerHTML;
    let alter = pitch.querySelector('alter');
    if (alter) {
      alter = alter.innerHTML;
    } else {
      alter = 0;
    }
    let octave = pitch.querySelector('octave').innerHTML;
    const stepMap = {
      C: 0,
      D: 2,
      E: 4,
      F: 5,
      G: 7,
      A: 9,
      B: 11
    };
    // TODO: make sure that C flat gets placed in the correct octave.
    return stepMap[step] + parseInt(alter) + parseInt(octave) * 12;
  }
  _measure (measure) {
    let measureElement = new Document().createElement('g');
    let notes = measure.notes;
    for (let i = 0; i < notes.length; i++) {
      let note = notes[i];
      let x = note.offset;
      let w = note.duration;
      let y = this.highNote - note.pitch;
      let h = 1;
      let lyric = note.lyric;
      measureElement.appendChild(
        this._rectangle(x, y, w, h, lyric, note.voice)
      );
    }
    return measureElement;
  }
  _rectangle (x, y, w, h, lyric, voice) {
    let g = new Document().createElement('g');
    let sx = this.xScale * x;
    let sw = this.xScale * w;
    let sy = this.yScale * y;
    let sh = this.yScale * h;
    let rect = new Document().createElement('rect');
    // Make the rectangles rounded.
    let diameter = this.yScale;
    rect.setAttribute('x', sx);
    rect.setAttribute('dx', diameter / 2);
    rect.setAttribute('width', sw - diameter);
    rect.setAttribute('y', sy);
    rect.setAttribute('dy', diameter / 2);
    let height = sh - diameter;
    rect.setAttribute('height', height > 0 ? height : 1);
    rect.setAttribute('data-voice', voice);
    rect.setAttribute('stroke-width', diameter);
    rect.setAttribute('stroke-linejoin', 'round');
    g.appendChild(rect);
    let text = new Document().createElement('text');
    text.setAttribute('x', sx);
    // text-setAttribute('data-textlength', sw);
    text.setAttribute('lengthAdjust', 'spacingAndGlyphs');
    text.setAttribute('dx', 1);
    text.setAttribute('y', this.noteRange * this.yScale);
    text.setAttribute('dy', this.fontSize);

    text.innerHTML = lyric;
    g.appendChild(text);
    return g;
  }
}
