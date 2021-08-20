#!/bin/bash

(cd /home/ubuntu/Oscar ; sudo docker-compose down)
sudo docker system prune --all --force