module.exports = {
  apps: [{
    name: 'farmago-backend',
    cwd: '/var/www/Farmago',
    script: 'server/dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
