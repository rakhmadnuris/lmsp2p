const fs = require('fs');
const text = fs.readFileSync('D:/PRIBADI/NURIS/Bawaslu/Rev.1.1 Soal Pre Test dan Post Test.docx.txt', 'utf8');

const questions = [];
const blocks = text.split(/\n(?=\d+\.\s+)/).filter(b => /^\d+\./.test(b));

blocks.forEach(block => {
  const lines = block.split('\n').map(l => l.trim()).filter(l => l);
  const qLine = lines.shift(); 
  
  const ansIndex = lines.findIndex(l => l.toLowerCase().startsWith('jawab'));
  const optionsLines = lines.slice(0, ansIndex);
  let answerLine = lines.slice(ansIndex).join(' ').replace(/^jawab[a-z]*:\s*/i, '').trim();
  
  let options = optionsLines.map(o => o.replace(/^[a-d1-4][\.\)]\s*/, ''));
  
  let correctIndex = 0;
  const match = answerLine.match(/^([a-d1-4])/i);
  if (match) {
    let letter = match[1].toLowerCase();
    if (letter === 'a' || letter === '1') correctIndex = 0;
    if (letter === 'b' || letter === '2') correctIndex = 1;
    if (letter === 'c' || letter === '3') correctIndex = 2;
    if (letter === 'd' || letter === '4') correctIndex = 3;
  }
  
  questions.push({
    id: parseInt(qLine.match(/^\d+/)[0]),
    q: qLine.replace(/^\d+\.\s*/, ''),
    options: options,
    correctOption: correctIndex
  });
});

fs.writeFileSync('src/lib/questions.json', JSON.stringify(questions, null, 2));
console.log('Successfully parsed ' + questions.length + ' questions.');
