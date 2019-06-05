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
          note.lyrics.forEach((lyric, j) => {
            if (lyric) {
              if (!this.textLines[i][j]) {
                this.textLines[i][j] = [];
              }
              this.textLines[i][j].push(lyric);
            }
          });
        });
      });
    }
    // Number of "translation lines".
    let tLines = this.textLines[0].length - 1;
    // 50 height with a margin of 20 (that is shared).
    // Adding 10 so that a few lines wrapping won't mess everything up.
    let tLineHeight = 80 + 10;
    // linesPerPage doesn't count translation lines.
    let linesPerPage = Math.floor(this.height / tLineHeight / tLines);

    let numPages = Math.ceil(this.textLines.length / linesPerPage);
    this.pages = [];
    // Page 0 is going to be empty
    for (let i = 0; i <= numPages; i++) this.pages.push([]);

    this.textLines.forEach((line, i) => {
      let j = Math.floor(i / linesPerPage) + 1;
      line.forEach((tline, k) => {
        if (tline) {
          this.pages[j].push(
            `<p data-verse-num='${k}'>` + tline.join('') + '</p>'
          );
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
