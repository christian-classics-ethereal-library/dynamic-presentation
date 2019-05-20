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
    // TODO: Use API to get width and height when that gets implemented
    // (https://github.com/hakimel/reveal.js/issues/2409).
    // eslint-disable-next-line no-undef
    let pixelHeight = parseFloat(jQuery('.slides').css('height'));
    // eslint-disable-next-line no-undef
    let pixelWidth = parseFloat(jQuery('.slides').css('width'));
    this.toolkit.setOptions({
      pageHeight: pixelHeight * (100 / zoom),
      pageWidth: pixelWidth * (100 / zoom),
      scale: zoom,
      // TODO: change to proper definition of "line" when that gets implemented
      // (https://github.com/rism-ch/verovio/issues/1056).
      breaks: 'line',
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
