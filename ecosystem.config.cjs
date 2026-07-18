module.exports = {
  apps: [
    {
      name: "daas-backend",
      script: "server.new.js",
      cwd: "./backend",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development"
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5001,
        CORS_ORIGINS: "http://195.35.20.207:3001,http://localhost:3001"
      }
    },
    {
      name: "daas-frontend",
      script: "npm",
      args: "start",
      cwd: "./frontend",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "development"
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3001
      }
    }
  ]
};
