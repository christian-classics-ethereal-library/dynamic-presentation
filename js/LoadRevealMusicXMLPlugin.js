/* globals Reveal */
import { AudioPlayer } from '../js/AudioPlayer.js';
import { MIDIPlayer } from '../js/MIDIPlayer.js';
import { MusicToolkit } from '../js/MusicToolkit.js?v=1.3.2';
import { MusicXMLTransformer } from '../js/MusicXMLTransformer.js';
import { PianoRollToolkit } from '../js/PianoRollToolkit.js?v=1.3.2';
import { RevealMusicArranger } from '../js/RevealMusicArranger.js';
import { RevealMusicXML } from '../js/RevealMusicXML.js?v=1.3.2';
import { TextOnlyToolkit } from '../js/TextOnlyToolkit.js?v=1.3.2';
import { urlParam } from '../js/urlParam.js';
import { VoidPlayer } from '../js/VoidPlayer.js';

let rma = new RevealMusicArranger();

let mxt = new MusicXMLTransformer();
let tk;

window.PianoRollToolkit = PianoRollToolkit;
window.TextOnlyToolkit = TextOnlyToolkit;
window.MusicToolkit = MusicToolkit;

window.AudioPlayer = AudioPlayer;
window.MIDIPlayer = MIDIPlayer;
window.VoidPlayer = VoidPlayer;

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
