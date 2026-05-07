const fs = require('fs');
const path = require('path');
const homeDir = require('os').homedir();

// Find EAS session token
const stateDir = path.join(homeDir, '.expo');
const stateFile = path.join(stateDir, 'devices.json');

try {
  // Try reading the auth state
  const authStatePath = path.join(stateDir, 'auth-state.json');
  if (fs.existsSync(authStatePath)) {
    console.log('Auth state:', fs.readFileSync(authStatePathPath, 'utf8').substring(0, 200));
  }
  
  // List all files in .expo directory
  const files = fs.readdirSync(stateDir);
  console.log('Files in .expo:', files.join(', '));
  
  // Try to find session token
  for (const file of files) {
    const fp = path.join(stateDir, file);
    try {
      const content = fs.readFileSync(fp, 'utf8');
      if (content.includes('sessionSecret') || content.includes('accessToken') || content.includes('token')) {
        console.log(`\n${file} (first 300 chars):`, content.substring(0, 300));
      }
    } catch(e) {}
  }
} catch(e) {
  console.log('Error:', e.message);
}
