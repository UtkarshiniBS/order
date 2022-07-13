# Order Scraper - Backend/API

Order Scrapper is a Backend/API server built upon nodejs. It serves API and manages backend operation to support Scrapping. At the moment, scraper API is specifically for Amazon Orders.

## Features
- Exposes API server & online API documentation
- Handles Scrapping Configuration (Srcrapping interval,starting date for scrapping, etc)
- Configuration to remove PII data
- Download & store orders csv file in local File System
- ✨Sample Scrapping script that runs on mobile app✨

## Tech

Order Scrapper uses following open sources:

- [Node js](https://nestjs.com/) - Nest Js as our backend framework
- [PostgresSQL](https://www.postgresql.org/) - Database to store our data
- [Swagger](https://swagger.io/tools/swagger-ui/) - To document our API's.

## Installation

To install Order Scrapper, we recommend [Node.js](https://nodejs.org/) v10+

Install the dependencies and devDependencies and start the server.

```sh
cd receiptstar-order-scraping-sdk-api
npm i
cp sample.env .env
```

Edit .env file & update actual configuration for the environment

```sh
npm start
```

## Production

Install the dependencies and devDependencies

```sh
npm i
npm install -g pm2
cp sample.env .env
```

Edit .env file & update actual configuration for the environment

```sh
npm run build
pm2 start dist/src/main.js --name prod

--Logs path
pm2 start dist/src/main.js -o ../hotfix-logs/out.log -e ../hotfix-logs/err.log --name hotfix
```

## Production - Server logs

To view server logs in production, run following command

```sh
pm2 logs
```
Verify the deployment by navigating to your server address in
your preferred browser.

```sh
127.0.0.1:3000
```

## API Documentation

API documentation can be access at following url relative to your server addres

```sh
127.0.0.1:3000/api
```

## License

To be Added
