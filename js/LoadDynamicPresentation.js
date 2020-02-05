/* globals impress, verovio */
import { MusicXMLTransformer } from '../js/MusicXMLTransformer.js';
import { PianoRollToolkit } from '../js/PianoRollToolkit.js';
import { ImpressMusicXML } from '../js/ImpressMusicXML.js';
import { TextOnlyToolkit } from '../js/TextOnlyToolkit.js';
import { urlParam } from '../js/urlParam.js';
import { VerovioLineWrapper } from '../js/VerovioLineWrapper.js';

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
let imx = new ImpressMusicXML(tk, mxt);
imx.init().then(() => impress().init());
