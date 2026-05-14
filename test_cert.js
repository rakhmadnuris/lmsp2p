const PizZip = require('pizzip');
const fs = require('fs');

const c = fs.readFileSync('public/certificate_template.docx');
const z = new PizZip(c);
let x = z.files['word/document.xml'].asText();

function mergeAndReplace(xmlContent, replacements) {
  let result = xmlContent;
  for (const [search, replace] of Object.entries(replacements)) {
    const chars = search.split('');
    const regexParts = chars.map((ch, i) => {
      const escaped = ch.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
      if (i < chars.length - 1) {
        return escaped + '(?:<\\/w:t><\\/w:r>(?:<w:r[^>]*>)?(?:<w:rPr>.*?<\\/w:rPr>)?<w:t[^>]*>)?';
      }
      return escaped;
    });
    const fullRegex = new RegExp(regexParts.join(''), 'g');
    const matches = result.match(fullRegex);
    console.log(`"${search}": ${matches ? matches.length : 0} matches`);
    result = result.replace(fullRegex, replace);
  }
  return result;
}

const result = mergeAndReplace(x, {
  'TANGGAL_BULAN_TAHUN': '12 Agustus 2026',
  '(NAMA PESERTA)': 'John Doe',
  'JABATAN': 'PESERTA',
  'REGENCY/CITY': 'Kota Surabaya',
});

z.file('word/document.xml', result);
const output = z.generate({type: 'nodebuffer'});
fs.writeFileSync('test_cert.docx', output);
console.log('Test certificate written to test_cert.docx');

// Also verify by re-reading
const z2 = new PizZip(output);
const doc = require('docxtemplater');
const d = new doc(z2, {paragraphLoop: true, linebreaks: true});
console.log('Result text:', d.getFullText());
