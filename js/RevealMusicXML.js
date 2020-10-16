/* globals fetch, jQuery */
export class RevealMusicXML {
  constructor (ToolkitType, transformer, highlightNotes = true) {
    this.MIDIDELAY = 380;
    this.ToolkitType = ToolkitType;
    this.toolkits = [];
    this.players = [];
    this.playing = false;
    this.transformer = transformer;
    // TODO: Use Reveal object passed to plugin when that is available.
    // https://github.com/hakimel/reveal.js/issues/2405
    // eslint-disable-next-line no-undef
    this.reveal = Reveal;
    this.resizeTimeout = undefined;
    this.shouldAutoSkip = false;
    this.highlightNotes = highlightNotes;
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
    this.reveal.addKeyBinding(
      { keyCode: 77, key: 'M', description: 'Play/Pause audio' },
      this._playPause.bind(this)
    );
    return this._processSlides().then(() => Promise.resolve());
  }

  // Private methods

  _debug (message) {
    console.log(`RevealMusicXML: ${message}`);
  }

  _getCurrentToolkitNum () {
    let $stack = jQuery('section.stack.present');
    if ($stack.length) {
      let match = $stack.attr('id').match(/RevealMusicXML(\d*)/);
      if (match) {
        return parseInt(match[1]);
      }
    }
    return null;
  }
  _getNextToolkitNum () {
    let $present = jQuery('section.present');
    if ($present.length) {
      let $next = $present.next('section.stack[data-musicxml]');
      if ($next.length) {
        let match = $next.attr('id').match(/RevealMusicXML(\d*)/);
        if (match) {
          return parseInt(match[1]);
        }
      }
    }
    return null;
  }
  _getIndexHForToolkit (toolkitNum) {
    let $stack = jQuery(`#RevealMusicXML${toolkitNum}`);
    if ($stack.length) {
      return $stack
        .parent()
        .children()
        .toArray()
        .indexOf($stack[0]);
    }
    return null;
  }

  _loadExternalMusicXML (section) {
    const url = section.getAttribute('data-musicxml');
    const transformation = section.getAttribute('data-musicxml-transform');
    return fetch(url)
      .then(res => {
        if (res.ok) {
          return res.text();
        } else {
          section.innerHTML = 'Failed to load.';
          throw new Error('Failed to load ' + url);
        }
      })
      .then(text => this.transformer.transform(text, transformation, true))
      .then(text => {
        this._slidify(
          section,
          text,
          this.transformer.transform(text, transformation)
        );
      });
  }

  /* Hooks for this.players[i]. */
  _playerStop () {
    if (typeof this.highlightedIDs !== 'undefined') {
      this.highlightedIDs.forEach(noteid => {
        jQuery('#' + noteid).removeClass('highlightedNote');
      });
    }
    this.playing = false;
    this._playChangeControls();
  }
  _playerUpdate (time) {
    this.shouldAutoSkip = true;
    if (this.highlightNotes === false) {
      return;
    }
    let vrvTime = Math.max(0, time - this.MIDIDELAY);
    let elementsAtTime = this.toolkits[this.playerToolkitNum].getElementsAtTime(
      vrvTime
    );
    if (typeof elementsAtTime.page !== 'undefined' && elementsAtTime.page > 0) {
      if (
        elementsAtTime.page - 1 !== this.reveal.getState().indexv ||
        this.reveal.getState().indexh !==
          this._getIndexHForToolkit(this.playerToolkitNum)
      ) {
        this.reveal.slide(
          this._getIndexHForToolkit(this.playerToolkitNum),
          elementsAtTime.page - 1
        );
      }
      let ids = this.highlightedIDs || [];
      if (elementsAtTime.notes.length > 0 && ids !== elementsAtTime.notes) {
        ids.forEach(function (noteid) {
          if (jQuery.inArray(noteid, elementsAtTime.notes) === -1) {
            jQuery('#' + noteid).removeClass('highlightedNote');
          }
        });
        ids = elementsAtTime.notes;
        ids.forEach(noteid => {
          jQuery('#' + noteid).addClass('highlightedNote');
        });
        this.highlightedIDs = ids;
      }
    }
  }

  _playChangeControls () {
    this.reveal.configure({
      controls: !this.playing || !this.highlightNotes
    });
  }

  _initPlayer (i) {
    if (typeof window['VoidPlayer'] === 'undefined') {
      this._debug('base audio player does not exist. Audio will not play.');
      return {};
    }
    let PlayerType = window['VoidPlayer'];
    let param;

    let root = document.getElementById(`RevealMusicXML${i}`);
    let audio = root.getAttribute('data-musicxml-audio');
    if (audio) {
      if (typeof window['audioPlayer'] !== 'undefined') {
        PlayerType = window['audioPlayer'];
        param = audio;
      }
    }
    return new PlayerType(
      param,
      this._playerUpdate.bind(this),
      this._playerStop.bind(this)
    );
  }

  _playPause () {
    if (this.playing) {
      for (let i = 0; i < this.players.length; i++) {
        if (typeof this.players[i] !== 'undefined') {
          this.players[i].pause();
        }
      }
      this.playing = false;
    } else {
      this.playerToolkitNum = this._getCurrentToolkitNum();
      if (typeof this.players[this.playerToolkitNum] === 'undefined') {
        this.players[this.playerToolkitNum] = this._initPlayer(
          this.playerToolkitNum
        );
      }
      this.players[this.playerToolkitNum].play();
      this.playing = true;
    }
    let hln;
    if (
      (hln = jQuery('section.present')[0].closest(
        '[data-musicxml-highlightnotes]'
      ))
    ) {
      this.highlightNotes = Boolean(hln.dataset.musicxmlHighlightnotes);
    }
    this._playChangeControls();
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
            section.getAttribute('data-musicxml-transform'),
            true
          ),
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
    section.innerHTML = '';
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
    let zoom = 60;
    let size = this.reveal.getComputedSlideSize();
    let pixelHeight = size.height;
    let pixelWidth = size.width;
    let defaultOptions = {
      pageHeight: pixelHeight * (100 / zoom),
      pageWidth: pixelWidth * (100 / zoom),
      scale: zoom,
      breaks: 'line',
      adjustPageHeight: true,
      minLastJustification: 0,
      font:
        window.getComputedStyle(document.documentElement)['font-family'] ||
        'Leipzig'
    };
    let i = this.toolkits.indexOf(toolkit);
    let options = document
      .getElementById(`RevealMusicXML${i}`)
      .getAttribute('data-musicxml-toolkit');
    options = JSON.parse(options || '{}').options || {};
    toolkit.setOptions({ ...defaultOptions, ...options });
  }

  _slidify (section, musicData, data) {
    if (!data) {
      return;
    }
    let i = this.toolkits.length;
    let toolkitName =
      JSON.parse(section.getAttribute('data-musicxml-toolkit') || '{}')
        .toolkit || null;
    let ToolkitType = this.ToolkitType;
    if (toolkitName && window[toolkitName]) {
      ToolkitType = window[toolkitName];
    }
    this.toolkits[i] = new ToolkitType();
    let toolkit = this.toolkits[i];
    section.setAttribute('id', `RevealMusicXML${i}`);
    this._setOptions(toolkit);
    toolkit.setMusicData(musicData);
    toolkit.loadData(data, musicData);
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
