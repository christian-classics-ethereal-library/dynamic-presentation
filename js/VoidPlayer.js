/* globals Date */
export class VoidPlayer {
  constructor (params, onUpdate, onStop) {
    this.params = params;
    this.onUpdate = onUpdate;
    this.onStop = onStop;
    this._playing = false;
    this._seekPosAtPlay = 0;
    this._dateAtPlay = 0;
    this._timeout = null;
  }
  play () {
    this._dateAtPlay = new Date().getTime();
    this._playing = true;
    this._update();
    // Play for 5 seconds, then stop.
    this._timeout = setTimeout(() => {
      this.stop();
    }, 5 * 1000);
  }
  pause () {
    this._seekPosAtPlay = this.getTimestamp();
    this._playing = false;
    clearTimeout(this._timeout);
  }
  stop () {
    this.pause();
    this._seekPosAtPlay = 0;
    this.onStop();
  }
  getTimestamp () {
    return this._seekPosAtPlay + (new Date().getTime() - this._dateAtPlay);
  }
  _update () {
    this.onUpdate(this.getTimestamp());
    if (this._playing) {
      setTimeout(() => {
        this._update();
      }, 20);
    }
  }
}
