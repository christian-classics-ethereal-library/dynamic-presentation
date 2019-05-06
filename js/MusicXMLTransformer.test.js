/* globals DOMParser, expect, test, XMLSerializer */
import { MusicXMLTransformer } from './MusicXMLTransformer';
import fs from 'fs';
import path from 'path';
const xml61b = fs.readFileSync(
  path.resolve(
    __dirname,
    '../../../examplemedia/musicxmlTestSuite/xmlFiles/61b-MultipleLyrics.xml'
  ),
  'utf8'
);
const xml61g = fs.readFileSync(
  path.resolve(
    __dirname,
    '../../../examplemedia/musicxmlTestSuite/xmlFiles/61g-Lyrics-NameNumber.xml'
  ),
  'utf8'
);

test('files loaded properly', () => {
  expect(xml61b).toMatchSnapshot();
  expect(xml61g).toMatchSnapshot();
});

test('hideOtherLyrics works fine', () => {
  let parser = new DOMParser();
  let doc = parser.parseFromString(xml61g, 'text/xml');
  let mxt = new MusicXMLTransformer(doc);
  mxt.hideOtherLyrics('Verse');
  let xml61gX = new XMLSerializer().serializeToString(doc.documentElement);
  expect(xml61gX).toMatchSnapshot();

  let doc2 = parser.parseFromString(xml61g, 'text/xml');
  let mxt2 = new MusicXMLTransformer(doc2);
  mxt2.hideOtherLyrics('Chorus');
  let xml61gX2 = new XMLSerializer().serializeToString(doc2.documentElement);
  expect(xml61gX2).toMatchSnapshot();
});

test('hideOtherVerses works fine', () => {
  let parser = new DOMParser();
  let doc = parser.parseFromString(xml61b, 'text/xml');
  let mxt = new MusicXMLTransformer(doc);
  mxt.hideOtherVerses(1);
  let xml61bX = new XMLSerializer().serializeToString(doc.documentElement);
  expect(xml61bX).toMatchSnapshot();

  let doc2 = parser.parseFromString(xml61b, 'text/xml');
  let mxt2 = new MusicXMLTransformer(doc2);
  mxt2.hideOtherVerses(2);
  let xml61bX2 = new XMLSerializer().serializeToString(doc2.documentElement);
  expect(xml61bX2).toMatchSnapshot();

  let doc3 = parser.parseFromString(xml61b, 'text/xml');
  let mxt3 = new MusicXMLTransformer(doc3);
  mxt3.hideOtherVerses(3);
  let xml61bX3 = new XMLSerializer().serializeToString(doc3.documentElement);
  expect(xml61bX3).toMatchSnapshot();
});

test('makeAllWordsVerse1 works fine', () => {
  let parser = new DOMParser();
  let doc = parser.parseFromString(xml61b, 'text/xml');
  let mxt = new MusicXMLTransformer(doc);
  mxt.makeAllWordsVerse1();
  let xml61bX = new XMLSerializer().serializeToString(doc.documentElement);
  expect(xml61bX).toMatchSnapshot();
});
