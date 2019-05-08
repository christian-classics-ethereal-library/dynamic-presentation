/* globals Reveal, verovio */
import { RevealMusicXML } from './RevealMusicXML.js';
import { PianoRollToolkit } from './PianoRollToolkit.js';
import { MusicXMLTransformer } from './MusicXMLTransformer.js';

function urlParam (name) {
  var results = new RegExp('[?&]' + name + '=([^&#]*)').exec(
    window.location.search
  );
  return results !== null ? results[1] || 0 : false;
}

let mxt = new MusicXMLTransformer();
let tk;
if (urlParam('toolkit') === 'verovio') {
  // eslint-disable-next-line
  tk = new verovio.toolkit();
} else {
  tk = new PianoRollToolkit();
}
let rmx = new RevealMusicXML(tk, mxt);
Reveal.registerPlugin('musicxml', rmx);
