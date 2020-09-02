/* globals verovio */
export class MusicToolkit extends verovio.toolkit {
  setMusicData (musicData) {
    this.musicData = musicData;
  }

  renderToMIDI () {
    if (this.musicData) {
      // eslint-disable-next-line new-cap
      let newVerovio = new verovio.toolkit();
      newVerovio.setOptions(this.getOptions());
      newVerovio.loadData(this.musicData);
      return newVerovio.renderToMIDI();
    } else {
      return this.renderToMIDI();
    }
  }
}
