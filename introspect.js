const https = require('https');
const fs = require('fs');
const path = require('path');

const statePath = path.join(require('os').homedir(), '.expo', 'state.json');
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
const sessionSecret = JSON.parse(state.auth.sessionSecret);

// Try the introspection query to find available queries
const query = `{ __schema { queryType { fields { name } } } }`;
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
    try {
      const json = JSON.parse(result);
      const fields = json.data.__schema.queryType.fields.map(f => f.name);
      console.log('Available queries:', fields.filter(f => f.toLowerCase().includes('build')).join('\n'));
    } catch(e) {
      console.log(result.substring(0, 2000));
    }
  });
});
req.on('error', e => console.log('Error:', e.message));
req.write(data);
req.end();
