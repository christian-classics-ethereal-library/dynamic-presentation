/* globals fetch, jQuery, pause, play */

import { VoidPlayer } from '../js/VoidPlayer.js';

export class MIDIPlayer extends VoidPlayer {
  constructor (params, onUpdate, onStop) {
    super(params, onUpdate, onStop);
    // TODO: Use different id for different players.
    if (!jQuery('#player')[0]) {
      jQuery('body').prepend(jQuery('<div id="player">'));
      jQuery('#player').midiPlayer({
        onUpdate: onUpdate,
        onStop: onStop,
        width: 250
      });
      jQuery('#player').hide();
    }
    this._data = false;
    // MIDI files start with "MThd". Check that the base64 starts like that.
    if (params && params.substring(0, 4) !== window.btoa('MTh')) {
      // If this is not proper data, treat as URL.
      fetch(params)
        .then(res => {
          if (res.ok) return res.arrayBuffer();
        })
        .then(buf => {
          let base64 = this._arrayBufferToBase64(buf);
          // MIDI files start with "MThd". Check that the base64 starts like that.
          if (base64.substring(0, 4) === window.btoa('MTh')) {
            this._data = base64;
          }
        });
    } else {
      this._data = params;
    }
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

  // Note: This function runs asyncronously.
  play () {
    if (!this._data) {
      // If the data hasn't been loaded yet, call this again shortly.
      // TODO: Make sure this won't get called infinitely if data fails to load.
      setTimeout(this.play.bind(this), 20);
      return;
    }
    if (!this._isLoaded()) {
      jQuery('#player').midiPlayer.play('data:audio/midi;base64,' + this._data);
      jQuery('#player').attr('hash', this._hashCode(this._data));
    } else {
      play();
    }
  }
  pause () {
    // TODO: Slightly roll back playback so less is missed when resumed.
    pause();
  }

  _isLoaded () {
    return (
      jQuery('#player').attr('hash') === this._hashCode(this._data).toString()
    );
  }

  _hashCode (str) {
    return str
      .split('')
      .reduce(
        (prevHash, currVal) =>
          ((prevHash << 5) - prevHash + currVal.charCodeAt(0)) | 0,
        0
      );
  }
}
