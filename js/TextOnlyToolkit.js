/* globals */
import { PianoRollToolkit } from '../js/PianoRollToolkit.js?v=1.3.3';

export class TextOnlyToolkit extends PianoRollToolkit {
  getPageCount () {
    return this.pages.length;
  }

  getPageWithElement (id) {
    let page = this.pages.find(page => {
      return page.find(pageText => pageText.indexOf(id) !== -1);
    });
    return this.pages.indexOf(page) + 1;
  }

  renderToSVG (page, options) {
    let output = '';
    if (page === 1 && !this.noHeader) {
      output += "<div class='header'>";
      output += "<span class='title'>" + this.data.title + '</span>';
      output += "<span class='lyricist'>" + this.data.lyricist + '</span>';
      output += "<span class='composer'>" + this.data.composer + '</span>';
      output += '</div>';
    }
    output += this.pages[page - 1].join('');
    if (page === 1 && this.data.footer) {
      output += "<span class='footer'>" + this.data.footer + '</span>';
    }
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
              // TODO: Don't use the same id for different translation lyrics.
              this.textLines[i][j].push([note.id, lyric]);
            }
          });
        });
      });
    }
    // Number of "translation lines".
    let tLines = Math.max(1, this.textLines[0].length - 1);
    // 50 height with a margin of 20 (that is shared).
    // Adding 10 so that a few lines wrapping won't mess everything up.
    // TODO: detect lines that wrap and account for them when distributing
    // lines across different slides.
    let tLineHeight = 80 + 10;
    // linesPerPage doesn't count translation lines.
    let headerHeight = this.noHeader ? 0 : 100;
    let linesPerPage = Math.floor(
      (this.height - headerHeight) / tLineHeight / tLines
    );
    // There needs to be at least 1 line per page so we aren't dividing by zero later.
    linesPerPage = linesPerPage > 0 ? linesPerPage : 1;

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
            `<p data-verse-num='${k}'>` +
              tline.map(this._makeSyl).join('') +
              '</p>'
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

  _makeSyl (word) {
    return `<span id="${word[0]}">${word[1]}</span>`;
  }
}
