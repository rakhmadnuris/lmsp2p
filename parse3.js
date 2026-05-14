const fs = require('fs');
const text = fs.readFileSync('D:/PRIBADI/NURIS/Bawaslu/Rev.1.1 Soal Pre Test dan Post Test.docx.txt', 'utf8');

const questions = [];

// Split the text into chunks by "Jawaban:" or "Jawbaan:"
const parts = text.split(/Jawab[a-z]*:\s*/i);

for (let i = 0; i < 30; i++) {
  if (i >= parts.length - 1) break;
  
  let blockBefore = parts[i];
  let blockAfter = parts[i+1];
  
  // The answer line is the first line of blockAfter
  let answerLine = blockAfter.split('\n')[0].trim();
  
  // The question block is everything in blockBefore after the previous answer, 
  // or the very beginning for i=0
  // Wait, blockBefore contains the END of the previous answer and then the NEXT question.
  // We need to extract just the next question from blockBefore.
  // A question starts with "Number. "
  const qMatch = blockBefore.match(new RegExp(`(?:^|\\n)\\s*${i+1}\\.\\s+(.*)`, 's'));
  if (!qMatch) continue;
  
  let qFullText = qMatch[1].trim();
  
  // Now we have qFullText which is the question text AND the options.
  // The options are always the LAST 4 non-empty lines before the answer.
  // Unless it's one of those where options are scattered? Usually they are the last 4 lines.
  const lines = qFullText.split('\n').map(l => l.trim()).filter(l => l);
  
  let options = [];
  let qText = '';
  
  // Look for lines starting with a., b., c., d.
  let aIdx = lines.findIndex(l => /^a\.\s/i.test(l));
  let bIdx = lines.findIndex(l => /^b\.\s/i.test(l));
  let cIdx = lines.findIndex(l => /^c\.\s/i.test(l));
  let dIdx = lines.findIndex(l => /^d\.\s/i.test(l));
  
  if (aIdx !== -1 && bIdx !== -1 && cIdx !== -1 && dIdx !== -1) {
    // Found standard options
    options = [
      lines[aIdx].replace(/^a\.\s*/i, ''),
      lines[bIdx].replace(/^b\.\s*/i, ''),
      lines[cIdx].replace(/^c\.\s*/i, ''),
      lines[dIdx].replace(/^d\.\s*/i, '')
    ];
    qText = lines.slice(0, aIdx).join('\n');
  } else {
    // If a.b.c.d. not found explicitly on separate lines, let's just take the last 4 lines if they exist
    // Or maybe they use 1. 2. 3. 4. for options?
    // Let's just take the last 4 lines.
    if (lines.length >= 4) {
      options = lines.slice(-4).map(o => o.replace(/^[a-d1-4][\.\)]\s*/i, ''));
      qText = lines.slice(0, -4).join('\n');
    } else {
      qText = lines.join('\n');
      options = ["A", "B", "C", "D"]; // fallback
    }
  }
  
  let correctIndex = 0;
  const matchAns = answerLine.match(/^([a-d1-4])/i);
  if (matchAns) {
    let letter = matchAns[1].toLowerCase();
    if (letter === 'a' || letter === '1') correctIndex = 0;
    if (letter === 'b' || letter === '2') correctIndex = 1;
    if (letter === 'c' || letter === '3') correctIndex = 2;
    if (letter === 'd' || letter === '4') correctIndex = 3;
  }
  
  questions.push({
    id: i + 1,
    q: qText,
    options: options,
    correctOption: correctIndex
  });
}

fs.writeFileSync('src/lib/questions.json', JSON.stringify(questions, null, 2));
console.log('Successfully parsed ' + questions.length + ' questions.');
