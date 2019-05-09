/* globals Reveal, verovio */
import { MusicXMLTransformer } from '../js/MusicXMLTransformer.js';
import { PianoRollToolkit } from '../js/PianoRollToolkit.js';
import { RevealMusicArranger } from '../js/RevealMusicArranger.js';
import { RevealMusicXML } from '../js/RevealMusicXML.js';

function urlParam (name) {
  var results = new RegExp('[?&]' + name + '=([^&#]*)').exec(
    window.location.search
  );
  return results !== null ? results[1] || 0 : false;
}

let rma = new RevealMusicArranger();

let mxt = new MusicXMLTransformer();
let tk;
if (urlParam('toolkit') === 'verovio') {
  // eslint-disable-next-line
  tk = new verovio.toolkit();
} else {
  tk = new PianoRollToolkit();
}
let rmx = new RevealMusicXML(tk, mxt);

// TODO: Use Reveal.registerPlugin when we can be sure that one loads before the other.
rma
  .init()
  .then(() => rmx.init())
  .then(() => Reveal.slide(0, 0));
