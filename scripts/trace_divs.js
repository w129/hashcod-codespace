const fs = require('fs');
const content = fs.readFileSync('index.php', 'utf8');
const lines = content.split(/\r?\n/);

let inScript = false;
let inStyle = false;
const stack = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    if (/<style\b/i.test(line)) inStyle = true;
    if (/<\/style>/i.test(line)) { inStyle = false; continue; }
    if (inStyle) continue;

    if (/<script\b/i.test(line)) inScript = true;
    if (inScript) {
        if (/<\/script>/i.test(line)) inScript = false;
        continue;
    }

    // Match all <div> and </div> tokens in order on this line
    const regex = /<\/?div\b[^>]*>/gi;
    let match;
    while ((match = regex.exec(line)) !== null) {
        const tag = match[0];
        if (tag.startsWith('</')) {
            if (stack.length === 0) {
                console.log(`ERROR: Extra closing </div> at line ${lineNum}: ${line.trim()}`);
            } else {
                stack.pop();
            }
        } else {
            // Opening div
            stack.push({ lineNum, tag: tag.slice(0, 80), line: line.trim() });
        }
    }
}

console.log(`Remaining unclosed divs on stack: ${stack.length}`);
stack.forEach(item => {
    console.log(`Unclosed <div> from line ${item.lineNum}: ${item.tag}`);
});
