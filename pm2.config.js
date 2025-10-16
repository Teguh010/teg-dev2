module.exports = {
  apps: [
    {
      name: 'tracegrid-frontend',
      script: 'npm',
      args: 'run start',
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
    },
  ],
};
