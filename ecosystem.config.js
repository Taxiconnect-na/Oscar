module.exports = {
    apps: [ 
      {
        name: "drivers-service",
        script: "./server/drivers-service/driverServer.js",
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: "1G",
        env: {
          NODE_ENV: "development",
        },
        env_production: {
          NODE_ENV: "production",
        },
      },
      {
        name: "passengers-service",
        script: "./server/passengers-service/passengerServer.js",
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: "1G",
        env: {
          NODE_ENV: "development",
        },
        env_production: {
          NODE_ENV: "production",
        },
      },
      {
        name: "central-service",
        script: "./server/central-service/centralServer.js",
        instances: 2,
        autorestart: true,
        watch: false,
        max_memory_restart: "1G",
        env: {
          NODE_ENV: "development",
        },
        env_production: {
          NODE_ENV: "production",
        },
      },
      {
        name: "main-view-service",
        script: "./server/main-view-service/mainViewServer.js",
        instances: 2,
        autorestart: true,
        watch: false,
        max_memory_restart: "1G",
        env: {
          NODE_ENV: "development",
        },
        env_production: {
          NODE_ENV: "production",
        },
      },
   
      {
        name: "admin-app-internal",
        script: "cd ./client/adminui && npm -- start",
        autorestart: true,
        watch: false,
        max_memory_restart: "1G",
        env: {
          NODE_ENV: "development",
        },
        env_production: {
          NODE_ENV: "production",
        },
      },

      {
        name: "visualizer-service",
        script: "./server/plot-service/plotServer.js",
        instances: 3,
        autorestart: true,
        watch: false,
        max_memory_restart: "2G",
        env: {
          NODE_ENV: "development",
        },
        env_production: {
          NODE_ENV: "production",
        },
      }

    ],
  };