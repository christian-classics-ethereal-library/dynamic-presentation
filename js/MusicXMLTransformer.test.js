/* globals expect, test */
import { MusicXMLTransformer } from './MusicXMLTransformer';
import fs from 'fs';
import path from 'path';

const xmlFiles = '../musicxmlTestSuite/xmlFiles/';

const xml41a = fs.readFileSync(
  path.resolve(__dirname, xmlFiles + '41a-MultiParts-Partorder.xml'),
  'utf8'
);
const xml41i = fs.readFileSync(
  path.resolve(__dirname, xmlFiles + '41i-PartNameDisplay-Override.xml'),
  'utf8'
);
const xml42a = fs.readFileSync(
  path.resolve(
    __dirname,
    xmlFiles + '42a-MultiVoice-TwoVoicesOnStaff-Lyrics.xml'
  ),
  'utf8'
);
const xml42b = fs.readFileSync(
  path.resolve(__dirname, xmlFiles + '42b-MultiVoice-MidMeasureClefChange.xml'),
  'utf8'
);
const xml46a = fs.readFileSync(
  path.resolve(__dirname, xmlFiles + '46a-Barlines.xml'),
  'utf8'
);
const xml46g = fs.readFileSync(
  path.resolve(
    __dirname,
    xmlFiles + '46g-PickupMeasure-Chordnames-FiguredBass.xml'
  ),
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

test('dottedOrDashedExist returns false', () => {
  let mxt = new MusicXMLTransformer();
  mxt.loadData(xml61b);
  expect(mxt.dottedOrDashedExist()).toBe(false);
});
test('dottedOrDashedExist returns true', () => {
  let mxt = new MusicXMLTransformer();
  mxt.loadData(xml46a);
  expect(mxt.dottedOrDashedExist()).toBe(true);
});

test('hideOtherLyrics works fine', () => {
  let mxt = new MusicXMLTransformer();
  mxt.loadData(xml61g);
  mxt.hideOtherLyrics(['[name="Verse"]']);
  let xml61gX = mxt.getData();
  expect(xml61gX).toMatchSnapshot();

  mxt.loadData(xml61g);
  mxt.hideOtherLyrics(['[name="Chorus"]']);
  let xml61gX2 = mxt.getData();
  expect(xml61gX2).toMatchSnapshot();
});

test('hideOtherMeasures removes instrumental section', () => {
  let mxt = new MusicXMLTransformer();
  mxt.loadData(xml42a);
  mxt.hideOtherMeasures();
  let xml42aX = mxt.getData();
  expect(xml42aX).toMatchSnapshot();
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

test('phrasesPerLine where n = 2', () => {
  let mxt = new MusicXMLTransformer();
  mxt.loadData(xml52b);
  mxt.phrasesPerLine(2);
  let xml52bX = mxt.getData();
  expect(xml52bX).toMatchSnapshot();
});
test('phrasesPerLine where n = 3', () => {
  let mxt = new MusicXMLTransformer();
  mxt.loadData(xml52b);
  mxt.phrasesPerLine(3);
  let xml52bX = mxt.getData();
  expect(xml52bX).toMatchSnapshot();
});
test('phrasesPerLine with multiple parts', () => {
  let mxt = new MusicXMLTransformer();
  mxt.loadData(xml41i);
  mxt.phrasesPerLine(2);
  let xml41iX = mxt.getData();
  expect(xml41iX).toMatchSnapshot();
});

test('renumberMeasures decreases measure numbers', () => {
  let mxt = new MusicXMLTransformer();
  mxt.loadData(xml42b);
  mxt.renumberMeasures();
  let xml42bX = mxt.getData();
  expect(xml42bX).toMatchSnapshot();
});
test('renumberMeasures increases measure numbers', () => {
  let mxt = new MusicXMLTransformer();
  mxt.loadData(xml46g);
  mxt.renumberMeasures();
  let xml46gX = mxt.getData();
  expect(xml46gX).toMatchSnapshot();
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
