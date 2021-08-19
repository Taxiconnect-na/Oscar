FROM node:latest

ADD . /app/
WORKDIR /app/server
RUN rm .env
#Production
# RUN mv .env_live .env
#Development
RUN mv .env_dev .env

#Change .env for the apps
WORKDIR /app/client/Internal-Dashboards
#Production
# RUN mv .env_live .env
#Development
RUN mv .env_dev .env


WORKDIR /app/
#Download the certificate for DocumentDb Connection!
RUN wget https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem
RUN chmod 400 rds-combined-ca-bundle.pem

RUN npm install yarn -g --force
RUN yarn global add pm2
RUN yarn global add pm2-logrotate
RUN pm2 set pm2-logrotate:max_size 50Mb
RUN yarn install
RUN cd ./client/Internal-Dashboards && yarn install

EXPOSE 10014
EXPOSE 10011
EXPOSE 10010
EXPOSE 10012
EXPOSE 10300
EXPOSE 10305


CMD [ "pm2-runtime", "ecosystem.config.js" ]