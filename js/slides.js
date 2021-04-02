/* globals Reveal */
import { urlParam } from '../js/urlParam.js';

let width = urlParam('width') || 960;
Reveal.initialize({
  controlsTutorial: false,
  navigationMode: 'linear',
  width: width,
  height: '100%',
  transition: 'none',
  transitionSpeed: 'fast'
});
