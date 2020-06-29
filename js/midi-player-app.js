// eslint-disable-next-line no-unused-vars
/* globals MidiPlayer, Player, Soundfont */
// eslint-disable-next-line no-unused-vars
var Player;
var AudioContext = window.AudioContext || window.webkitAudioContext || false;
var ac = new AudioContext();

var soundfont =
  'https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/FluidR3_GM/acoustic_grand_piano-mp3.js';
if (document.getElementById('soundfont')) {
  soundfont = document.getElementById('soundfont').dataset.soundfont;
}

Soundfont.instrument(ac, soundfont).then(function (instrument) {
  let notes = {};
  Player = new MidiPlayer.Player(function (event) {
    if (event.name === 'Note on' && event.velocity > 0) {
      notes[event.noteNumber] = notes[event.noteNumber]
        ? notes[event.noteNumber]
        : [];
      notes[event.noteNumber].push(
        instrument.play(event.noteName, ac.currentTime, {
          gain: event.velocity / 100
        })
      );
    } else if (
      event.name === 'Note off' ||
      (event.name === 'Note on' && event.velocity === 0)
    ) {
      if (typeof notes[event.noteNumber] !== 'undefined') {
        for (let i = 0; i < notes[event.noteNumber].length; i++) {
          notes[event.noteNumber][i].stop();
        }
        notes[event.noteNumber] = [];
      }
    }
  });
  Player.instrument = instrument;
});
