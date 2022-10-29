FROM node:latest
WORKDIR /app
COPY . .
RUN npm install
RUN curl https://raw.githubusercontent.com/Bungie-net/api/master/openapi.json > bungie-api/openapi.json
RUN curl https://www.bungie.net/Platform/Destiny2/Manifest/ > bungie-api/manifest.json
EXPOSE 3000
ENTRYPOINT npm run deploy