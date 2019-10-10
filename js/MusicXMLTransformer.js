/* globals Document, DOMParser, XMLSerializer */
export class MusicXMLTransformer {
  getData () {
    return new XMLSerializer().serializeToString(this.doc.documentElement);
  }

  loadData (data) {
    let parser = new DOMParser();
    let doc = parser.parseFromString(data, 'text/xml');
    return this.loadDataFromDoc(doc);
  }
  loadDataFromDoc (doc) {
    this.doc = doc;
  }

  /* transform is called by the Reveal Plugin */
  transform (data, transformationJson) {
    const trans = JSON.parse(transformationJson);
    if (!trans) {
      return data;
    }
    if (trans.sectionNames || trans.options) {
      this.loadData(data);
      if (trans.sectionNames && trans.sectionNames.length) {
        this.showSections(trans.sectionNames);
      }
      if (this.dottedOrDashedExist()) {
        this.removeSystemAndPageBreaks();
        this.useDottedDashedAsSystemBreaks();
      }
      if (trans.options && trans.options.phrases) {
        this.phrasesPerLine(trans.options.phrases);
      }
      if (trans.options && trans.options.melodyOnly) {
        this.hidePartsExceptMelody();
      }
      if (trans.options && trans.options.hideMeasureNumbers) {
        this.hideMeasureNumbers();
      }

      return this.getData();
    } else {
      return data;
    }
  }

  showSections (sectionNames) {
    let selectors = [];
    sectionNames.forEach(sectionName => {
      if (this.doc.querySelector(`lyric[name='${sectionName}']`)) {
        selectors.push(`[name='${sectionName}']`);
      } else if (sectionName.slice(0, 5) === 'verse') {
        const verseNumber = parseInt(sectionName.slice(5));
        selectors.push(`[number='${verseNumber}']`);
      }
    });
    this.hideOtherLyrics(selectors);
    // So there isn't an odd gap between top and bottom.
    this.flattenVerses(selectors);
    if (sectionNames[0].slice(0, 12) !== 'instrumental') {
      this.hideOtherMeasures();
    }
    this.renumberMeasures();
  }

  dottedOrDashedExist () {
    let barStyles = Array.from(
      this.doc.querySelectorAll('measure barline[location="right"] bar-style')
    );
    return (
      barStyles &&
      barStyles.some(
        barStyle =>
          barStyle.innerHTML === 'dotted' || barStyle.innerHTML === 'dashed'
      )
    );
  }

  flattenVerses (selectors) {
    selectors.forEach((selector, i) => {
      this.doc.querySelectorAll(`lyric${selector}`).forEach(lyric => {
        lyric.setAttribute('number', i + 1);
      });
    });
  }

  hideMeasureNumbers () {
    this.doc.querySelectorAll('measure').forEach(measure => {
      measure.setAttribute('implicit', 'yes');
    });
  }

  hideOtherLyrics (selectors) {
    let selector = '';
    if (selectors.length) {
      selector = ':not(' + selectors.join('):not(') + ')';
    }
    this.doc.querySelectorAll(`lyric${selector}`).forEach(function (e) {
      e.parentNode.removeChild(e);
    });
  }

  /**
   * @brief Remove measures from sections that don't have lyrics.
   * @precondition No two different measures have the same number.
   */
  hideOtherMeasures () {
    // Determine which measures should be kept.
    let keepMeasures = {};
    this.doc.querySelectorAll('measure lyric').forEach(lyric => {
      const measureNumber = lyric.closest('measure').getAttribute('number');
      keepMeasures[measureNumber] = true;
    });

    // Remove the measures that we aren't keeping.
    this.doc.querySelectorAll('part').forEach(part => {
      let attributesTag;
      let measures = part.querySelectorAll('measure');
      for (let i = 0; i < measures.length; i++) {
        const measureNumber = measures[i].getAttribute('number');
        if (typeof keepMeasures[measureNumber] === 'undefined') {
          if (measures[i].querySelector('attributes')) {
            // Keep the last attributes tag from a measure that we do delete,
            attributesTag = measures[i].querySelector('attributes');
          }
          measures[i].parentNode.removeChild(measures[i]);
        } else {
          if (attributesTag) {
            // and prepend the attributes tag into the next measure that we didn't delete.
            measures[i].insertBefore(attributesTag, measures[i].childNodes[0]);
            attributesTag = null;
          }
        }
      }
    });
  }

  /**
   * @brief Remove parts and voices that are not the melody line.
   */
  hidePartsExceptMelody () {
    // Remove the parts except the first one.
    let parts = this.doc.querySelectorAll('part');
    // Start at i = 1 so that the 0th part doesn't get removed.
    for (let i = 1; i < parts.length; i++) {
      parts[i].parentNode.removeChild(parts[i]);
    }

    // List the voices.
    let voices = {};
    this.doc.querySelectorAll('note voice').forEach(voice => {
      voices[voice.innerHTML] = true;
    });

    // If voice 1 exists,
    let keepVoice = '1';
    if (typeof voices[keepVoice] !== 'undefined') {
      // delete all notes of different voices.
      this.doc.querySelectorAll('note voice').forEach(voice => {
        if (voice.innerHTML !== keepVoice) {
          let note = voice.closest('note');
          note.parentNode.removeChild(note);
        }
      });
    }
  }

  /**
   * @brief Combine Systems together so that there are n old systems per new system.
   */
  phrasesPerLine (n) {
    this.doc.querySelectorAll('part').forEach(part => {
      part
        .querySelectorAll(
          'measure print[new-page=yes], measure print[new-system=yes]'
        )
        .forEach((print, i) => {
          if (i % n !== n - 1) {
            print.removeAttribute('new-page');
            print.removeAttribute('new-system');
          }
        });
    });
  }

  removeSystemAndPageBreaks () {
    this.doc.querySelectorAll('measure print').forEach(print => {
      print.removeAttribute('new-page');
      print.removeAttribute('new-system');
    });
  }

  renumberMeasures () {
    this.doc.querySelectorAll('part').forEach(part => {
      let measures = part.querySelectorAll('measure');
      for (let i = 0; i < measures.length; i++) {
        measures[i].setAttribute('number', i + 1);
      }
    });
  }

  useDottedDashedAsSystemBreaks () {
    this.doc
      .querySelectorAll('measure barline[location="right"] bar-style')
      .forEach(barStyle => {
        if (
          barStyle.innerHTML === 'dotted' ||
          barStyle.innerHTML === 'dashed'
        ) {
          const measure = barStyle.closest('measure');
          let nextMeasure = measure.nextElementSibling;
          if (nextMeasure) {
            let print = nextMeasure.querySelector('print');
            if (!print) {
              print = new Document().createElement('print');
              nextMeasure.appendChild(print);
            }
            print.setAttribute('new-system', 'yes');
          }
        }
      });
  }
}
