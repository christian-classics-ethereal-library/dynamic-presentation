import { urlParam } from '../js/urlParam.js';
var Reveal = require('reveal.js');

let width = urlParam('width') || 960;
Reveal.initialize({
  controlsTutorial: false,
  navigationMode: 'linear',
  width: width,
  height: '100%',
  transition: 'fade',
  transitionSpeed: 'fast'
});
window.Reveal = Reveal;
