/* globals Reveal, verovio */
import { MusicToolkit } from '../js/MusicToolkit.js';
import { MusicXMLTransformer } from '../js/MusicXMLTransformer.js';
import { PianoRollToolkit } from '../js/PianoRollToolkit.js';
import { RevealMusicArranger } from '../js/RevealMusicArranger.js';
import { RevealMusicXML } from '../js/RevealMusicXML.js?v=1.2.1';
import { TextOnlyToolkit } from '../js/TextOnlyToolkit.js';
import { urlParam } from '../js/urlParam.js';

let rma = new RevealMusicArranger();

let mxt = new MusicXMLTransformer();
let tk;

window.PianoRollToolkit = PianoRollToolkit;
window.TextOnlyToolkit = TextOnlyToolkit;
// Set verovio.toolkit for when toolkit choice in data-musicxml-toolkit
window['verovio.toolkit'] = verovio.toolkit;

if (urlParam('toolkit') === 'verovio') {
  tk = MusicToolkit;
} else if (urlParam('toolkit') === 'veroviostatic') {
  // Backwards compatibility for former VerovioLineWrapper.
  tk = MusicToolkit;
} else if (urlParam('toolkit') === 'text') {
  tk = TextOnlyToolkit;
} else {
  tk = PianoRollToolkit;
}
let rmx = new RevealMusicXML(tk, mxt);
window.rmx = rmx;

// TODO: Use Reveal.registerPlugin when we can be sure that one loads before the other.
rma
  .init()
  .then(() => rmx.init())
  .then(() => Reveal.slide(0, 0));
