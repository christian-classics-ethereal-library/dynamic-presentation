/* globals DOMParser, fetch */
export class RevealMusicArranger {
  init () {
    return this._processSlides().then(() => Promise.resolve());
  }

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
    return arrangement;
  }

  _loadExternalMusicXML (section) {
    const url = section.getAttribute('data-musicarranger');
    const arrangementString = section.getAttribute(
      'data-musicarranger-arrangement'
    );
    return fetch(url)
      .then(res => res.text())
      .then(text => {
        section.outerHTML = this._slidify(text, arrangementString);
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
          section.getAttribute('data-musiarranger-arrangement')
        );
      }
    });
    return Promise.all(promises);
  }

  _slidify (data, arrangementString) {
    let arrangement = this._getArrangement(data, arrangementString);
    let string = '';
    arrangement.forEach(section => {
      string +=
        `<section data-musicxml data-musicxml-transform="${section}">` +
        "<script type='text/template'>" +
        data +
        '</script>' +
        '</section>';
    });
    return string;
  }
}
