module.exports = {
  apps: [
    {
      name: 'TraceGrid frontend',
      script: './node_modules/next/dist/bin/next',
      args: 'start -p 3000 -H 0.0.0.0',
      exec_mode: 'cluster',
      watch: false,
      autorestart: true,
      instances: 'max',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
    },
  ],
};
