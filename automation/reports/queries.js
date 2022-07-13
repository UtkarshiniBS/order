
// const Pool = require('pg').Pool;
const fs = require("fs");
const Sequelize = require('sequelize');
const { QueryTypes } = require('sequelize');

const IOS = 'ios';
const ANDROID = 'android';
let TO_DATE = '';
let PLATFORM_SOURCE = '';

const PlatformSources = {
    AMAZON: 'amazon',
    INSTACART: 'instacart',
    KROGER: 'kroger',
    WALMART: 'walmart'
}

const setPlatformSource = (platform) => {
    PLATFORM_SOURCE = platform;
}
const setToDate = (toDate) => {
    TO_DATE = toDate;
}

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

const getUpdatedUsers = async (coinoutSchema, platform, version) => {
    const records = await coinoutSchema.query(`select c.uuid from customers c where ${platform}_client_version='${version}'`, {
        type: QueryTypes.SELECT
    });
    console.log('Total Users in ' + platform, records.length);
    return records;
}

const insertUsers = async (scrapingSchema, users, platform, version) => {
    const result = await scrapingSchema.query(`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${platform}_${version}_users')`,{
        type: QueryTypes.SELECT
    });
    console.log('Result ', result);
    if(!result[0].exists) {
        await scrapingSchema.query(`CREATE TABLE public.${platform}_${version}_users (uuid varchar(1000) NULL DEFAULT NULL::character varying)`,{
            type: QueryTypes.RAW
        });
    }
    // await scrapingSchema.query(`truncate table public.${platform}_${version}_users`, {
    //     type: QueryTypes.RAW
    // });
    await scrapingSchema.query(`delete from public.${platform}_${version}_users where true`, {
        type: QueryTypes.RAW
    });
    const chunkSize = 1000;
    while (users.length) {
        const userBatch = users.splice(0, chunkSize);
        const batch = userBatch.map((user, index) => { return `('${user.uuid}')` });
        await scrapingSchema.query(`INSERT INTO public.${platform}_${version}_users (uuid) VALUES ${batch};`, {
            type: QueryTypes.INSERT
        });
    }
}

const updateUsers = async (coinoutSchema, scrapingSchema, versionConfig) => {
    const iosUsers = await getUpdatedUsers(coinoutSchema, IOS, versionConfig.iosVersionCoinout);
    await insertUsers(scrapingSchema, iosUsers, IOS, versionConfig.iosTableVersionName);
    const androidUsers = await getUpdatedUsers(coinoutSchema, ANDROID, versionConfig.androidVersionCoinout);
    await insertUsers(scrapingSchema, androidUsers, ANDROID, versionConfig.androidTableVersionName);
}

const getTotalConnections = async (scrapingSchema, platform, version, deployedDate) => {
    const connection = `${PLATFORM_SOURCE}Connection`;
    const data = await scrapingSchema.query(
        `select count(1) from "${connection}" where 
        created_at between '${deployedDate} 00:00:00' and '${TO_DATE} 00:00:00' 
        and panelist_id in (select uuid from ${platform}_${version}_users)`
    , {
        type: QueryTypes.SELECT
    });
    return data.length ? data[0].count : 0; 
}

const getTotalUpdatedUsers = async (scrapingSchema, platform, version) => {
    const data = await scrapingSchema.query(`select count(1) from public.${platform}_${version}_users`,{
        type: QueryTypes.SELECT
    });
    return data.length ? data[0].count : 0; 
}

const getConnectionBreakDown = async (scrapingSchema, platform, version, deployedDate) => {
    const connection = `${PLATFORM_SOURCE}Connection`;

    const data = await scrapingSchema.query(
        `select count(1), status, order_status,message from "${connection}" ac where
         created_at between '${deployedDate} 00:00:00' and '${TO_DATE} 00:00:00'
         and panelist_id in (select uuid from ${platform}_${version}_users) group by status,
         order_status, message;`
    , {
        type: QueryTypes.SELECT
    });
    return data;
}

