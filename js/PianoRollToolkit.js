/* globals Document, DOMParser, verovio, XMLSerializer */
export class PianoRollToolkit {
  constructor () {
    this.scale = 100;
    this.width = 300;
    this.height = 150;
    this.adjustPageHeight = false;
    this._configValues();
    if (typeof verovio !== 'undefined') {
      // eslint-disable-next-line new-cap
      this.verovio = new verovio.toolkit();
    }
  }

  getElementsAtTime (time) {
    let eat = this.verovio.getElementsAtTime(time);
    let page = this.getPageWithElement(eat.notes[0]);
    return {
      notes: eat.notes,
      page: page
    };
  }

  getPageCount () {
    // this.pages has an empty item in it.
    return this.pages.length - 1;
  }

  /**
   * @brief Find the page that a specific note is on.
   */
  getPageWithElement (id) {
    // Search through the measures to find the current note.
    let measure = this.data.measures.find(m => {
      return m && m.notes.find(note => note.id === id);
    });
    let measureNumber = this.data.measures.indexOf(measure);

    // Find the page that contains that measure.
    let page = this.pages.find(page => {
      return page.find(m => m.i === measureNumber);
    });
    return this.pages.indexOf(page);
  }

  getTimeForElement (id) {}
  loadData (data) {
    if (this.verovio) {
      this.verovio.loadData(data);
      data = this.verovio.getMEI();
    }
    let parser = new DOMParser();
    let doc = parser.parseFromString(data, 'text/xml');
    return this.loadDataFromDoc(doc);
  }
  loadDataFromDoc (doc) {
    this.doc = doc;
    this.lowNote = Infinity;
    this.highNote = -Infinity;
    this.data = {};
    this.chordSymbols = false;
    let title = this.doc.querySelector(
      'work work-title, movement-title, titleStmt title'
    );
    this.data.title = title ? title.innerHTML : '';
    let composer = this.doc.querySelector(
      'identification creator[type=composer], titleStmt respStmt persName[role=composer]'
    );
    this.data.composer = composer ? composer.innerHTML : '';
    let lyricist = this.doc.querySelector(
      'identification creator[type=lyricist], titleStmt respStmt persName[role=lyricist]'
    );
    this.data.lyricist = lyricist ? lyricist.innerHTML : '';
    this.data.measures = [];
    this.data.voices = {};
    this.doc.querySelectorAll('measure').forEach(measure => {
      const measureNumber =
        measure.getAttribute('number') || measure.getAttribute('n');
      this.data.measures[measureNumber] = {
        notes: [],
        chordSymbols: [],
        duration: 0,
        pageBreak: false,
        sectionBreak: false
      };
    });
    this.doc.querySelectorAll('measure').forEach(measure => {
      const measureNumber =
        measure.getAttribute('number') || measure.getAttribute('n');

      if (
        measure.querySelector('print[new-system="yes"]') ||
        (measure.previousElementSibling &&
          measure.previousElementSibling.localName === 'sb')
      ) {
        this.data.measures[measureNumber].sectionBreak = true;
      }
      if (
        measure.querySelector('print[new-page="yes"]') ||
        (measure.previousElementSibling &&
          measure.previousElementSibling.localName === 'pb')
      ) {
        this.data.measures[measureNumber].sectionBreak = true;
        this.data.measures[measureNumber].pageBreak = true;
      }

      // Go through the notes and rests sequentially so we can get their offsets straight.
      let notes = measure.querySelectorAll('note,rest');
      let offset = {};
      let previousDuration = 0;
      for (let i = 0; i < notes.length; i++) {
        let part = measure.closest('part');
        const partID = part
          ? part.getAttribute('id')
          : notes[i].closest('staff').getAttribute('n');

        let duration =
          notes[i].getAttribute('dur.ppq') ||
          (notes[i].querySelector('duration')
            ? notes[i].querySelector('duration').innerHTML
            : 0);
        duration = parseInt(duration);
        const voice = notes[i].querySelector('voice')
          ? notes[i].querySelector('voice').innerHTML
          : notes[i].closest('layer')
            ? notes[i].closest('layer').getAttribute('n')
            : '0';
        // Lyric numbers are 1 indexed.
        let lyrics = [undefined];
        let lyricElements = notes[i].querySelectorAll('lyric');
        lyricElements = lyricElements.length
          ? lyricElements
          : notes[i].querySelectorAll('verse');
        lyricElements.forEach(lyric => {
          let j = lyric.getAttribute('number') || lyric.getAttribute('n');
          lyrics[j] = this._getLyric(lyric);
        });
        // Another way in musicXML to do chords is to just add a chord element inside a note
        // (in which case, the offset doesn't advance, and the note starts with the previous one).
        const isInternalChord = notes[i].querySelector('chord');
        let id = notes[i].getAttribute('xml:id') || `note-${Math.random()}`;
        let pitches = notes[i].querySelectorAll('pitch');
        pitches = pitches.length
          ? pitches
          : notes[i].getAttribute('oct')
            ? [notes[i]]
            : [];
        pitches.forEach(pitch => {
          const pitchVal = this._getPitch(pitch);
          if (pitchVal > this.highNote) {
            this.highNote = pitchVal;
          }
          if (pitchVal < this.lowNote) {
            this.lowNote = pitchVal;
          }
          this.data.measures[measureNumber].notes.push({
            duration: duration,
            id: id,
            lyrics: lyrics,
            offset: isInternalChord
              ? offset[partID + voice] - previousDuration
              : offset[partID + voice] || 0,
            pitch: pitchVal,
            voice: partID + voice
          });
          this.data.voices[partID + voice] = partID + voice;
        });
        if (!isInternalChord) {
          offset[partID + voice] = (offset[partID + voice] || 0) + duration;
        }
        if (
          offset[partID + voice] > this.data.measures[measureNumber].duration
        ) {
          this.data.measures[measureNumber].duration = offset[partID + voice];
        }
        previousDuration = duration;
      }
      // Parse chord symbols from MEI
      let mdiv = measure.closest('mdiv');
      if (mdiv) {
        let staffDef = mdiv.querySelector('staffDef');
        measure.querySelectorAll('harm').forEach(harm => {
          this.chordSymbols = true;
          let tstamp = parseFloat(harm.getAttribute('tstamp'));
          let ppq = staffDef.getAttribute('ppq');
          let meterunit = staffDef.getAttribute('meter.unit');
          this.data.measures[measureNumber].chordSymbols.push({
            text: harm.innerHTML,
            id: harm.getAttribute('xml:id'),
            offset: (tstamp - 1) * ppq * (4 / meterunit)
          });
        });
      }
    });

    // Compute some things about the song.
    this.noteRange = this.highNote - this.lowNote + 1;
    let durations = 0;
    let count = 0;
    this.data.measures.forEach(m => {
      m.notes.forEach(n => {
        count++;
        durations += n.duration;
      });
    });
    this.averageDuration = durations / count;

    // Assign numbers to the voices
    Object.keys(this.data.voices).forEach((voice, i) => {
      this.data.voices[voice] = i;
    });

    this._assignMeasuresToPages();
  }
  redoLayout () {
    this._assignMeasuresToPages();
  }

