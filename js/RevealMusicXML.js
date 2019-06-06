/* globals fetch, jQuery, Reveal */
export class RevealMusicXML {
  constructor (ToolkitType, transformer) {
    this.ToolkitType = ToolkitType;
    this.toolkits = [];
    this.transformer = transformer;
    this.reveal = Reveal;
    this.resizeTimeout = undefined;
  }

  /**
   * @brief The init function will be called by Reveal when this is loaded.
   * @return A promise.
   */
  init () {
    if (typeof this.ToolkitType === 'undefined') {
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
        this._slidify(section, text);
      });
  }

  _playMIDI (toolkit) {
    if (!jQuery('#player')[0]) {
      jQuery('body').prepend(jQuery('<div id="player">'));
      jQuery('#player').midiPlayer({
        // onUpdate: midiUpdate,
        // onStop: midiStop,
        width: 250
      });
    }
    let base64midi = toolkit.renderToMIDI();
    let song = 'data:audio/midi;base64,' + base64midi;
    jQuery('#player').show();
    jQuery('#player').midiPlayer.play(song);
  }

  _processSlides () {
    let promises = [];
    document.querySelectorAll('[data-musicxml]').forEach(section => {
      if (section.getAttribute('data-musicxml').length) {
        promises.push(this._loadExternalMusicXML(section));
      } else {
        this._slidify(
          section,
          this.transformer.transform(
            section.querySelector('script[type="text/template"]').innerHTML,
            section.getAttribute('data-musicxml-transform')
          )
        );
      }
    });
    return Promise.all(promises);
  }

  _render (section, toolkit) {
    let max = toolkit.getPageCount();
    section.querySelectorAll('section').forEach(oldChildSection => {
      section.removeChild(oldChildSection);
    });
    for (let i = 1; i <= max; i++) {
      let cSection = section.appendChild(document.createElement('section'));
      cSection.innerHTML = toolkit.renderToSVG(i, {});
    }
  }
  _reslidify () {
    this.toolkits.forEach((toolkit, i) => {
      this._setOptions(toolkit);
      toolkit.redoLayout();
      let section = document.getElementById(`RevealMusicXML${i}`);
      this._render(section, toolkit);
    });
    let indices = this.reveal.getIndices();
    this.reveal.slide(indices.h, indices.v, indices.f);
  }

  _setOptions (toolkit) {
    let zoom = 50;
    // TODO: Use API to get width and height when that gets implemented
    // (https://github.com/hakimel/reveal.js/issues/2409).
    // TODO: or ensure that this will work with future versions of jQuery.
    let pixelHeight = parseFloat(jQuery('.slides').css('height'));
    let pixelWidth = parseFloat(jQuery('.slides').css('width'));
    toolkit.setOptions({
      pageHeight: pixelHeight * (100 / zoom),
      pageWidth: pixelWidth * (100 / zoom),
      scale: zoom,
      // TODO: change to proper definition of "line" when that gets implemented
      // (https://github.com/rism-ch/verovio/issues/1056).
      breaks: 'line',
      adjustPageHeight: true,
      minLastJustification: 0,
      font:
        window.getComputedStyle(document.documentElement)['font-family'] ||
        'Leipzig'
    });
  }

  _slidify (section, data) {
    let i = this.toolkits.length;
    this.toolkits[i] = new this.ToolkitType();
    let toolkit = this.toolkits[i];
    section.setAttribute('id', `RevealMusicXML${i}`);
    this._setOptions(toolkit);
    toolkit.loadData(data);
    this._render(section, toolkit);
    // TODO: Possibly use Reveal's 'resize' event when it works with percentage sizes
    // (https://github.com/hakimel/reveal.js/issues/2411).
    window.addEventListener('resize', () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this._reslidify();
      }, 100);
    });
  }
}
