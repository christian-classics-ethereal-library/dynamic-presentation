/* globals fetch, verovio */
import { MIDIPlayer } from '../js/MIDIPlayer.js?v=1.7.0';

export class XMLPlayer extends MIDIPlayer {
  constructor (params, onUpdate, onStop, onEnd, playbackRate) {
    super(false, onUpdate, onStop, onEnd, playbackRate);
    fetch(params[0])
      .then(res => {
        if (res.ok) {
          return res.text();
        } else {
          throw new Error('Failed to load ' + params[0]);
        }
      })
      .then(text => {
        // eslint-disable-next-line new-cap
        let newVerovio = new verovio.toolkit();
        newVerovio.setOptions(params[1]);
        newVerovio.loadData(text);
        this._data = newVerovio.renderToMIDI();
      });
  }
}
