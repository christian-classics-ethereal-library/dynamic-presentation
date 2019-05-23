/* globals DOMParser, fetch */
export class RevealMusicArranger {
  init () {
    return this._processSlides().then(() => Promise.resolve());
  }

  /**
   * @brief Determine the arrangement from the arrangementString, or automatically.
   * @param arrangementString is a string like `verse1,chorus,verse2,chorus`, or the empty string.
   * @return list.
   */
  _getArrangement (data, arrangementString) {
    let arrangement = [];
    if (arrangementString) {
      arrangementString.split(',').forEach(e => {
        // TODO: Allow shorthand format (v1,v2,c,v3) to be used.
        arrangement.push(e);
      });
    } else {
      let parser = new DOMParser();
      let doc = parser.parseFromString(data, 'text/xml');
      // TODO: Automatically arrange it by traversing through measures.
      let nonverses = {};
      doc.querySelectorAll('lyric[name]').forEach(lyric => {
        let i = lyric.getAttribute('name');
        nonverses[i] = i;
      });
      let verses = [];
      doc.querySelectorAll('lyric:not([name])').forEach(lyric => {
        let i = lyric.getAttribute('number');
        verses[i] = i;
      });
      verses.forEach(v => {
        arrangement.push(`verse${v}`);
        Object.keys(nonverses).forEach(nv => {
          arrangement.push(nv);
        });
      });
    }
    if (!arrangement.length) {
      arrangement = ['instrumental'];
    }
    return arrangement;
  }

  _loadExternalMusicXML (section) {
    const url = section.getAttribute('data-musicarranger');
    const formatString = section.getAttribute('data-musicarranger-format');
    return fetch(url)
      .then(res => res.text())
      .then(text => {
        section.outerHTML = this._slidify(text, formatString);
      });
  }

  _processSlides () {
    let promises = [];
    document.querySelectorAll('[data-musicarranger]').forEach(section => {
      if (section.getAttribute('data-musicarranger').length) {
        promises.push(this._loadExternalMusicXML(section));
      } else {
        section.outerHTML = this._slidify(
          section.querySelector('script[type="text/template"]').innerHTML,
          section.getAttribute('data-musiarranger-format')
        );
      }
    });
    return Promise.all(promises);
  }

  /**
   * @brief Create the slide content based on a formatString and the musicXML data.
   * @param formatString Looks like `verse1,chorus,verse2,chorus;option1=value1,option2=value2`.
   */
  _slidify (data, formatString) {
    formatString = formatString || '';
    let arrangementString = formatString.split(';')[0];
    let optionString = formatString.split(';')[1] || '';
    let arrangement = this._getArrangement(data, arrangementString);
    let string = '';
    arrangement.forEach(section => {
      string +=
        `<section data-musicxml data-musicxml-transform="${section};${optionString}">` +
        "<script type='text/template'>" +
        data +
        '</script>' +
        '</section>';
    });
    return string;
  }
}
