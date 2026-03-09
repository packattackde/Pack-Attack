module.exports = {
  apps: [
    {
      name: 'battle-auto-start-scheduler',
      script: 'npm',
      args: 'run check-auto-start',
      cwd: '/var/www/packattack/app',
      cron_restart: '* * * * *',
      autorestart: false,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};

