// eslint-disable-next-line no-unused-vars
/* globals MidiPlayer, Player, Soundfont */
// eslint-disable-next-line no-unused-vars
var Player;
var AudioContext = window.AudioContext || window.webkitAudioContext || false;
var ac = new AudioContext();

Soundfont.instrument(
  ac,
  'https://raw.githubusercontent.com/gleitz/midi-js-soundfonts/gh-pages/MusyngKite/acoustic_guitar_nylon-mp3.js'
).then(function (instrument) {
  let notes = {};
  Player = new MidiPlayer.Player(function (event) {
    if (event.name === 'Note on' && event.velocity > 0) {
      notes[event.noteNumber] = instrument.play(
        event.noteName,
        ac.currentTime,
        {
          gain: event.velocity / 100
        }
      );
    }
    if (
      event.name === 'Note off' ||
      (event.name === 'Note on' && event.velocity === 0)
    ) {
      if (typeof notes[event.noteNumber] !== 'undefined') {
        notes[event.noteNumber].stop();
      }
    }
  });
});
