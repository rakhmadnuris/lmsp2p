const PizZip = require('pizzip');
const fs = require('fs');

const content = fs.readFileSync('public/certificate_template.docx');
const zip = new PizZip(content);

const xml = zip.files['word/document.xml'].asText();

// Search for TANGGAL near text
const matches = xml.match(/.{0,200}TANGGAL.{0,200}/g);
if (matches) {
  matches.forEach((m, i) => {
    console.log(`\n--- Match ${i + 1} ---`);
    console.log(m);
  });
} else {
  console.log('No matches for TANGGAL');
  // Try searching for individual parts
  const tMatches = xml.match(/.{0,50}TANGGAL.{0,50}/gi);
  if (tMatches) {
    tMatches.forEach((m, i) => console.log(`Partial: ${m}`));
  }
  // Check if it's split across XML tags
  console.log('\nSearching for T-A-N-G-G-A-L split across tags...');
  const tagSplit = xml.match(/<w:t[^>]*>[^<]*T[^<]*<\/w:t>.*?<w:t[^>]*>[^<]*A[^<]*N[^<]*G[^<]*<\/w:t>/g);
  if (tagSplit) tagSplit.forEach(m => console.log(m));
}

// Also search for REGENCY
const rMatches = xml.match(/.{0,100}REGENCY.{0,100}/g);
if (rMatches) {
  rMatches.forEach((m, i) => {
    console.log(`\n--- REGENCY Match ${i + 1} ---`);
    console.log(m);
  });
}

// Search for NAMA
const nMatches = xml.match(/.{0,100}NAMA.{0,100}/g);
if (nMatches) {
  nMatches.forEach((m, i) => {
    console.log(`\n--- NAMA Match ${i + 1} ---`);
    console.log(m);
  });
}
