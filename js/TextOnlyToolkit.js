/* globals */
import { PianoRollToolkit } from '../js/PianoRollToolkit.js';

export class TextOnlyToolkit extends PianoRollToolkit {
  getPageCount () {
    return this.pages.length;
  }
  renderToSVG (page, options) {
    let output = '';
    output +=
      '<style>.reveal section[data-musicxml]{font-size:inherit};</style>';
    output += this.pages[page - 1].join('');
    return output;
  }

  _assignMeasuresToPages () {
    if (!this.textLines) {
      this.textLines = [[]];
      let i = 0;
      this.data.measures.forEach((measure, measureNum) => {
        if ((measure.sectionBreak || measure.pageBreak) && measureNum > 1) {
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
    let tLines = Math.max(
      1,
      this.textLines[0].length - 1,
      this.textLines[1].length - 1
    );
    // 50 height with a margin of 20 (that is shared).
    // Adding 10 so that a few lines wrapping won't mess everything up.
    let tLineHeight = 80 + 10;
    // linesPerPage doesn't count translation lines.
    let linesPerPage = Math.floor(this.height / tLineHeight / tLines);

    let numPages = Math.ceil(this.textLines.length / linesPerPage);
    // Make sure that we don't put more lines on a page than we need to.
    linesPerPage = Math.ceil(this.textLines.length / numPages);
    // TODO: evenly distribute the lines to the pages.
    // number of pages that have one less than the maximum number of linesPerPage.
    // let sadPages = numPages * linesPerPage - this.textLines.length;

    this.pages = [];
    for (let i = 0; i < numPages; i++) this.pages.push([]);

    this.textLines.forEach((line, i) => {
      let j = Math.floor(i / linesPerPage);
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
    let text = super._getLyric(lyric);
    return text.replace('\xa0', ' ').replace('-', '');
  }
}