const getUnsuccessfulConnection = async (scrapingSchema, platform, version, deployedDate) => {
    const connection = `${PLATFORM_SOURCE}Connection`;
    const logs = `${PLATFORM_SOURCE}Logs`;
    const platform_id = PLATFORM_SOURCE === PlatformSources.AMAZON ? 'amazon_id': 'platform_id';

    const data = await scrapingSchema.query(
        `select distinct message, count(*) from (select  created, message, count(*)  from (
        select distinct al.panelist_id ,al.platform_id ,al.status ,cast(al.created_at as DATE)
        as created, al.message from "${logs}" al left join "${connection}"
        ac on ac.panelist_id = al.panelist_id and ac.${platform_id} = al.platform_id
        where ac.id is null and al.status = 'fail' and al."section" = 'connection' 
        and al.created_at between '${deployedDate} 00:00:00' and '${TO_DATE} 00:00:00' 
        and al.panelist_id in (select uuid from ${platform}_${version}_users)
        order by al.panelist_id) a group by created, message order by message) ods group by message;`
    , {
        type: QueryTypes.SELECT
    });
    return data;
}

const getOrderScrapedData = async (scrapingSchema, platform, version, deployedDate) => {
    const connection = `${PLATFORM_SOURCE}Connection`;
    const orderHistory = PLATFORM_SOURCE === PlatformSources.AMAZON ? 'orderHistory': `${PLATFORM_SOURCE}OrderHistory`;

    const data = await scrapingSchema.query(
        `select a.scrapping_type, count(panelist_id), a.panelist_scraping_count
            from( select CAST(created_at as DATE), panelist_id, count(panelist_id)
            as panelist_scraping_count, scrapping_type from "${orderHistory}" where panelist_id
            in ( select panelist_id from "${connection}" where created_at > '${deployedDate} 00:00:00' 
            and panelist_id in ( select uuid from ${platform}_${version}_users) ) and created_at
            between '${deployedDate} 00:00:00' and '${TO_DATE} 00:00:00' group by 
            CAST(created_at as DATE), scrapping_type, panelist_id order by created_at ) a 
            group by a.panelist_scraping_count, a.scrapping_type order by a.panelist_scraping_count;`
    , {
        type: QueryTypes.SELECT
    });
    return data;
}

const getUnsuccessfulOrderUploadCount = async (scrapingSchema, platform, version, deployedDate) => {
    const connection = `${PLATFORM_SOURCE}Connection`;
    const logs = `${PLATFORM_SOURCE}Logs`;
    const platform_id = PLATFORM_SOURCE === PlatformSources.AMAZON ? 'amazon_id': 'platform_id';
    const orderHistory = PLATFORM_SOURCE === PlatformSources.AMAZON ? 'orderHistory': `${PLATFORM_SOURCE}OrderHistory`;

    const data = await scrapingSchema.query(
        `select  count(*),"scrappingType" from (select distinct al.panelist_id ,al.platform_id ,al.status,
        al.from_date ,al.to_date  ,cast(al.created_at as DATE) as created, oh.id,oh.storage_type,
        "scrappingType" from "${logs}" al left join "${orderHistory}" oh on 
        oh.panelist_id =al.panelist_id and oh.${platform_id} =al.platform_id and oh.from_date =al.from_date and oh.to_date =al.to_date
        where oh.id is null and al.status ='fail' and al."section" ='orderUpload' 
        and al.panelist_id in (select panelist_id from "${connection}" where
        created_at > '${deployedDate} 00:00:00') and al.panelist_id in ( select uuid from ${platform}_${version}_users au )
        and al.created_at between '${deployedDate} 00:00:00' and '${TO_DATE} 00:00:00'
        order by al.panelist_id,from_date ,to_date ) a group by a."scrappingType";`
    , {
        type: QueryTypes.SELECT
    });
    return data;
}

