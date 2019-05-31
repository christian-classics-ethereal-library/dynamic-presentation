import { urlParam } from '../js/urlParam.js';
var Reveal = require('reveal.js');

Reveal.addKeyBinding(
  { keyCode: 77, key: 'M', description: 'Play/Stop audio' },
  function () {
    window.playPauseAudio();
  }
);
let width = urlParam('width') || 960;
Reveal.initialize({
  controlsTutorial: false,
  navigationMode: 'linear',
  width: width,
  height: '100%',
  transition: 'fade',
  transitionSpeed: 'fast'
});

function playPauseAudio () {
  var audio = document.getElementById('audio');
  if (audio.paused) {
    audio.currentTime = 0;
    audio.play();
  } else {
    audio.pause();
  }
}

window.playPauseAudio = playPauseAudio;
window.Reveal = Reveal;
