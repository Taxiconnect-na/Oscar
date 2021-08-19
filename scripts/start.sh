#!/bin/bash
(cd /home/ubuntu/Oscar/server ; rm .env ; mv .env_live .env)
(cd /home/ubuntu/Oscar ; pm2 start ecosystem.config.js)
pm2 save