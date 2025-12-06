module.exports = {
  apps: [{
    name: 'profile',
    script: './src/backend/dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production'
    },
    kill_timeout: 5000,
    max_memory_restart: '500M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
}