const getUnsuccessfulOrderUploadBreakdown = async (scrapingSchema, platform, version, deployedDate) => {
    const connection = `${PLATFORM_SOURCE}Connection`;
    const logs = `${PLATFORM_SOURCE}Logs`;
    const platform_id = PLATFORM_SOURCE === PlatformSources.AMAZON ? 'amazon_id': 'platform_id';
    const orderHistory = PLATFORM_SOURCE === PlatformSources.AMAZON ? 'orderHistory': `${PLATFORM_SOURCE}OrderHistory`;

    const data = await scrapingSchema.query(
        `select count(*), "scrappingType", message, type from (select distinct al.panelist_id ,al.platform_id,
            al.status,al.from_date ,al.to_date  ,cast(al.created_at as DATE) as created,oh.id,oh.storage_type, "scrappingType" ,
            message,type from "${logs}" al left join "${orderHistory}" oh on oh.panelist_id =al.panelist_id
            and oh.${platform_id} =al.platform_id and oh.from_date =al.from_date and oh.to_date =al.to_date
            where oh.id is null and al.status ='fail' and al."section" ='orderUpload'
            and al.panelist_id in (select panelist_id from "${connection}" where 
            created_at > '${deployedDate} 00:00:00' and panelist_id in ( select uuid from ${platform}_${version}_users iul ) )
            and al.created_at between '${deployedDate} 00:00:00' and '${TO_DATE} 00:00:00'
            order by al.panelist_id,al.from_date ,al.to_date ) a group by a."scrappingType",message,type order by count(*) desc;`
    , {
        type: QueryTypes.SELECT
    });
    return data;
}

const initReportQueries = async (scrapingSchema, versionConfig) => {
    const data = {};
    for (const platform of [IOS, ANDROID]) {
        data[platform] = {};
        const tableVersionName = platform === IOS ? versionConfig.iosTableVersionName : versionConfig.androidTableVersionName;
        const deployedDate = platform === IOS ? versionConfig.iosProdDeployedDate : versionConfig.androidProdDeployedDate;
        const totalUpdatedusers = await getTotalUpdatedUsers(scrapingSchema, platform, tableVersionName);
        data[platform]['totalUpdatedusers'] = totalUpdatedusers;
        const totalConnection = await getTotalConnections(scrapingSchema, platform, tableVersionName, deployedDate);
        data[platform]['totalConnection'] = totalConnection;
        // console.log('Total Connection ', totalConnection);
        const connectionBreakdown = await getConnectionBreakDown(scrapingSchema, platform, tableVersionName, deployedDate);
        data[platform]['connectionBreakdown'] = connectionBreakdown;
        // console.log('Connection Breakdown', connectionBreakdown);
        const unsuccessfulConnection = await getUnsuccessfulConnection(scrapingSchema, platform, tableVersionName, deployedDate);
        data[platform]['unsuccessfulConnection'] = unsuccessfulConnection;
        // console.log('Unsuccessful Connection', unsuccessfulConnection);
        const orderScrapedData = await getOrderScrapedData(scrapingSchema, platform, tableVersionName, deployedDate);
        data[platform]['orderScrapedData'] = orderScrapedData;
        // console.log('orderScrapedData', orderScrapedData);
        const unsuccessfulOrderUploadCount = await getUnsuccessfulOrderUploadCount(scrapingSchema, platform, tableVersionName, deployedDate);
        data[platform]['unsuccessfulOrderUploadCount'] = unsuccessfulOrderUploadCount;
        // console.log('unsuccessfulOrderUploadCount', unsuccessfulOrderUploadCount);
        const unsuccessfulOrderUploadBreakdown = await getUnsuccessfulOrderUploadBreakdown(scrapingSchema, platform, tableVersionName, deployedDate);
        data[platform]['unsuccessfulOrderUploadBreakdown'] = unsuccessfulOrderUploadBreakdown;
        // console.log('unsuccessfulOrderUploadBreakdown', unsuccessfulOrderUploadBreakdown);
    }
    return data;
}

const setUpgradedUsers = async (config, versionConfig) => {
    const [coinoutSchema, scrapingSchema] = initializeSchema(config.db);
    await updateUsers(coinoutSchema, scrapingSchema, versionConfig);
}

const init = async (platformSource, config, versionConfig, toDate) => {
    try {
        setPlatformSource(platformSource);
        setToDate(toDate);
        const [coinoutSchema, scrapingSchema] = initializeSchema(config.db);
        const data = await initReportQueries(scrapingSchema, versionConfig);
        console.log('Success');
        fs.writeFileSync(`data-${platformSource}.json`, JSON.stringify(data));
        return data;
    } catch (e) {
        console.log('Errorrrrr ', e);
    }
}
module.exports = {
    init,
    setUpgradedUsers
}
