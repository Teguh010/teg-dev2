module.exports = {
  apps: [
    {
      name: 'TraceGrid frontend',
      script: './node_modules/next/dist/bin/next',
      args: 'start',
      exec_mode: 'cluster',
      watch: false,
      autorestart: true,
      instances: 'max',
    },
  ],
};

