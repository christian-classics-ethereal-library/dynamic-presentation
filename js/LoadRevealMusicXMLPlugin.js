/* globals Reveal, verovio */
import { RevealMusicXML } from './RevealMusicXML.js';
// import { PianoRollToolkit } from './PianoRollToolkit.js';
import { MusicXMLTransformer } from './MusicXMLTransformer.js';

let mxt = new MusicXMLTransformer();
// eslint-disable-next-line
let tk = new verovio.toolkit();
// let tk = new PianoRollToolkit();
let rmx = new RevealMusicXML(tk, mxt);
Reveal.registerPlugin('musicxml', rmx);
