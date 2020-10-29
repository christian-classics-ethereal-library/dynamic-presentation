/* globals jQuery */

import { VoidPlayer } from '../js/VoidPlayer.js';

export class YouTubePlayer extends VoidPlayer {
  constructor (url, onUpdate, onStop) {
    super(url, onUpdate, onStop);
    this._youtubeCode = this._extractVideoID(url);
    this._playTryCount = 0;
    if (!jQuery('#youtubeplayer')[0]) {
      jQuery('body').prepend(jQuery(this._getIFrame()));
    }
  }

  play () {
    // TODO: Use YouTube Player API to check if this exists
    if (!jQuery('#youtubeplayer .ytp-large-play-button').length) {
      if (!jQuery(`#youtubeplayer[src*="${this._youtubeCode}"]`).length) {
        document.getElementById('youtubeplayer').outerHTML = this._getIFrame();
      }
      // If the iframe hasn't been loaded yet, call this again shortly.
      this._playTryCount++;
      if (this._playTryCount < 20) {
        setTimeout(this.play.bind(this), 20);
      } else {
        this._playTryCount = 0;
        console.log('YouTubePlayer: Could not play the audio');
      }
      return;
    }
    jQuery('#youtubeplayer').show();
    // TODO: Use YouTube Player API to play this audio.
    jQuery('#youtubeplayer .ytp-large-play-button').click();
    this._playing = true;
    this._update();
  }
  pause () {
    // TODO: Use YouTube Player API to pause the video.
    jQuery('#youtubeplayer .ytp-play-button[aria-label*="Pause"]').click();
    this._playing = false;
  }
  stop () {
    this.pause();
    jQuery('#youtubeplayer').hide();
    this.onStop();
  }
  getTimestamp () {
    // TODO: Use YouTube Player API to get timestamp.
    return jQuery('#youtubeplayer video').currentTime * 1000;
  }

  _getIFrame () {
    return `<iframe id="youtubeplayer" width="200" height="200"
      style="position: absolute; opacity: 50%; z-index: 20;"
      src="https://www.youtube-nocookie.com/embed/${this._youtubeCode}"
      frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen>
    </iframe>`;
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
