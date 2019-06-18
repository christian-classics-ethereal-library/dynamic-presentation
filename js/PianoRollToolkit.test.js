/* globals expect, test */
import { PianoRollToolkit } from './PianoRollToolkit';
import fs from 'fs';
import path from 'path';

const xmlFiles = '../musicxmlTestSuite/xmlFiles/';

const xml41a = fs.readFileSync(
  path.resolve(__dirname, xmlFiles + '41a-MultiParts-Partorder.xml'),
  'utf8'
);

test('PianoRoll parses parts from musicXML properly', () => {
  let prt = new PianoRollToolkit();
  prt.loadData(xml41a);
  let notes = prt.data.measures[1].notes;
  // Remove ID from notes
  notes = notes.map(note => {
    delete note.id;
    return note;
  });
  expect(notes).toMatchSnapshot();
});