  renderToMIDI () {
    return this.verovio.renderToMIDI();
  }

  renderToSVG (page, options) {
    let svg = new Document().createElement('svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('font-family', 'Monospace');
    svg.setAttribute('font-size', this.fontSize);
    svg.setAttribute('width', this.width);
    svg.setAttribute('height', this.height);
    let maxYOffset = -Infinity;
    if (page === 1 && !this.noHeader) {
      let title = this._getTitleBlock();
      svg.appendChild(title);
    }
    this.pages[page].forEach(measurePlacement => {
      let measure = this.data.measures[measurePlacement.i];
      if (measure) {
        let measureElement = this._measure(
          this.data.measures[measurePlacement.i]
        );
        if (measurePlacement.y > maxYOffset) {
          maxYOffset = measurePlacement.y;
        }
        measureElement.setAttribute('id', `measure${measurePlacement.i}`);
        measureElement.setAttribute(
          'transform',
          `translate(${measurePlacement.x} ${measurePlacement.y})`
        );
        svg.appendChild(measureElement);
      }
    });
    if (this.adjustPageHeight && maxYOffset >= 0) {
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
    if (options.adjustPageHeight) {
      this.adjustPageHeight = options.adjustPageHeight;
    }
    if (options.breaks) {
      if (options.breaks === 'line' || options.breaks === 'encoded') {
        // Using section breaks will automatically change the xScale.
        this.useSectionBreaks = true;
      }
    }
    if (options.noHeader) {
      this.noHeader = true;
    }
    this._configValues();
  }

  // Private functions

  _assignMeasuresToPages () {
    if (this.useSectionBreaks) {
      if (this.data.measures.some(m => m.sectionBreak)) {
        let scale = this.width / this._getMaxSectionDuration();
        if (scale) {
          this.xScale = scale;
        }
      } else {
        this._debug(
          'useSectionBreaks is set, but no section breaks were found in this piece.'
        );
      }
    } else if (this.averageDuration > 50) {
      this.xScale = this.scale / Math.ceil(this.averageDuration / 2);
    }
    let rowHeight = this._getMeasureHeight();
    // TODO: Account for the title, allow different number of rows
    // on different slides.
    let yOffset = 0;
    if (!this.noHeader) {
      yOffset = this.fontSize * 3.0;
    }
    let rowsPerSlide = Math.floor((this.height - yOffset) / rowHeight);
    rowsPerSlide = rowsPerSlide > 0 ? rowsPerSlide : 1;
    this.pages = [[], []];
    let j = 1;
    let row = 0;
    let xOffset = 0;
    for (let i = 1; i <= this.data.measures.length; i++) {
      let measure = this.data.measures[i];
      if (measure) {
        let mWidth = this._getMeasureWidth(measure);
        if (
          xOffset + mWidth > this.width ||
          (this.useSectionBreaks && measure.sectionBreak && i !== 1)
        ) {
          xOffset = 0;
          if (row + 1 < rowsPerSlide) {
            row++;
          } else {
            j++;
            this.pages[j] = [];
            row = 0;
            yOffset = 0;
          }
        }
        let xTransform = xOffset;
        let yTransform = yOffset + row * rowHeight;
        xOffset += mWidth;
        this.pages[j].push({ x: xTransform, y: yTransform, i: i });
      }
    }
  }
  _configValues () {
    this.xScale = this.scale;
    this.yScale = this.scale / 6;
    this.fontSize = this.scale / 3;
  }

  _debug (message) {
    console.log(`PianoRollToolkit: ${message}`);
  }

  _getMaxSectionDuration () {
    let msd = -Infinity;
    let sectionDur = 0;
    for (let i = 0; i <= this.data.measures.length; i++) {
      let measure = this.data.measures[i];
      if (measure) {
        sectionDur += measure.duration;
        if (sectionDur > msd) {
          msd = sectionDur;
        }
        if (measure.sectionBreak) {
          sectionDur = 0;
        }
      }
    }
    return msd;
  }
  _getMeasureHeight () {
    // TODO: Automatically determine how many verses are being shown.
    let numVerses = 2;
    return (
      this.noteRange * this.yScale +
      2 * (this.fontSize * (numVerses + this.chordSymbols))
    );
  }
  _getMeasureWidth (measure) {
    return measure.duration * this.xScale;
  }

  _getLyric (lyric) {
    if (!lyric) return '';
    let text = lyric.querySelector('text') || lyric.querySelector('syl');
    text = text.innerHTML;
    let syllabic = lyric.querySelector('syllabic');
    syllabic = syllabic
      ? syllabic.innerHTML
      : lyric.querySelector('syl').getAttribute('wordpos');
    if (syllabic === 'begin' || syllabic === 'i') return text + '-';
    else if (syllabic === 'end' || syllabic === 't') return text + '\xa0';
    else if (syllabic === 'middle' || syllabic === 'm') return text + '-';
    else return text + '\xa0';
  }

  _getPitch (pitch) {
    let step =
      pitch.getAttribute('pname') || pitch.querySelector('step').innerHTML;
    let alter = pitch.querySelector('alter');
    if (alter) {
      alter = alter.innerHTML;
    } else if (pitch.getAttribute('accid.ges') === 'f') {
      alter = -1;
    } else if (pitch.getAttribute('accid.ges') === 's') {
      alter = 1;
    } else {
      alter = 0;
    }
    let octave =
      pitch.getAttribute('oct') || pitch.querySelector('octave').innerHTML;
    const stepMap = {
      C: 0,
      c: 0,
      D: 2,
      d: 2,
      E: 4,
      e: 4,
      F: 5,
      f: 5,
      G: 7,
      g: 7,
      A: 9,
      a: 9,
      B: 11,
      b: 11
    };
    // TODO: make sure that C flat gets placed in the correct octave.
    return stepMap[step] + parseInt(alter) + parseInt(octave) * 12;
  }

  _getTitleBlock () {
    let titleBlock = new Document().createElement('g');
    let title = new Document().createElement('text');
    title.innerHTML = this.data.title;
    title.setAttribute('dy', this.fontSize);
    title.setAttribute(
      'x',
      this.data.title.length * (-0.7 * this.fontSize) * 0.5
    );
    title.setAttribute('dx', '50%');
    titleBlock.appendChild(title);

    let lyricist = new Document().createElement('text');
    lyricist.innerHTML = this.data.lyricist;
    lyricist.setAttribute('y', this.fontSize);
    lyricist.setAttribute('dy', this.fontSize);
    lyricist.setAttribute('style', 'font-size: 70%');
    titleBlock.appendChild(lyricist);

    let composerNewLine =
      (this.data.lyricist.length + this.data.composer.length) *
        (0.7 * this.fontSize * 0.7) >
      this.width;

    let composer = new Document().createElement('text');
    composer.innerHTML = this.data.composer;
    composer.setAttribute('y', this.fontSize * (1 + composerNewLine));
    composer.setAttribute('dy', this.fontSize);
    composer.setAttribute('style', 'font-size: 70%');
    composer.setAttribute(
      'x',
      this.data.composer.length * (-0.65 * this.fontSize * 0.7)
    );
    composer.setAttribute('dx', '100%');
    titleBlock.appendChild(composer);

    return titleBlock;
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
      let lyrics = note.lyrics;
      measureElement.appendChild(
        this._rectangle(x, y, w, h, lyrics, note.voice, note.id)
      );
    }
    measure.chordSymbols.forEach(cs => {
      measureElement.appendChild(this._renderChordSymbol(cs));
    });
    return measureElement;
  }

  _rectangle (x, y, w, h, lyrics, voice, id) {
    let g = new Document().createElement('g');
    g.setAttribute('class', `voice${this.data.voices[voice]}`);
    let sx = this.xScale * x;
    let sw = this.xScale * w;
    let sy = this.yScale * y + this.chordSymbols * this.fontSize;
    let sh = this.yScale * h;
    let rect = new Document().createElement('rect');
    // Make the rectangles rounded.
    let diameter = this.yScale;
    rect.setAttribute('x', sx + diameter / 2);
    rect.setAttribute('width', sw - diameter);
    rect.setAttribute('y', sy + diameter / 2);
    let height = sh - diameter;
    rect.setAttribute('height', height > 0 ? height : 1);
    rect.setAttribute('stroke-width', diameter);
    rect.setAttribute('stroke-linejoin', 'round');
    g.appendChild(rect);
    lyrics.forEach((lyric, i) => {
      if (lyric) {
        let text = new Document().createElement('text');
        text.setAttribute('x', sx);
        text.setAttribute('data-textlength', sw);
        text.setAttribute('lengthAdjust', 'spacingAndGlyphs');
        text.setAttribute('dx', 1);
        text.setAttribute(
          'y',
          this.noteRange * this.yScale +
            (i - 1 + this.chordSymbols) * this.fontSize
        );
        text.setAttribute('dy', this.fontSize);
        text.setAttribute('data-verse-num', i);
        text.innerHTML = lyric;
        this._squishText(text);

        g.appendChild(text);
      }
    });
    g.setAttribute('id', id);
    return g;
  }
  _renderChordSymbol (cs) {
    let text = new Document().createElement('text');
    let sx = this.xScale * cs.offset;
    text.setAttribute('x', sx);
    text.setAttribute('y', 0);
    text.setAttribute('dy', this.fontSize);
    text.setAttribute('id', cs.id);
    text.innerHTML = cs.text;
    return text;
  }
  /**
   * @brief Squish text so it doesn't go beyond the boundaries of its box.
   *  Also possibly removes hypens or adds non-breaking spaces to squished text elements.
   * @param el The element that you want to squish the text on.
   * @precondition The text in the element ends with a non-breaking space if it is the end of a word.
   */
  _squishText (el) {
    // If there is no text here, we don't have to do anything.
    if (typeof el.childNodes[0] === 'undefined') return;
    var text = el.childNodes[0].nodeValue;
    // Setting a specific letter width isn't perfect since "One" is wider than "ly,",
    // For now, we are using a monospace font to account for this.
    var widthPerLetter = this.fontSize * 0.7;
    var boxWidth = el.getAttribute('data-textlength');

    // Add a hyphen if it doesn't end in a hypen or a non-breaking space.
    if (!text.match(/[\xA0-]$/)) {
      text += '-';
    }

    if (text.length * widthPerLetter >= boxWidth) {
      // Apply the textLength attribute if we need to squish these letters.
      el.setAttribute('textLength', boxWidth);

      // If we need to squish this letter, it's okay to remove any trailing hyphens,
      // as long as removing those won't stretch the letter out.
      // (this syllable is the middle of a word, but is squished against its continuation)
      if ((text.length - 1) * widthPerLetter >= boxWidth) {
        text = text.replace(/-$/, '');
      }
    } else {
      el.removeAttribute('textLength');
    }
    el.innerHTML = text;
  }
}
