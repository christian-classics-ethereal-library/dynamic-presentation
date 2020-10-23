/* globals fetch, verovio */
import { MIDIPlayer } from '../js/MIDIPlayer.js';

export class XMLPlayer extends MIDIPlayer {
  constructor (params, onUpdate, onStop) {
    super(false, onUpdate, onStop);
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
