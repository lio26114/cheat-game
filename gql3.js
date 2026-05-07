const https = require('https');
const fs = require('fs');
const path = require('path');

const statePath = path.join(require('os').homedir(), '.expo', 'state.json');
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
const sessionSecret = JSON.parse(state.auth.sessionSecret);

const query = `
query {
  builds(accountName: "lio26", projectSlug: "cheat-game", limit: 1) {
    id
    status
    logsUrl
    error {
      message
    }
    metadata
  }
}
`;

const data = JSON.stringify({ query });

const options = {
  hostname: 'api.expo.dev',
  path: '/graphql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'Expo-Session': JSON.stringify({ id: sessionSecret.id, version: sessionSecret.version })
  }
};

const req = https.request(options, (res) => {
  let body = [];
  res.on('data', chunk => body.push(chunk));
  res.on('end', () => {
    const result = Buffer.concat(body).toString();
    console.log(result.substring(0, 5000));
  });
});
req.on('error', e => console.log('Error:', e.message));
req.write(data);
req.end();
