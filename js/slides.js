var Reveal = require("reveal.js");

Reveal.addKeyBinding(
    { keyCode: 68, key: 'D',description: 'Toggle Dynamic Presentation Options' },
    function(){ window.toggleDynamicOptions(); }
);
Reveal.addKeyBinding(
    { keyCode: 77, key: 'M', description: 'Play/Stop audio' },
    function(){ window.playPauseAudio(); }
);

Reveal.initialize({
    "controlsTutorial": false,
    "transition": "none"
});

function playPauseAudio() {
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
