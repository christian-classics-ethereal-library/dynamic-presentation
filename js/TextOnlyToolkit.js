/* globals */
import { PianoRollToolkit } from '../js/PianoRollToolkit.js';

export class TextOnlyToolkit extends PianoRollToolkit {
  renderToSVG (page, options) {
    let output = '';
    output +=
      '<style>.reveal section[data-musicxml]{font-size:inherit};</style>';
    this.pages[page].forEach(line => {
      output += line;
    });
    return output;
  }

  _assignMeasuresToPages () {
    this.pages = [[], []];
    this.data.measures.forEach(measure => {
      if (measure.sectionBreak || measure.pageBreak) {
        this.pages[1].push('<br/>');
      }
      measure.notes.forEach(note => {
        if (note.lyric) {
          this.pages[1].push(note.lyric);
        }
      });
    });
  }

  _debug (message) {
    console.log(`TextOnlyToolkit: ${message}`);
  }

  _getLyric (lyric) {
    if (!lyric) return '';
    let text = lyric.querySelector('text').innerHTML;
    let syllabic = lyric.querySelector('syllabic').innerHTML;
    if (syllabic === 'begin') return text;
    else if (syllabic === 'end') return text + ' ';
    else if (syllabic === 'middle') return text;
    else return text + ' ';
  }
}
