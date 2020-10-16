/* globals Audio */

import { VoidPlayer } from '../js/VoidPlayer.js';

export class AudioPlayer extends VoidPlayer {
  constructor (params, onUpdate, onStop) {
    super(params, onUpdate, onStop);
    this._audio = new Audio(params);
    this._audio.onplay = this._update.bind(this);
    this._playing = false;
  }
  play () {
    this._audio.play();
    this._playing = true;
  }
  pause () {
    this._audio.pause();
    this._playing = false;
  }
  getTimestamp () {
    return this._audio.currentTime * 1000;
  }
}
