const fs = require('fs');
const Sequelize = require('sequelize');
const { QueryTypes } = require('sequelize');

(async () => {
    try {
        const config = JSON.parse(fs.readFileSync('./config.json', { encoding: 'utf8', flag: 'r' }));
        const initializeSchema = (config) => {
            return [new Sequelize({
                database: config.coinout.database,
                username: config.coinout.username,
                password: config.coinout.password,
                host: config.coinout.host,
                port: 5432,
                dialect: "postgres",
                logging: false,
                dialectOptions: {
                    ssl: {
                        require: true,
                        rejectUnauthorized: false
                    }
                },
            }),
        
            new Sequelize({
                database: config.orderScraper.database,
                username: config.orderScraper.username,
                password: config.orderScraper.password,
                host: config.orderScraper.host,
                port: 5432,
                dialect: "postgres",
                logging: false
            })];
        
        }
        const getDuplicateCount = (arr) => {
            const counts = {};
            arr.forEach((x) => {
              counts[x] = (counts[x] || 0) + 1;
            });
            return counts;
        }  
        // init db
        const [coinoutSchema, scrapingSchema] = initializeSchema(config.db);
        const recordsNo = 1000;
        const orderHistory = await scrapingSchema.query(`select oh.id, oh.panelist_id, oh.platform_id, oh.from_date, oh.to_date from "orderHistory" oh where oh.scrapping_type='html' and oh.order_count > ${recordsNo} order by oh.order_count asc`,{
            type: QueryTypes.SELECT
        });
        const totalRecords = orderHistory.length
        console.log(`Total records with more than ${recordsNo} orders `, totalRecords);
        console.log(`111 `, orderHistory[0].id, orderHistory[0].panelist_id, orderHistory[0].platform_id, orderHistory[0].from_date, orderHistory[0].to_date);
        const uniqueOrders = orderHistory.filter((value, index, self) =>
            index === self.findIndex((t) => (
                t.panelist_id === value.panelist_id && t.platform_id === value.platform_id 
                && new Date(t.from_date).toLocaleDateString("en-US") === new Date(value.from_date).toLocaleDateString("en-US") && new Date(t.to_date).toLocaleDateString("en-US") === new Date(value.to_date).toLocaleDateString("en-US") 
            ))
        );
        const duplicateOrderCount = totalRecords - uniqueOrders.length;
        console.log(`Total duplicate orders - ${duplicateOrderCount} and unique orders ${uniqueOrders.length}`);
        const duplicateOrdersInside = [];
        for (const orderHistory of uniqueOrders) {
            let orderData = await scrapingSchema.query(`select order_data from public."orderHistory" where id = ${orderHistory.id}`,{
                type: QueryTypes.SELECT
            });
            if(orderData.length) {
                orderData = orderData[0].order_data;
                // break;
                const orderIds = orderData.map(d => d.orderId);
                const dup = getDuplicateCount(orderIds);
                if(Object.keys(dup).length) {
                    duplicateOrdersInside.push(Object.keys(dup));
                }
            }
        }
        console.log(`Total order history records having dups - ${duplicateOrdersInside.length}`);
    } catch (e) {
        console.log('Errorrrrr ', e);
    }
})();