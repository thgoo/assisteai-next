// PM2 process for the front, like ../bargah.com.br/bargah.
//
//   scripts/deploy.sh     # builds, then starts or restarts it
//
// Name and port come from the environment: production by default, or `.env.deploy` for another copy (see
// scripts/deploy.sh). Next.js reads .env.production.local from this folder (NEXT_PUBLIC_* at build time).

const os = require('os');
const path = require('path');

const BUN = process.env.BUN_PATH || path.join(os.homedir(), '.bun/bin/bun');
const NAME = process.env.APP_NAME || 'assisteai.com.br';
const PORT = process.env.PORT || '3003';

module.exports = {
  apps: [
    {
      name: NAME,
      cwd: __dirname,
      script: BUN,
      args: `run start -- -p ${PORT}`,
      interpreter: 'none',
      exec_mode: 'fork',
      autorestart: true,
      restart_delay: 3000, // a crash-looping app waits 3 s between restarts
    },
  ],
};
