const https = require('https');
const fs = require('fs');
const path = require('path');

const statePath = path.join(require('os').homedir(), '.expo', 'state.json');
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
const sessionSecret = JSON.parse(state.auth.sessionSecret);

const query = `
query {
  account(byName: {name: "lio26"}) {
    project(bySlug: {slug: "cheat-game"}) {
      builds(limit: 1) {
        id
        status
        logsUrl
        error {
          message
        }
      }
    }
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
    'Content-Length': data.length,
    'Expo-Session': JSON.stringify({ id: sessionSecret.id, version: sessionSecret.version })
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log(body.substring(0, 2000));
  });
});
req.on('error', e => console.log('Error:', e.message));
req.write(data);
req.end();
