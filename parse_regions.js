const fs = require('fs');
const text = fs.readFileSync('D:/PRIBADI/NURIS/Bawaslu/514_kabupaten_kota_indonesia.txt', 'utf8');

const lines = text.split('\n').map(l => l.trim()).filter(l => l);

const regions = {};
let currentProvince = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Match province: "1. PROVINSI ACEH (23 Daerah)"
  const provMatch = line.match(/^\d+\.\s+PROVINSI\s+(.*?)\s+\(/i);
  if (provMatch) {
    // Convert to Title Case
    currentProvince = provMatch[1].replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    regions[currentProvince] = [];
  } else {
    // Match city: "1. Kab. Aceh Barat" or "19. Kota Banda Aceh"
    const cityMatch = line.match(/^\d+\.\s+(Kab\.|Kota)\s+(.*)/i);
    if (cityMatch && currentProvince) {
      regions[currentProvince].push(`${cityMatch[1]} ${cityMatch[2]}`);
    }
  }
}

fs.writeFileSync('src/lib/regions.json', JSON.stringify(regions, null, 2));
console.log('Successfully generated regions JSON.');
