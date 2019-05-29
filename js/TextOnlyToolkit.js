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
    if (!this.textLines) {
      this.textLines = [[]];
      let i = 0;
      this.data.measures.forEach(measure => {
        if (measure.sectionBreak || measure.pageBreak) {
          this.textLines.push([]);
          i++;
        }
        measure.notes.forEach(note => {
          if (note.lyric) {
            this.textLines[i].push(note.lyric);
          }
        });
      });
    }
    // TODO: Determine linesPerPage from the screen height.
    let linesPerPage = 4;

    let numPages = Math.floor(this.textLines.length / linesPerPage);
    this.pages = [];
    // Page 0 is going to be empty
    for (let i = 0; i <= numPages; i++) this.pages.push([]);

    this.textLines.forEach((line, i) => {
      let j = Math.floor(i / linesPerPage) + 1;
      this.pages[j].push(line.join('') + '<br/>');
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
