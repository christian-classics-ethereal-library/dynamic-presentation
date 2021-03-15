/* globals Audio */

import { VoidPlayer } from '../js/VoidPlayer.js?v=1.8.0';

export class AudioPlayer extends VoidPlayer {
  constructor (params, onUpdate, onStop, onEnd, playbackRate) {
    super(params, onUpdate, onStop, onEnd, playbackRate);
    this._audio = new Audio(params);
    this._audio.onplay = this._update.bind(this);
    this._audio.addEventListener('ended', onEnd);
    this._playing = false;
    this._audio.playbackRate = playbackRate;
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
