FROM node:latest

WORKDIR /app
COPY . .

RUN npm install yarn -g --force
RUN yarn global add pm2
RUN yarn global add pm2-logrotate
RUN pm2 set pm2-logrotate:max_size 50Mb
RUN cd ./server/drivers-service && yarn install
RUN cd ./server/main-view-service && yarn install
RUN cd ./server/passengers-service && yarn install
RUN cd ./client/adminui && yarn install
RUN cd ./client/partnerui && yarn install

EXPOSE 10014
EXPOSE 10011
EXPOSE 10010
EXPOSE 10012
EXPOSE 10300
EXPOSE 10305


CMD [ "pm2-runtime", "ecosystem.config.js" ]