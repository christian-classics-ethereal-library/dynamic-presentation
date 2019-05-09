/* globals fetch */
export class RevealMusicXML {
  constructor (toolkit, transformer) {
    this.toolkit = toolkit;
    this.transformer = transformer;
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
    if (typeof this.transformer === 'undefined') {
      // Create a dummy transformer that does no transformation.
      this.transformer = { transform: (data, transformation) => data };
    }
    return this._processSlides().then(() => Promise.resolve());
  }

  // Private methods

  _loadExternalMusicXML (section) {
    const url = section.getAttribute('data-musicxml');
    const transformation = section.getAttribute('data-musicxml-transform');
    return fetch(url)
      .then(res => res.text())
      .then(text => this.transformer.transform(text, transformation))
      .then(text => {
        section.innerHTML = this._slidify(text);
      });
  }

  _processSlides () {
    let promises = [];
    document.querySelectorAll('[data-musicxml]').forEach(section => {
      if (section.getAttribute('data-musicxml').length) {
        promises.push(this._loadExternalMusicXML(section));
      } else {
        section.innerHTML = this._slidify(
          this.transformer.transform(
            section.querySelector('script[type="text/template"]').innerHTML,
            section.getAttribute('data-musicxml-transform')
          )
        );
      }
    });
    return Promise.all(promises);
  }

  _slidify (data) {
    let zoom = 50;
    // TODO: Fix this to take Reveal's width and height;
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
