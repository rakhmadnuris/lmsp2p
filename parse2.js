const fs = require('fs');
const text = fs.readFileSync('D:/PRIBADI/NURIS/Bawaslu/Rev.1.1 Soal Pre Test dan Post Test.docx.txt', 'utf8');

const questions = [];

for (let i = 1; i <= 30; i++) {
  // Find start of question i
  const startRegex = new RegExp(`(^|\\n)${i}\\.\\s+`);
  const matchStart = text.match(startRegex);
  if (!matchStart) continue;
  
  const startIndex = matchStart.index + matchStart[0].length;
  
  // Find start of question i+1 or end of string
  const endRegex = new RegExp(`\\n${i+1}\\.\\s+`);
  const matchEnd = i === 30 ? { index: text.length } : text.match(endRegex);
  
  const endIndex = matchEnd ? matchEnd.index : text.length;
  
  const block = text.slice(startIndex, endIndex).trim();
  
  // Extract question text (everything up to the first option "a." or "1.")
  // Wait, some questions have sub-points (1., 2., 3., 4.) and THEN options (a., b., c., d.) or options are a,b,c,d
  // It's safer to find "Jawaban:"
  const jawbanMatch = block.match(/Jawab[a-z]*:\s*(.*)/i);
  let answerLine = '';
  let restBlock = block;
  if (jawbanMatch) {
    answerLine = jawbanMatch[1].trim();
    restBlock = block.slice(0, jawbanMatch.index).trim();
  }
  
  // Options are usually "a.", "b.", "c.", "d." OR "1.", "2.", "3.", "4." at the start of a line
  const lines = restBlock.split('\n').map(l => l.trim()).filter(l => l);
  
  // Find where options start. They usually start at the first line that matches /^[a-d1-4]\.\s/
  // But wait, the question text itself might span multiple lines, e.g. Q5 has 1. 2. 3. 4. 5. 6. 7. then "Dari daftar di atas..." then "a. ... b. ..."
  let qTextLines = [];
  let optionLines = [];
  
  let inOptions = false;
  for (let j = 0; j < lines.length; j++) {
    const line = lines[j];
    // We consider options starting when we see "a." or when we are sure it's the 4 options at the end
    // But since it varies, let's just grab the last 4 lines if they look like options, or anything starting with a/b/c/d
    if (/^[a-d]\.\s/i.test(line)) {
      inOptions = true;
    }
    
    if (inOptions) {
      optionLines.push(line);
    } else {
      qTextLines.push(line);
    }
  }
  
  // If we didn't find "a.", maybe they are "1.", "2." at the very end
  if (optionLines.length === 0) {
    // just take the last 4 lines as options
    if (lines.length > 4) {
      optionLines = lines.slice(-4);
      qTextLines = lines.slice(0, -4);
    }
  }
  
  const qText = qTextLines.join('\n');
  const options = optionLines.map(o => o.replace(/^[a-d1-4][\.\)]\s*/i, ''));
  
  // Parse correct option index
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
    id: i,
    q: qText,
    options: options,
    correctOption: correctIndex
  });
}

fs.writeFileSync('src/lib/questions.json', JSON.stringify(questions, null, 2));
console.log('Successfully parsed ' + questions.length + ' questions.');
