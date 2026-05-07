const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const npmVersion = '10.8.2';
const toolsDir = __dirname;
const npmDir = path.join(toolsDir, 'node_modules', 'npm');

console.log('Checking if npm is installed...');

if (fs.existsSync(npmDir)) {
    console.log('npm already installed at:', npmDir);
    process.exit(0);
}

console.log('Installing npm...');

const result = spawnSync(
    process.execPath,
    [
        '-e',
        
        const https = require('https');
        const fs = require('fs');
        const path = require('path');
        
        const tarballUrl = 'https://registry.npmmirror.com/npm/-/npm-.tgz';
        const toolsDir = '';
        
        https.get(tarballUrl, (res) => {
            const zlib = require('zlib');
            const tar = require('tar');
            res.pipe(zlib.createGunzip()).pipe(
                tar.x({
                    cwd: toolsDir,
                    strip: 1
                })
            ).on('finish', () => {
                console.log('npm installed successfully!');
            }).on('error', (err) => {
                console.error('Error installing npm:', err);
                process.exit(1);
            });
        }).on('error', (err) => {
            console.error('Error downloading npm:', err);
            process.exit(1);
        });
        
    ],
    { cwd: toolsDir, stdio: 'inherit' }
);

if (result.error) {
    console.error('Error:', result.error);
    process.exit(1);
}
