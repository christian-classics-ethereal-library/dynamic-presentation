/* globals fetch, jQuery */
export class RevealMusicXML {
  constructor (ToolkitType, transformer, highlightNotes = true) {
    this.MIDIDELAY = 380;
    this.TIMEMAPOFFSET = 0.3;
    this.ToolkitType = ToolkitType;
    this.toolkits = [];
    this.players = [];
    this.timemaps = [];
    this.playing = false;
    this.transformer = transformer;
    // TODO: Use Reveal object passed to plugin when that is available.
    // https://github.com/hakimel/reveal.js/issues/2405
    // eslint-disable-next-line no-undef
    this.reveal = Reveal;
    this.resizeTimeout = undefined;
    this.shouldAutoSkip = false;
    this.highlightNotes = highlightNotes;
    this.currentLowKi = 0;
    this.currentHighKi = 0;
    this.shouldPause = false;
    this.timemapMode = '';
    this.timestampInProgress = {};
    this.systems = [];
    this.currentSystemNum = 0;
    this.startOfSystem = true;
    this.playbackRates = [];
    this.defaultTempos = [];
    this.currentTempos = [];
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

  _highlightAtTime (time) {
    let thisToolkit = this.toolkits[this.playerToolkitNum];
    let elementsAtTime = thisToolkit.getElementsAtTime(time);
    let millisecEarly =
      300 *
      (this.defaultTempos[this.playerToolkitNum] /
        this.currentTempos[this.playerToolkitNum]);
    let elementsInFuture = thisToolkit.getElementsAtTime(time + millisecEarly);
    // If the note(s) 0.3 seconds (in the base tempo) from now are on the next page, highlight those instead
    if (
      typeof elementsAtTime.page !== 'undefined' &&
      typeof elementsInFuture.page !== 'undefined' &&
      elementsAtTime.page > 0 &&
      elementsInFuture.page > 0 &&
      elementsAtTime.page !== elementsInFuture.page
    ) {
      elementsAtTime = elementsInFuture;
    }
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
        let chordIDs = [];
        ids.forEach(noteid => {
          /* If this note is the child of the chord, we also want to highlight the chord. */
          let note = document.getElementById(noteid);
          if (note.parentElement.id.startsWith('chord-')) {
            chordIDs.push(note.parentElement.id);
            note.parentElement.classList.add('highlightedNote');
          }
          note.classList.add('highlightedNote');
        });
        this.highlightedIDs = ids.concat(chordIDs);
      }
    }
  }

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

  // From https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
  _download (filename, text) {
    var element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:text/plain;charset=utf-8,' + encodeURIComponent(text)
    );
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  /* Hooks for this.players[i]. */
  _playerEnd () {
    if (this.timemapMode === 'create') {
      let timemapText = '';
      for (const xmlTime in this.timestampInProgress) {
        timemapText += `${xmlTime}\t${this.timestampInProgress[xmlTime]}\n`;
      }

      // Download the timemap
      this._download('timemap.txt', timemapText);
    }
  }
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
    if (this.highlightNotes === false || this.timemapMode === 'create') {
      return;
    }
    let vrvTime = Math.max(0, time - this.MIDIDELAY);
    if (typeof this.timemaps[this.playerToolkitNum] !== 'undefined') {
      // TODO: Figure out if there needs to be a different MIDIDELAY added.
      vrvTime =
        this._timemap(vrvTime / 1000, this.timemaps[this.playerToolkitNum]) *
        1000;
    }
    this._highlightAtTime(vrvTime);
    if (this.shouldPause) {
      this._playPause();
      this.shouldPause = false;
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
    if (this.timemapMode === 'test') {
      if (
        this.currentLowKi !== map[keys[lowKi]] ||
        this.currentHighKi !== map[keys[highKi]]
      ) {
        this.currentLowKi = map[keys[lowKi]];
        this.currentHighKi = map[keys[highKi]];
        this.shouldPause = true;
      }
    }
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

    let present = document.getElementsByClassName(`present`);
    this.timemapMode = present.length
      ? present.item(0).getAttribute('data-timemap-mode')
      : '';
    // If the user is creating a timemap file...
    if (this.timemapMode === 'create') {
      // When they press space...
      this.reveal.addKeyBinding(
        { keyCode: 32, key: ' ', description: 'Record time' },
        function () {
          if (
            this.playing &&
            this.systems.length >= this.currentSystemNum + 1
          ) {
            // Get the time in the audio recording
            let player = this.players[this.playerToolkitNum];
            let audioTime = player.getTimestamp();
            // Get the current time in the midi file
            let toolkit = this.toolkits[this.playerToolkitNum];
            let thisNoteID = '';
            if (this.startOfSystem) {
              thisNoteID = this.systems
                .eq(this.currentSystemNum)
                .find('.note')
                .first()
                .attr('id');
            } else {
              thisNoteID = this.systems
                .eq(this.currentSystemNum)
                .find('.note')
                .last()
                .attr('id');
            }
            let midiTime = toolkit.getTimeForElement(thisNoteID);
            // Record time
            this.timestampInProgress[midiTime / 1000] =
              audioTime / 1000 - this.TIMEMAPOFFSET;
            console.log(midiTime / 1000, audioTime / 1000 - this.TIMEMAPOFFSET);
            // Update to end of this system or next system
            if (this.startOfSystem) {
              this.startOfSystem = false;
            } else {
              this.startOfSystem = true;
              this.currentSystemNum += 1;
            }
            if (this.systems.length > this.currentSystemNum) {
              // If any system before the last one or start of the last one, highlight next notes
              let nextNoteID = '';
              if (this.startOfSystem) {
                nextNoteID = this.systems
                  .eq(this.currentSystemNum)
                  .find('.note')
                  .first()
                  .attr('id');
              } else {
                nextNoteID = this.systems
                  .eq(this.currentSystemNum)
                  .find('.note')
                  .last()
                  .attr('id');
              }
              let nextTime = toolkit.getTimeForElement(nextNoteID);
              this._highlightAtTime(nextTime + 10);
            } else {
              // If end of last system, remove all highlights
              this.highlightedIDs.forEach(noteid => {
                jQuery('#' + noteid).removeClass('highlightedNote');
              });
            }
          }
        }.bind(this)
      );
      // When they press backspace...
      this.reveal.addKeyBinding(
        { keyCode: 8, key: 'Backspace', description: 'Delete previous time' },
        function () {
          if (
            this.playing &&
            (this.currentSystemNum > 0 || !this.startOfSystem)
          ) {
            // Update to end of prev system or start of this system
            if (this.startOfSystem) {
              this.startOfSystem = false;
              this.currentSystemNum -= 1;
            } else {
              this.startOfSystem = true;
            }
            // Get the time of the first note in the previous system in the midi
            let toolkit = this.toolkits[this.playerToolkitNum];
            let prevNoteID = '';
            if (this.startOfSystem) {
              prevNoteID = this.systems
                .eq(this.currentSystemNum)
                .find('.note')
                .first()
                .attr('id');
            } else {
              prevNoteID = this.systems
                .eq(this.currentSystemNum)
                .find('.note')
                .last()
                .attr('id');
            }
            let prevTime = toolkit.getTimeForElement(prevNoteID);
            // Delete previous time and highlight previous note
            delete this.timestampInProgress[prevTime / 1000];
            this._highlightAtTime(prevTime + 10);
          }
        }.bind(this)
      );
    }

    let root = document.getElementById(`RevealMusicXML${i}`);
    this.playbackRates[i] = Number(root.getAttribute('data-playback-rate'));
    if (!this.playbackRates[i] || this.playbackRates[i] <= 0) {
      this.playbackRates[i] = 1;
    }
    this.defaultTempos[i] = Number(root.getAttribute('data-default-tempo'));
    if (!this.defaultTempos[i] || this.defaultTempos[i] <= 0) {
      this.defaultTempos[i] = 120;
    }
    this.currentTempos[i] = Number(root.getAttribute('data-current-tempo'));
    if (!this.currentTempos[i] || this.currentTempos[i] <= 0) {
      this.currentTempos[i] = 120;
    }

    let audio = root.getAttribute('data-musicxml-audio');
    if (audio) {
      if (
        typeof window['MIDIPlayer'] !== 'undefined' &&
        audio.indexOf('.mid') !== -1
      ) {
        PlayerType = window['MIDIPlayer'];
        param = audio;
      } else if (
        typeof window['MIDIPlayer'] !== 'undefined' &&
        typeof window['verovio'] !== 'undefined' &&
        (audio.indexOf('.musicxml') !== -1 || audio.indexOf('.mei') !== -1)
      ) {
        PlayerType = window['XMLPlayer'];
        param = [audio, this.toolkits[i].getOptions()];
      } else if (
        typeof window['YouTubePlayer'] !== 'undefined' &&
        (audio.indexOf('youtube.com/') !== -1 ||
          audio.indexOf('://youtu.be/') !== -1)
      ) {
        PlayerType = window['YouTubePlayer'];
        param = audio;
      } else if (typeof window['AudioPlayer'] !== 'undefined') {
        PlayerType = window['AudioPlayer'];
        param = audio;
      }
    } else {
      PlayerType = window['MIDIPlayer'];
      param = this.toolkits[i].renderToMIDI();
    }
    return new PlayerType(
      param,
      this._playerUpdate.bind(this),
      this._playerStop.bind(this),
      this._playerEnd.bind(this),
      this.playbackRates[i]
    );
  }

  _fetchTimeMap (i) {
    let root = document.getElementById(`RevealMusicXML${i}`);
    this.timemaps[i] = {};
    if (typeof root.dataset['musicxmlAudioTimemap'] !== 'undefined') {
      fetch(root.dataset['musicxmlAudioTimemap'])
        .then(res => {
          if (res.ok) {
            return res.text();
          } else {
            // Disable highlighting if the timemap fails to load
            this.highlightNotes = false;
            this.highlightedIDs.forEach(noteid => {
              jQuery('#' + noteid).removeClass('highlightedNote');
            });
            throw new Error(
              'Failed to load ' + root.dataset['musicxmlAudioTimemap']
            );
          }
        })

        .then(text => {
          let lines = text.split('\n');
          for (let j = 0; j < lines.length; j++) {
            if (lines[j] && lines[j][0] !== '#') {
              let parts = lines[j].split('\t');
              // Key is the time of the audio file (coerce to float),
              // Value is the time of the music document.
              this.timemaps[i][parseFloat(parts[1]) + 0.001] = parseFloat(
                parts[0]
              );
            }
          }
        });
    } else {
      this.timemaps[i] = undefined;
    }
  }

  _playPause () {
    if (this.playing) {
      for (let i = 0; i < this.players.length; i++) {
        if (typeof this.players[i] !== 'undefined') {
          if (i !== this._getCurrentToolkitNum()) {
            this.players[i].stop();
          } else {
            this.players[i].pause();
          }
        }
      }
      this.playing = false;
    } else {
      this.playerToolkitNum = this._getCurrentToolkitNum();
      if (typeof this.players[this.playerToolkitNum] === 'undefined') {
        this.players[this.playerToolkitNum] = this._initPlayer(
          this.playerToolkitNum
        );
        if (this.timemapMode === 'create') {
          this.systems = jQuery('.reveal').find(jQuery('[id|=system]'));
          if (this.systems.length > 0) {
            let toolkit = this.toolkits[this.playerToolkitNum];
            let firstTime = toolkit.getTimeForElement(
              this.systems
                .eq(0)
                .find('.note')
                .attr('id')
            );
            this._highlightAtTime(firstTime + 10);
          }
        } else {
          this._fetchTimeMap(this.playerToolkitNum);
        }
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
    if (typeof toolkit.setMusicData !== 'undefined') {
      toolkit.setMusicData(musicData);
    }
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
