module.exports = {
  apps: [
    {
      name: "Drivers service",
      script: "./server/drivers-service/driverServer.js",
      instances: 1,
      autorestart: true,
      watch: true,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "Riders service",
      script: "./server/passengers-service/passengerServer.js",
      instances: 1,
      autorestart: true,
      watch: true,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "Central service",
      script: "./server/central-service/centralServer.js",
      instances: 1,
      autorestart: true,
      watch: true,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "Main view service",
      script: "./server/main-view-service/mainViewServer.js",
      instances: 1,
      autorestart: true,
      watch: true,
      max_memory_restart: "2G",
      env: {
        NODE_ENV: "production",
      },
    },

    // {
    //   name: "Main UI Dashboard",
    //   script: "cd ./client/adminui && npm -- start",
    //   autorestart: true,
    //   watch: true,
    //   max_memory_restart: "1G",
    //   env: {
    //     NODE_ENV: "development",
    //   },
    //   env_production: {
    //     NODE_ENV: "production",
    //   },
    // },

    {
      name: "Graphs service",
      script: "./server/plot-service/plotServer.js",
      instances: 1,
      autorestart: true,
      watch: true,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
