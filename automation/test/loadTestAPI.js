const axios = require('axios');

(async () => {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 123'
    };
    const logsTable = async function () {
        try {
            // const response = await axios.post('http://localhost:3000/scrapping/push_events',
            //     {
            //         "panelistId": "string",
            //         "platformId": "string",
            //         "section": "connection",
            //         "type": "string",
            //         "status": "success",
            //         "scrappingType": "report",
            //         "message": "string",
            //         "devicePlatform": "android",
            //         "deviceId": "string",
            //         "scrapingContext": "foreground",
            //         "notifyType": "string"
            //     },
            //     { headers: headers });
            const response = await axios.post('http://localhost:3000/v2/order_history/upload_orders/amazon',
                {
                    "panelistId": "string123",
                    "platformId": "string123",
                    "fromDate": "01-01-2018",
                    "toDate": "01-01-2021",
                    "status": "string",
                    "listingScrapeTime": 0,
                    "listingOrderCount": 0,
                    "data": [
                        {
                            "orderId": "string",
                            "orderDate": "1/2/2019",
                            "scrapingTime": {
                                "pageLoadTime": 0,
                                "scrapeTime": 0,
                                "scrapingContext": "string"
                            }
                        }
                    ]
                },
                { headers: headers });
            return response.data;
        } catch (error) {
            throw error.response.data;
        }
    }

    try {
        for (let index = 0; index < 1000; index++) {
             logsTable();
        }
    } catch (error) {
        console.error(error);
    }
})();