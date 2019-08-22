/* globals Reveal, verovio */
import { MusicXMLTransformer } from '../js/MusicXMLTransformer.js';
import { PianoRollToolkit } from '../js/PianoRollToolkit.js';
import { RevealMusicArranger } from '../js/RevealMusicArranger.js';
import { RevealMusicXML } from '../js/RevealMusicXML.js';
import { TextOnlyToolkit } from '../js/TextOnlyToolkit.js';
import { urlParam } from '../js/urlParam.js';
import { VerovioLineWrapper } from '../js/VerovioLineWrapper.js';

let rma = new RevealMusicArranger();

let mxt = new MusicXMLTransformer();
let tk;

window.PianoRollToolkit = PianoRollToolkit;
window.TextOnlyToolkit = TextOnlyToolkit;
window.VerovioLineWrapper = VerovioLineWrapper;

if (urlParam('toolkit') === 'verovio') {
  tk = verovio.toolkit;
} else if (urlParam('toolkit') === 'veroviostatic') {
  tk = VerovioLineWrapper;
} else if (urlParam('toolkit') === 'text') {
  tk = TextOnlyToolkit;
} else {
  tk = PianoRollToolkit;
}
let rmx = new RevealMusicXML(tk, mxt);

// TODO: Use Reveal.registerPlugin when we can be sure that one loads before the other.
rma
  .init()
  .then(() => rmx.init())
  .then(() => Reveal.slide(0, 0));
