const https = require('https');
const fs = require('fs');
const path = require('path');

const statePath = path.join(require('os').homedir(), '.expo', 'state.json');
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
const sessionSecret = JSON.parse(state.auth.sessionSecret);

// Try the correct GraphQL query
const query = `
query GetBuildLogs($buildId: ID!) {
  buildsByIds(buildIds: [$buildId]) {
    id
    status
    logsUrl
    error {
      message
      errorCode
    }
    androidPackage
    artifacts {
      buildUrl
    }
  }
}
`;

const variables = { buildId: "bb69f612-fc3d-41b5-b091-bf6b57171f24" };
const data = JSON.stringify({ query, variables });

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
    console.log('Status:', res.statusCode);
    console.log(result.substring(0, 3000));
  });
});
req.on('error', e => console.log('Error:', e.message));
req.write(data);
req.end();
