/* globals DOMParser, fetch */
export class RevealMusicArranger {
  init () {
    return this._processSlides().then(() => Promise.resolve());
  }

  /**
   * @brief Determine the arrangement from the arrangementString, or automatically.
   * @param arrangementString is a string like `verse1,chorus,verse2,chorus`, or the empty string.
   * @return list.
   */
  _getArrangement (data, arrangement) {
    if (arrangement.length) {
      return arrangement;
    } else {
      let parser = new DOMParser();
      let doc = parser.parseFromString(data, 'text/xml');
      // TODO: Automatically arrange it by traversing through measures.
      let nonverses = {};
      doc.querySelectorAll('lyric[name]').forEach(lyric => {
        let i = lyric.getAttribute('name');
        nonverses[i] = i;
      });
      let verses = [];
      doc.querySelectorAll('lyric:not([name])').forEach(lyric => {
        let i = lyric.getAttribute('number');
        verses[i] = i;
      });
      verses.forEach(v => {
        arrangement.push(`verse${v}`);
        Object.keys(nonverses).forEach(nv => {
          arrangement.push(nv);
        });
      });
    }
    if (!arrangement.length) {
      arrangement = ['instrumental'];
    }
    return arrangement;
  }

  _loadExternalMusicXML (section) {
    const url = section.getAttribute('data-musicarranger');
    return fetch(url)
      .then(res => res.text())
      .then(text => {
        this._slidify(section, text);
      });
  }

  _processSlides () {
    let promises = [];
    document.querySelectorAll('[data-musicarranger]').forEach(section => {
      if (section.getAttribute('data-musicarranger').length) {
        promises.push(this._loadExternalMusicXML(section));
      } else {
        this._slidify(
          section,
          section.querySelector('script[type="text/template"]').innerHTML
        );
      }
    });
    return Promise.all(promises);
  }

  /**
   * @brief Create the slide content based on the musicXML data, and some info.
   */
  _slidify (section, data) {
    let info = JSON.parse(
      section.getAttribute('data-musicarranger-info') || '{}'
    );
    let arrangement = this._getArrangement(data, info.arrangement || []);

    section.innerHTML = '';

    arrangement.forEach(sectionName => {
      let newSection = document.createElement('section');
      section.appendChild(newSection);

      let sectionInfo = {
        sectionName: sectionName,
        options: info.options
      };
      newSection.setAttribute(
        'data-musicxml-transform',
        JSON.stringify(sectionInfo)
      );
      newSection.setAttribute('data-musicxml', '');
      newSection.innerHTML =
        "<script type='text/template'>" + data + '</script>';
    });

    // Remove this outer <section> element.
    section.outerHTML = section.innerHTML;
  }
}
