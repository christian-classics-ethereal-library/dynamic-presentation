/* globals Reveal */
import { AudioPlayer } from '../js/AudioPlayer.js?v=1.8.0';
import { MIDIPlayer } from '../js/MIDIPlayer.js?v=1.8.4';
import { MusicToolkit } from '../js/MusicToolkit.js?v=1.3.2';
import { MusicXMLTransformer } from '../js/MusicXMLTransformer.js';
import { PianoRollToolkit } from '../js/PianoRollToolkit.js?v=1.3.3';
import { RevealMusicXML } from '../js/RevealMusicXML.js?v=1.8.4';
import { TextOnlyToolkit } from '../js/TextOnlyToolkit.js?v=1.3.3'; // Depends on PianoRollToolkit
import { urlParam } from '../js/urlParam.js';
import { XMLPlayer } from '../js/XMLPlayer.js?v=1.8.4'; // Depends on MIDIPlayer
import { YouTubePlayer } from '../js/YouTubePlayer.js?v=1.8.0';
import { VoidPlayer } from '../js/VoidPlayer.js?v=1.8.0';

let mxt = new MusicXMLTransformer();
let tk;

window.PianoRollToolkit = PianoRollToolkit;
window.TextOnlyToolkit = TextOnlyToolkit;
window.MusicToolkit = MusicToolkit;
if (typeof window.verovio !== 'undefined') {
  window.VerovioToolkit = window.verovio.toolkit;
}

window.AudioPlayer = AudioPlayer;
window.MIDIPlayer = MIDIPlayer;
window.XMLPlayer = XMLPlayer;
window.YouTubePlayer = YouTubePlayer;
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

// TODO: Use Reveal.registerPlugin?
rmx.init().then(
  () => Reveal.slide(0, 0),
  () => Reveal.slide(0, 0)
);
