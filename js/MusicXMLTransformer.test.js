/* globals expect, test */
import { MusicXMLTransformer } from './MusicXMLTransformer';
import fs from 'fs';
import path from 'path';

const xmlFiles = '../../../examplemedia/musicxmlTestSuite/xmlFiles/';

const xml41a = fs.readFileSync(
  path.resolve(__dirname, xmlFiles + '41a-MultiParts-Partorder.xml'),
  'utf8'
);
const xml42a = fs.readFileSync(
  path.resolve(
    __dirname,
    xmlFiles + '42a-MultiVoice-TwoVoicesOnStaff-Lyrics.xml'
  ),
  'utf8'
);
const xml46a = fs.readFileSync(
  path.resolve(__dirname, xmlFiles + '46a-Barlines.xml'),
  'utf8'
);
const xml52b = fs.readFileSync(
  path.resolve(__dirname, xmlFiles + '52b-Breaks.xml'),
  'utf8'
);
const xml61b = fs.readFileSync(
  path.resolve(__dirname, xmlFiles + '61b-MultipleLyrics.xml'),
  'utf8'
);
const xml61g = fs.readFileSync(
  path.resolve(__dirname, xmlFiles + '61g-Lyrics-NameNumber.xml'),
  'utf8'
);

test('files loaded properly', () => {
  expect(xml61b).toMatchSnapshot();
  expect(xml61g).toMatchSnapshot();
});

test('hideOtherLyrics works fine', () => {
  let mxt = new MusicXMLTransformer();
  mxt.loadData(xml61g);
  mxt.hideOtherLyrics('Verse');
  let xml61gX = mxt.getData();
  expect(xml61gX).toMatchSnapshot();

  mxt.loadData(xml61g);
  mxt.hideOtherLyrics('Chorus');
  let xml61gX2 = mxt.getData();
  expect(xml61gX2).toMatchSnapshot();
});

test('hideOtherVerses works fine', () => {
  let mxt = new MusicXMLTransformer();
  mxt.loadData(xml61b);
  mxt.hideOtherVerses(1);
  let xml61bX = mxt.getData();
  expect(xml61bX).toMatchSnapshot();

  mxt.loadData(xml61b);
  mxt.hideOtherVerses(2);
  let xml61bX2 = mxt.getData();
  expect(xml61bX2).toMatchSnapshot();

  mxt.loadData(xml61b);
  mxt.hideOtherVerses(3);
  let xml61bX3 = mxt.getData();
  expect(xml61bX3).toMatchSnapshot();
});

test('hidePartsExceptMelody removes other parts', () => {
  let mxt = new MusicXMLTransformer();
  mxt.loadData(xml41a);
  mxt.hidePartsExceptMelody();
  let xml41aX = mxt.getData();
  expect(xml41aX).toMatchSnapshot();
});
test('hidePartsExceptMelody removes other voices', () => {
  let mxt = new MusicXMLTransformer();
  mxt.loadData(xml42a);
  mxt.hidePartsExceptMelody();
  let xml42aX = mxt.getData();
  expect(xml42aX).toMatchSnapshot();
});

test('makeAllWordsVerse1 works fine', () => {
  let mxt = new MusicXMLTransformer();
  mxt.loadData(xml61b);
  mxt.makeAllWordsVerse1();
  let xml61bX = mxt.getData();
  expect(xml61bX).toMatchSnapshot();
});

test('useDottedDashedAsSystemBreaks works fine', () => {
  let mxt = new MusicXMLTransformer();
  mxt.loadData(xml46a);
  mxt.useDottedDashedAsSystemBreaks();
  let xml46aX = mxt.getData();
  expect(xml46aX).toMatchSnapshot();
});

test('removeSystemAndPageBreaks works fine', () => {
  let mxt = new MusicXMLTransformer();
  mxt.loadData(xml52b);
  mxt.removeSystemAndPageBreaks();
  let xml52bX = mxt.getData();
  expect(xml52bX).toMatchSnapshot();
});
