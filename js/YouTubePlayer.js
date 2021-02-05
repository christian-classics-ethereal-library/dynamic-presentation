/* globals jQuery */

import { VoidPlayer } from '../js/VoidPlayer.js';

export class YouTubePlayer extends VoidPlayer {
  constructor (url, onUpdate, onStop, onEnd, playbackRate) {
    super(url, onUpdate, onStop, onEnd, playbackRate);
    this._youtubeCode = this._extractVideoID(url);
    this._player = window.ytplayer;
    this._player.loadVideoByUrl(
      'https://www.youtube.com/embed/' + this._youtubeCode
    );
    // This function might round down to a number like 0.25, 0.5, 0.75, ..., 2?
    // On YouTube's pages, you have more control, see https://webapps.stackexchange.com/a/54506
    this._player.setPlaybackRate(playbackRate);
    jQuery('#youtube-player').show();
  }

  play () {
    this._player.playVideo();
    this._playing = true;
    this._update();
  }
  pause () {
    this._player.pauseVideo();
    this._playing = false;
  }
  stop () {
    this._player.stopVideo();
    jQuery('#youtube-player').hide();
    this.onEnd();
    this.onStop();
  }
  getTimestamp () {
    return this._player.getCurrentTime() * 1000;
  }

  // https://www.labnol.org/code/19797-regex-youtube-id/
  _extractVideoID (url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    var match = url.match(regExp);
    if (match && match[7].length === 11) {
      return match[7];
    }
    console.log('Could not extract video ID.');
    return false;
  }
}
