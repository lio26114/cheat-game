const fs = require('fs');

const logFile = 'D:/cheat-game/eas_log_3.txt';
const content = fs.readFileSync(logFile, 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);

// Find Gradle error - search for common Gradle error patterns
const errorPatterns = [
  'FAILURE',
  'BUILD FAILED',
  'What went wrong',
  'Exception',
  'Error:',
  'Could not',
  'Failed to',
  'Task failed',
  'Execution failed'
];

console.log('\n=== SEARCHING FOR GRADLE ERRORS ===');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (const pattern of errorPatterns) {
    if (line.includes(pattern)) {
      // Print this line and next 10 lines for context
      console.log(\n--- Found '' at line  ---);
      const end = Math.min(i + 20, lines.length);
      for (let j = i; j < end; j++) {
        console.log(${(j+1).toString().padStart(5)}: );
      }
      i = end;  // Skip ahead
      break;
    }
  }
}

// Also print last 200 lines
console.log('\n\n=== LAST 200 LINES ===');
const start = Math.max(0, lines.length - 200);
for (let i = start; i < lines.length; i++) {
  console.log(\: \);
}
