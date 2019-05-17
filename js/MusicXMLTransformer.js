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
  transform (data, transformationName) {
    if (transformationName) {
      this.loadData(data);
      this.showSection(transformationName);
      return this.getData();
    } else {
      return data;
    }
  }

  showSection (sectionName) {
    if (this.doc.querySelector(`lyric[name='${sectionName}']`)) {
      this.hideOtherLyrics(sectionName);
    } else if (sectionName.slice(0, 5) === 'verse') {
      let verseNumber = parseInt(sectionName.slice(5));
      this.hideOtherVerses(verseNumber);
    }
    // So there isn't an odd gap between top and bottom.
    this.makeAllWordsVerse1();
    this.hideOtherMeasures();
    this.renumberMeasures();

    let barStyles = Array.from(
      this.doc.querySelectorAll('measure barline[location="right"] bar-style')
    );
    if (
      barStyles &&
      barStyles.some(
        barStyle =>
          barStyle.innerHTML === 'dotted' || barStyle.innerHTML === 'dashed'
      )
    ) {
      this.removeSystemBreaks();
      this.useDottedDashedAsSystemBreaks();
    }
  }

  hideOtherLyrics (sectionName) {
    this.doc
      .querySelectorAll(`lyric:not([name='${sectionName}'])`)
      .forEach(function (e) {
        e.parentNode.removeChild(e);
      });
  }
  hideOtherVerses (verseNumber) {
    this.doc
      .querySelectorAll(`lyric:not([number='${verseNumber}'])`)
      .forEach(function (e) {
        e.parentNode.removeChild(e);
      });
  }

  hideOtherMeasures () {
    this.doc.querySelectorAll('part').forEach(part => {
      let attributesTag;
      let measures = part.querySelectorAll('measure');
      for (let i = 0; i < measures.length; i++) {
        // TODO: Better determination of which measures should be deleted.
        if (!measures[i].querySelector('lyric')) {
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

  makeAllWordsVerse1 () {
    this.doc.querySelectorAll('lyric').forEach(lyric => {
      lyric.setAttribute('number', '1');
    });
  }

  removeSystemBreaks () {
    this.doc.querySelectorAll('measure print').forEach(print => {
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
          let measure = barStyle.closest('measure');
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
