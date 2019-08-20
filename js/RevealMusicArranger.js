/* globals DOMParser, fetch */
export class RevealMusicArranger {
  init () {
    return this._processSlides().then(() => Promise.resolve());
  }

  /**
   * @brief Return a valid arrangement if the passed one does not exist.
   * @param arrangement either an array (like ['verse1','chorus','verse2','chorus']`, or an empty array.
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
      let verses = [];
      doc.querySelectorAll('lyric:not([name])').forEach(lyric => {
        let i = lyric.getAttribute('number');
        verses[i] = [`verse${i}`];
      });
      doc.querySelectorAll('lyric[name]').forEach(lyric => {
        let i = lyric.getAttribute('name');
        if (i.substring(0, 5) === 'verse') {
          // TODO: Support more than 9 verses with translations.
          let num = i.substring(5, 6);
          if (verses[num].indexOf(i) === -1) {
            verses[num].push(i);
          }
        } else {
          nonverses[i] = i;
        }
      });
      verses.forEach(v => {
        arrangement.push(v);
        Object.keys(nonverses).forEach(nv => {
          arrangement.push([nv]);
        });
      });
    }
    if (!arrangement.length) {
      arrangement = [['instrumental']];
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
    let info = {};
    try {
      info = JSON.parse(
        section.getAttribute('data-musicarranger-info') || '{}'
      );
    } catch (error) {
      console.error(
        'RevealMusicArranger: could not parse data-musicarranger-info JSON:' +
          section.getAttribute('data-musicarranger-info')
      );
      console.error(error);
    }
    let arrangement = this._getArrangement(data, info.arrangement || []);

    section.innerHTML = '';

    arrangement.forEach(sectionNames => {
      let newSection = document.createElement('section');
      section.appendChild(newSection);

      let sectionInfo = {
        sectionNames: sectionNames,
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
