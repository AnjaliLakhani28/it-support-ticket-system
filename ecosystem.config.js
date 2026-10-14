// pm2 process file - keeps the backend running on EC2 and restarts it on crash.
// Usage on EC2:  pm2 start ecosystem.config.js   |   pm2 status
const path = require('path');

module.exports = {
  apps: [
    {
      name: 'ists-backend',
      cwd: path.join(__dirname, 'backend'),
      script: 'server.js',
      instances: 1,
      autorestart: true,
      max_memory_restart: '300M',
      env: { NODE_ENV: 'production' },
    },
  ],
};
