// Find the Expo CLI entry point
const fs = require('fs');
const path = require('path');

// Check for @expo/cli in various locations
const locations = [
  'node_modules/@expo/cli',
  'node_modules/expo/node_modules/@expo/cli',
  'node_modules/@expo/metro-config',
];

for (const loc of locations) {
  const fullPath = path.join(__dirname, loc);
  if (fs.existsSync(fullPath)) {
    console.log('Found:', loc);
    const pkgJson = JSON.parse(fs.readFileSync(path.join(fullPath, 'package.json'), 'utf8'));
    console.log('  bin:', JSON.stringify(pkgJson.bin));
  } else {
    console.log('NOT found:', loc);
  }
}

// Check what expo package exports
const expoPkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'node_modules/expo/package.json'), 'utf8'));
console.log('\nexpo package bin:', JSON.stringify(expoPkg.bin));

// Search for cli binary in expo package
function findFiles(dir, pattern, depth = 0) {
  if (depth > 3) return [];
  const results = [];
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.includes('cli') || entry.name.includes('bin')) {
        results.push(path.join(dir, entry.name));
      }
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        results.push(...findFiles(path.join(dir, entry.name), pattern, depth + 1));
      }
    }
  } catch(e) {}
  return results;
}

console.log('\nExpo CLI-related files:');
const cliFiles = findFiles(path.join(__dirname, 'node_modules/expo'), 'cli');
cliFiles.forEach(f => console.log(' ', f));
