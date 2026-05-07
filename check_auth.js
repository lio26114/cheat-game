const https = require('https');
const http = require('http');

// Try to get build details using EAS CLI's internal modules
const easBin = 'D:/cheat-game/node_modules/eas-cli/bin/run';
process.env.EAS_NO_VCS = '1';

// Use the EAS REST API
const token = require('fs').readFileSync(require('os').homedir() + '/.easrc', 'utf8').trim();
console.log('Token found:', token ? 'yes' : 'no');
