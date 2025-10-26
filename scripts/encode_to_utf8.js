const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '..', 'data', 'transformed_movies.csv');
const outputFile = path.join(__dirname, '..', 'data', 'transformed_movies_utf8.csv');

console.log('Reading input file...');
let content = fs.readFileSync(inputFile, 'latin1'); // Read as latin1/ISO-8859-1 (superset of WIN1252)

console.log('Cleaning problematic characters...');
// Remove or replace control characters and invalid bytes
content = content.replace(/[\x80-\x9F]/g, ''); // Remove WIN1252 control chars
content = content.replace(/\uFFFD/g, ''); // Remove replacement chars

console.log('Writing UTF-8 output...');
fs.writeFileSync(outputFile, content, 'utf8');

console.log(`✅ Successfully converted to UTF-8: ${outputFile}`);
console.log(`Original size: ${fs.statSync(inputFile).size} bytes`);
console.log(`New size: ${fs.statSync(outputFile).size} bytes`);