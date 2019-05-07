/* globals fetch */
export class RevealMusicXML {
  constructor (toolkit) {
    this.toolkit = toolkit;
  }

  /**
   * @brief The init function will be called by Reveal when this is loaded.
   * @return A promise.
   */
  init () {
    if (typeof this.toolkit === 'undefined') {
      throw new Error(
        'RevealMusicXML needs to be constructed with a rendering toolkit.'
      );
    }
    return this._processSlides();
  }

  // Private methods

  _convertSlides () {
    return Promise.resolve();
  }

  _loadExternalMusicXML (section) {
    const url = section.getAttribute('data-musicxml');
    return fetch(url)
      .then(res => res.text())
      .then(text => {
        section.innerHTML = this._slidify(text);
      });
  }

  _processSlides () {
    document.querySelectorAll('[data-musicxml]').forEach((section, i) => {
      if (section.getAttribute('data-musicxml').length) {
        this._loadExternalMusicXML(section);
      } else {
        section.innerHTML = this._slidify(
          section.querySelector('script[type="text/template"]').innerHTML
        );
      }
    });
  }

  _slidify (data) {
    let zoom = 50;
    this.toolkit.setOptions({
      pageHeight: (700 * 100) / zoom,
      pageWidth: (960 * 100) / zoom,
      scale: zoom,
      adjustPageHeight: true
    });
    this.toolkit.loadData(data);
    let max = this.toolkit.getPageCount();
    let string = '';
    for (let i = 1; i <= max; i++) {
      string += '<section>' + this.toolkit.renderToSVG(i, {}) + '</section>';
    }
    return string;
  }
}
