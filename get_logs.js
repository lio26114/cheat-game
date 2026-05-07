const https = require('https');
const fs = require('fs');
const path = require('path');

const statePath = path.join(require('os').homedir(), '.expo', 'state.json');
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
const sessionSecret = JSON.parse(state.auth.sessionSecret);

// Get build logs from EAS API
const buildId = 'c8bb791b-6036-426f-ba65-24aa1ddec55f';
const options = {
  hostname: 'api.expo.dev',
  path: `/v2/accounts/lio26/projects/cheat-game/builds/${buildId}`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Expo-Session': JSON.stringify({ id: sessionSecret.id, version: sessionSecret.version })
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.logsUrl) {
        console.log('Logs URL:', json.logsUrl);
      }
      console.log('Status:', json.status);
      console.log('Error:', json.error);
      if (json.errorBuildLogsUrl) {
        console.log('Error logs URL:', json.errorBuildLogsUrl);
      }
      // Print all top-level keys
      console.log('Keys:', Object.keys(json).join(', '));
    } catch(e) {
      console.log('Raw response (first 500):', data.substring(0, 500));
    }
  });
});
req.on('error', e => console.log('Request error:', e.message));
req.end();
