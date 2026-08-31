const fs = require('fs');
const content = fs.readFileSync('index.php', 'utf8');
const lines = content.split(/\r?\n/);

console.log('--- Finding <html>, <head>, <body> tags in index.php ---');
lines.forEach((line, idx) => {
    if (/<html\b/i.test(line)) console.log(`line ${idx + 1}: ${line.trim()}`);
    if (/<\/html>/i.test(line)) console.log(`line ${idx + 1}: ${line.trim()}`);
    if (/<head\b/i.test(line)) console.log(`line ${idx + 1}: ${line.trim()}`);
    if (/<\/head>/i.test(line)) console.log(`line ${idx + 1}: ${line.trim()}`);
    if (/<body\b/i.test(line)) console.log(`line ${idx + 1}: ${line.trim()}`);
    if (/<\/body>/i.test(line)) console.log(`line ${idx + 1}: ${line.trim()}`);
});

console.log('\n--- Auditing DOM divs outside <script> blocks ---');
// Let's strip <script> blocks
let inScript = false;
let openDivs = 0;
let closeDivs = 0;
const divStack = [];

lines.forEach((line, idx) => {
    if (/<script\b/i.test(line)) inScript = true;
    
    if (!inScript) {
        const opens = (line.match(/<div\b[^>]*>/gi) || []).length;
        const closes = (line.match(/<\/div>/gi) || []).length;
        openDivs += opens;
        closeDivs += closes;
        if (opens !== closes) {
            // Track diff
            // console.log(`line ${idx + 1} (${openDivs} open, ${closeDivs} close): ${line.trim().slice(0, 80)}`);
        }
    }
    
    if (/<\/script>/i.test(line)) inScript = false;
});

console.log(`Total DOM open divs: ${openDivs}, close divs: ${closeDivs}, diff: ${openDivs - closeDivs}`);
