/* globals DOMParser, verovio, XMLSerializer */
export class VerovioLineWrapper {
  constructor () {
    this.doLineWrapping = false;
    this.systemsPerPage = 1;
    // eslint-disable-next-line new-cap
    this.toolkit = new verovio.toolkit();
    this.vOptions = {};
  }

  getPageCount () {
    // Find out how many vPages can fit on a screen
    let svg = this.toolkit.renderToSVG(1, this.vOptions);
    let svgDoc = new DOMParser().parseFromString(svg, 'text/xml');
    let vPageHeight = parseFloat(svgDoc.activeElement.getAttribute('height'));
    let screenHeight = this.vOptions.pageHeight * (this.vOptions.scale / 100);
    this.systemsPerPage = Math.floor(screenHeight / vPageHeight);

    return Math.ceil(this.toolkit.getPageCount() / this.systemsPerPage);
  }

  getTimeForElement (id) {
    return this.toolkit.getTimeForElement(id);
  }

  loadData (data) {
    // Transform the data so every system break is also a page break.
    let parser = new DOMParser();
    this.doc = parser.parseFromString(data, 'text/xml');
    this.doc
      .querySelectorAll('measure print[new-system=yes]')
      .forEach(print => {
        print.setAttribute('new-page', 'yes');
        print.removeAttribute('new-system');
      });
    data = new XMLSerializer().serializeToString(this.doc);
    return this.toolkit.loadData(data);
  }

  redoLayout () {
    // TODO: Allow screen width to be changed.
    // This is commented out because  it causes the layout to reflow and lose all system breaks.
    // return this.toolkit.redoLayout();
  }

  renderToSVG (page, options) {
    // render multiple per page
    if (this.doLineWrapping) {
      let string = '';
      for (let i = 0; i < this.systemsPerPage; i++) {
        let vPage = (page - 1) * this.systemsPerPage + i + 1;
        string += this.toolkit.renderToSVG(vPage, options);
      }
      return string;
    } else {
      return this.toolkit.renderToSVG(page, options);
    }
  }

  setOptions (options) {
    this.vOptions = options;
    // Since it's too difficult to implement this within verovio,
    // we've created this class.
    // (https://github.com/rism-ch/verovio/issues/1056).
    if (options.breaks === 'line') {
      // this.systemsPerPage = 2;
      this.doLineWrapping = true;
      this.vOptions.breaks = 'encoded';
      this.vOptions.adjustPageHeight = true;
    }
    this.toolkit.setOptions(this.vOptions);
  }
}
