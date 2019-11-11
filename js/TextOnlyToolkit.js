/* globals CSS */
import { PianoRollToolkit } from '../js/PianoRollToolkit.js';

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
    output +=
      '<style>.reveal section[data-musicxml]{font-size:inherit};</style>';
    if (page === 1 && !this.noHeader) {
      output += "<div class='header'>";
      output += "<span class='title'>" + this.data.title + '</span>';
      output += "<span class='lyricist'>" + this.data.lyricist + '</span>';
      output += "<span class='composer'>" + this.data.composer + '</span>';
      output += '</div>';
    }
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
              // TODO: Don't use the same id for different translation lyrics.
              this.textLines[i][j].push({
                id: note.id,
                lyric: lyric,
                pitch: note.pitch
              });
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
              tline.map(e => this._makeSyl(e)).join('') +
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
    let pitch = word.pitch;
    let style = '';
    if (CSS.supports('-webkit-background-clip: text')) {
      let baseline = 80;
      let xHeight = 40;
      let gradHeight = 8;
      let topGrad = this._pitchMap(
        pitch,
        baseline - gradHeight,
        baseline - xHeight
      );
      let bottomGrad =
        this._pitchMap(pitch, baseline - gradHeight, baseline - xHeight) +
        gradHeight;
      style = `
            background: -webkit-linear-gradient(
                var(--link-color) ${topGrad}%,
                var(--main-color) ${bottomGrad}%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: none;
        `;
    }
    return `<span id="${word.id}" style="${style}">${word.lyric}</span>`;
  }
  _pitchMap (pitch, outMin, outMax) {
    return this._valueMap(pitch, this.lowNote, this.highNote, outMin, outMax);
  }
  _valueMap (x, inMin, inMax, outMin, outMax) {
    if (inMin === inMax) return 0.5;
    return ((x - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  }
}
