module.exports = {
  apps: [{
    name: 'profile',
    script: './dist/src/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production'
    },
    kill_timeout: 5000,
    max_memory_restart: '500M'
  }]
}
