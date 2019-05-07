/* globals Document, DOMParser, XMLSerializer */
export class PianoRollToolkit {
  constructor () {
    this.scale = 50;
    this.width = 300;
    this.height = 150;
    this.xScale = this.scale;
    this.yScale = this.scale / 5;
    this.fontSize = 20;
  }
  getPageCount () {
    // TODO: Count the number of pages that this will be divided into.
    return 10;
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
    this.data.measures = {};
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
  }
  renderToSVG (page, options) {
    let svg = new Document().createElement('svg');
    svg.setAttribute('width', this.width);
    svg.setAttribute('height', this.height);
    // TODO: Show multiple measures per page
    let notes = this.data.measures[page].notes;
    for (let i = 0; i < notes.length; i++) {
      let note = notes[i];
      let x = note.offset;
      let w = note.duration;
      let y = this.highNote - note.pitch;
      let h = 1;
      let lyric = note.lyric;
      svg.appendChild(this._rectangle(x, y, w, h, lyric, 'red'));
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
  }

  // Private functions

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
  _rectangle (x, y, w, h, lyric, color) {
    let g = new Document().createElement('g');
    let sx = this.xScale * x;
    let sw = this.xScale * w;
    let sy = this.yScale * y;
    let sh = this.yScale * h;
    let rect = new Document().createElement('rect');
    rect.setAttribute('x', sx);
    rect.setAttribute('width', sw);
    rect.setAttribute('y', sy);
    rect.setAttribute('height', sh);
    rect.setAttribute('fill', color);
    g.appendChild(rect);
    let text = new Document().createElement('text');
    text.setAttribute('x', sx);
    // text-setAttribute('data-textlength', sw);
    text.setAttribute('lengthAdjust', 'spacingAndGlyphs');
    text.setAttribute('dx', 1);
    text.setAttribute('y', '100%');
    text.setAttribute('dy', this.fontSize * (-1 / 2));
    text.setAttribute('font-size', this.fontSize);

    text.innerHTML = lyric;
    g.appendChild(text);
    return g;
  }
}
