/* globals fetch */
export class RevealMusicArranger {
  init () {
    return this._processSlides().then(() => Promise.resolve());
  }

  _getVerseCount (data) {
    return 3;
  }

  _loadExternalMusicXML (section) {
    const url = section.getAttribute('data-musicarranger');
    const arrangement = section.getAttribute('data-musicarranger-arrangement');
    return fetch(url)
      .then(res => res.text())
      .then(text => {
        section.outerHTML = this._slidify(text, arrangement);
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

  _slidify (data, arrangement) {
    let max = this._getVerseCount(data);
    let string = '';
    for (let i = 1; i <= max; i++) {
      string +=
        `<section data-musicxml data-musicxml-transform="verse${i}">` +
        "<script type='text/template'>" +
        data +
        '</script>' +
        '</section>';
    }
    return string;
  }
}
