const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const statePath = path.join(require('os').homedir(), '.expo', 'state.json');
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
const sessionSecret = JSON.parse(state.auth.sessionSecret);

// Use the correct API endpoint
const buildId = 'bb69f612-fc3d-41b5-b091-bf6b57171f24';

// Try fetching build details via REST API v2
const options = {
  hostname: 'api.expo.dev',
  path: `/v2/accounts/lio26/builds/${buildId}`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Expo-Session': JSON.stringify({ id: sessionSecret.id, version: sessionSecret.version })
  }
};

const req = https.request(options, (res) => {
  let data = [];
  res.on('data', chunk => data.push(chunk));
  res.on('end', () => {
    const body = Buffer.concat(data).toString();
    console.log('Status:', res.statusCode);
    try {
      const json = JSON.parse(body);
      console.log(JSON.stringify(json, null, 2).substring(0, 3000));
    } catch(e) {
      console.log('Body:', body.substring(0, 1000));
    }
  });
});
req.on('error', e => console.log('Error:', e.message));
req.end();
