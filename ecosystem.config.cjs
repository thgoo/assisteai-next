// PM2 process for the front, like ../bargah.com.br/bargah.
//
//   pm2 start ecosystem.config.cjs
//
// Next.js reads .env.production.local / .env.local from this folder (NEXT_PUBLIC_* at build time).

const os = require('os');
const path = require('path');

const BUN = process.env.BUN_PATH || path.join(os.homedir(), '.bun/bin/bun');

module.exports = {
  apps: [
    {
      name: 'assisteai.com.br',
      cwd: __dirname,
      script: BUN,
      args: 'run start -- -p 3003',
      interpreter: 'none',
      exec_mode: 'fork',
      autorestart: true,
      restart_delay: 3000, // a crash-looping app waits 3 s between restarts
    },
  ],
};
