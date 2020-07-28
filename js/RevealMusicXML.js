/* globals Audio, fetch, jQuery */
export class RevealMusicXML {
  constructor (ToolkitType, transformer) {
    this.MIDIDELAY = 380;
    this.ToolkitType = ToolkitType;
    this.toolkits = [];
    this.audio = false;
    this.timemap = {};
    this.transformer = transformer;
    // TODO: Use Reveal object passed to plugin when that is available.
    // https://github.com/hakimel/reveal.js/issues/2405
    // eslint-disable-next-line no-undef
    this.reveal = Reveal;
    this.resizeTimeout = undefined;
    this.shouldAutoSkip = false;
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
      .then(text => this.transformer.transform(text, transformation))
      .then(text => {
        this._slidify(section, text);
      });
  }

  /* Hooks for jQuery.midiplayer. */
  _playerStop () {
    if (this.shouldAutoSkip) {
      if (typeof this.highlightedIDs !== 'undefined') {
        this.highlightedIDs.forEach(noteid => {
          jQuery('#' + noteid).removeClass('highlightedNote');
        });
      }
      this.playerToolkitNum = this._getNextToolkitNum();
      this.playing = this._playNext();
      this.shouldAutoSkip = false;
    }
  }
  _playerUpdate (time) {
    this.shouldAutoSkip = true;
    let vrvTime = Math.max(0, time - this.MIDIDELAY);
    if (this.timemap) {
      // TODO: Figure out if there needs to be a different MIDIDELAY added.
      vrvTime = this._timemap(vrvTime / 1000, this.timemap) * 1000;
    }
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

  /**
   * @brief Interpolate adjusted time from a map of input => output.
   */
  _timemap (time, map) {
    if (typeof map[time] !== 'undefined') {
      return map[time];
    }
    let keys = Object.keys(map);
    let lowKi = -1;
    let highKi = keys.length;
    // Binary search for closest keys
    while (1 + lowKi < highKi) {
      const midKi = lowKi + ((highKi - lowKi) >> 1);
      if (keys[midKi] > time) {
        highKi = midKi;
      } else {
        lowKi = midKi;
      }
    }
    if (lowKi === -1) return 0;
    if (highKi === keys.length) return 100;
    return this._map(
      time,
      keys[lowKi],
      keys[highKi],
      map[keys[lowKi]],
      map[keys[highKi]]
    );
  }
  _map (x, inMin, inMax, outMin, outMax) {
    return ((x - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  }

  _playChangeControls () {
    this.reveal.configure({
      controls: !this.playing
    });
  }

  /**
   * @brief Load and play the midi from the next toolkit.
   * @returns false if there is no "next toolkit", true if it is playing.
   */
  _playNext () {
    if (typeof this.toolkits[this.playerToolkitNum] !== 'undefined') {
      return this._playMIDI(this.toolkits[this.playerToolkitNum]);
    }
    return false;
  }

  _playPause () {
    if (!this.playing) {
      if (!jQuery('#player')[0]) {
        this.playerToolkitNum = this._getCurrentToolkitNum();
        this.playing = this._playNext();
      } else if (
        this._getIndexHForToolkit(this.playerToolkitNum) !==
        this.reveal.getState().indexh
      ) {
        this.playerToolkitNum = this._getCurrentToolkitNum();
        this.playing = this._playNext();
      } else {
        if (this.audio) {
          this.audio.play();
        } else {
          // TODO: fix midiPlayer.play to work when the data is already loaded.
          // https://github.com/rism-ch/midi-player/issues/11
          // jQuery('#player').midiPlayer.play();
          // eslint-disable-next-line no-undef
          play();
        }
        this.playing = true;
      }
    } else {
      if (this.audio) {
        this.audio.pause();
      } else {
        // TODO: Use jQuery pause interface when it is available
        // https://github.com/rism-ch/midi-player/pull/10
        // jQuery('#player').midiPlayer.pause();
        // eslint-disable-next-line no-undef
        pause();
      }
      this.playing = false;
      this.shouldAutoSkip = false;
    }
    this._playChangeControls();
  }

  _audioUpdate () {
    if (this.audio && this.playing) {
      this._playerUpdate(this.audio.currentTime * 1000 + this.MIDIDELAY);
      setTimeout(this._audioUpdate.bind(this), 20);
    }
  }

  /**
   * @brief Loads and plays audio from a specified toolkit.
   * @return true if it is playing.
   */
  _playMIDI (toolkit) {
    this.audio = false;
    this.timemap = {};
    if (!jQuery('#player')[0]) {
      jQuery('body').prepend(jQuery('<div id="player">'));
      jQuery('#player').midiPlayer({
        onUpdate: this._playerUpdate.bind(this),
        onStop: this._playerStop.bind(this),
        width: 250
      });
    }
    let el = document.getElementById('RevealMusicXML' + this.playerToolkitNum);
    if (typeof el.dataset['musicxmlAudio'] !== 'undefined') {
      if (typeof el.dataset['musicxmlAudioTimemap'] !== 'undefined') {
        fetch(el.dataset['musicxmlAudioTimemap'])
          .then(res => {
            if (res.ok) {
              return res.text();
            } else {
              throw new Error(
                'Failed to load ' + el.dataset['musicxmlAudioTimemap']
              );
            }
          })

          .then(text => {
            let lines = text.split('\n');
            for (let i = 0; i < lines.length; i++) {
              if (lines[i] && lines[i][0] !== '#') {
                let parts = lines[i].split('\t');
                // Key is the time of the audio file (coerce to float),
                // Value is the time of the music document.
                this.timemap[parseFloat(parts[1]) + 0.001] = parseFloat(
                  parts[0]
                );
              }
            }
          });
      }
      if (el.dataset['musicxmlAudio'].indexOf('.mp3') !== -1) {
        jQuery('#player').hide();
        this.audio = new Audio(el.dataset['musicxmlAudio']);
        this.audio.onplay = this._audioUpdate.bind(this);
        this.audio.play();
        return true;
      }
      fetch(el.dataset['musicxmlAudio'])
        .then(res => {
          if (res.ok) return res.arrayBuffer();
        })
        .then(buf => {
          let base64 = this._arrayBufferToBase64(buf);
          // MIDI files start with "MThd". Check that the base64 starts like that.
          if (base64.substring(0, 4) === window.btoa('MTh')) {
            return this._playBase64MIDI(base64);
          }
        });
      return true;
    }
    let base64midi = toolkit.renderToMIDI();
    return this._playBase64MIDI(base64midi);
  }

  _playBase64MIDI (base64midi) {
    let song = 'data:audio/midi;base64,' + base64midi;
    jQuery('#player').show();
    jQuery('#player').midiPlayer.play(song);
    this.playing = true;
    this._playChangeControls();
    return this.playing;
  }

  _arrayBufferToBase64 (buffer) {
    var binary = '';
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
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

  _slidify (section, data) {
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
