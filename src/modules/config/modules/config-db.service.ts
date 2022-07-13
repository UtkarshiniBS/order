import { Injectable } from "@nestjs/common";
import { InjectConnection, InjectRepository } from "@nestjs/typeorm";
import { endOfDay, endOfWeek, format, startOfDay, startOfWeek, subDays } from "date-fns";
import { exists } from "fs";
import { ALL_PLATFORMS, scrapingContext } from "src/app.models";
import { CommonModule } from "src/common/module/common-module";
import { ConfigService } from "src/common/service/config.service";
import { ConnectionState, OrderStatus } from "src/modules/connection/connection.service";
import { AmazonOrdersEntity } from "src/modules/order_history/entity/amazonOrder.entity";
import { AmazonOrderHistoryEntity } from "src/modules/order_history/entity/amazonOrderHistory.entity";
import { InstacartOrdersEntity } from "src/modules/order_history/entity/instacartOrder.entity";
import { InstacartOrderHistoryEntity } from "src/modules/order_history/entity/instacartOrderHistory.entity";
import { KrogerOrdersEntity } from "src/modules/order_history/entity/krogerOrder.entity";
import { WalmartOrdersEntity } from "src/modules/order_history/entity/walmartOrder.entity";
import { WalmartOrderHistoryEntity } from "src/modules/order_history/entity/walmartOrderHistory.entity";
import { Between, Connection, getRepository, In, MoreThan, MoreThanOrEqual, Repository } from "typeorm";
import { ConfigDto } from "../dto/config.dto";
import { ConfigEntity } from "../entiry/config.entity";

@Injectable()
export class ConfigDbService {

    constructor(
        @InjectRepository(ConfigEntity)
        private configRepository: Repository<ConfigEntity>,
        @InjectRepository(AmazonOrderHistoryEntity)
        private amazonOrderHistoryRepo: Repository<AmazonOrderHistoryEntity>,
        @InjectRepository(InstacartOrderHistoryEntity)
        private instacartOrderHistoryRepo: Repository<InstacartOrderHistoryEntity>,
        @InjectRepository(WalmartOrderHistoryEntity)
        private walmartOrderHistoryRepo: Repository<WalmartOrderHistoryEntity>,
        @InjectRepository(AmazonOrdersEntity)
        private amazonOrder: Repository<AmazonOrdersEntity>,
        @InjectRepository(WalmartOrdersEntity)
        private walmartOrder: Repository<WalmartOrdersEntity>,
        @InjectRepository(InstacartOrdersEntity)
        private instacartOrder: Repository<InstacartOrdersEntity>,
        @InjectConnection() private readonly connection: Connection
    ) {
    }

    get nodeEnv(): string {
        return process.env['NODE_ENV'] || 'development';
    }

    async getDBConfig(): Promise<object> {
        const env = this.nodeEnv;
        const config =  await this.configRepository.findOne({
            where: {
                environment: env
            }
        });
        return config.configurations;
    }

    async setDBConfig(configurations): Promise<object> {
        const env = this.nodeEnv;
        let config = await this.configRepository.findOne({
            where: {
                environment: env
            }
        });
        if(!config) {
            const data: any = { environment: env, configurations: {} };
            config = await this.configRepository.save(data);
        }
        config.configurations = configurations;
        const data = await this.configRepository.save(config);
        return data.configurations;
    }

    async getConnectionStatus(panelistId) {
        const returnData = {};
        for(let platform of Object.values(ALL_PLATFORMS)) {
            if(platform === ALL_PLATFORMS.KROGER) continue;
            returnData[platform] = await this.getPlatformConnectionStatus(panelistId, platform);
        }
        return returnData;
    }

    async checkForAmazonIncentiveScrapingCompletion(panelistId, days) {
        // Phase 1 only check for Amazon order history
        const oneWeek = days;
        const thresholdDays = startOfDay(subDays(new Date(), oneWeek));
        const incentiveOrder = await this.amazonOrderHistoryRepo.findOne({
            where: {
                panelistId: panelistId,
                scrapingSessionContext: scrapingContext.ONLINE,
                scrapingSessionStatus: OrderStatus.COMPLETED,
                scrapingSessionStartedAt: MoreThan(thresholdDays)
            }
        });
        return incentiveOrder;
    }

    async checkForIncentiveScrapingCompletion(panelistId, days, connectedStatus) {
        // Configurable days so that incentive scraping from past week does not overlap
        const oneWeek = days;
        const thresholdDays = startOfDay(subDays(new Date(), oneWeek));
        const condition = {
            panelistId: panelistId,
            scrapingSessionContext: scrapingContext.ONLINE,
            scrapingSessionStatus: OrderStatus.COMPLETED,
            scrapingSessionStartedAt: MoreThan(thresholdDays)
        }
        const incentiveOrderAmazon = await this.amazonOrderHistoryRepo.findOne({ where: condition});
        const incentiveOrderInstacart = await this.instacartOrderHistoryRepo.findOne({ where: condition});
        const incentiveOrderWalmart = await this.walmartOrderHistoryRepo.findOne({ where: condition});
        return { 
            incentiveOrderAmazon: connectedStatus['amazon'] ? incentiveOrderAmazon : null,
            incentiveOrderInstacart: connectedStatus['instacart'] ? incentiveOrderInstacart : null,
            incentiveOrderWalmart: connectedStatus['walmart'] ? incentiveOrderWalmart : null,
        };
    }

    async getLastWeekOrders(panelistId, days, sessionStartTime, connectedStatus) {
        const oneWeek = 7;
        const thresholdDays = startOfDay(subDays(new Date(), oneWeek));
        const returnData = {};
        const condition = {
            panelistId: panelistId,
            orderDate: MoreThan(thresholdDays)
        }
        for(let platform of Object.values(ALL_PLATFORMS)) {
            if(platform === ALL_PLATFORMS.KROGER) continue;
            if(sessionStartTime){
                returnData[platform] = await this.getSessionOrderCount(platform, panelistId, sessionStartTime);
            } else {
                const ordersEntity: any = this.getOrderEntity(platform);
                returnData[platform] = await ordersEntity[1].count({ where: condition});
            }
            returnData[platform] = connectedStatus[platform] ? returnData[platform] : 0;
        }
        return returnData;
    }

    async getSessionOrderCount(entity ,panelistId, sessionStartTime) {
        const ordersTable = `${entity}Orders`;
        const orders = await this.connection.query(`select order_id from "${ordersTable}" ao  where "panelist_id" ='${panelistId}' group by order_id having min(created_at) > '${sessionStartTime}'`);
        return orders.length;
    }

    async getPlatformConnectionStatus(panelistId, platform) {
        const connectionTable = `${platform}Connection`;
        const connection = await this.connection.query(`select panelist_id from "${connectionTable}" where panelist_id = '${panelistId}' and status in ('${ConnectionState.CONNECTED}','${ConnectionState.CONNECTION_IN_PROGRESS}') order by updated_at DESC NULLS LAST;`);
        return connection.length ? true : false;
    }

    getOrderEntity(platform) {
        switch (platform) {
            case ALL_PLATFORMS.INSTACART:
                return [InstacartOrdersEntity, this.instacartOrder];
            case ALL_PLATFORMS.KROGER:
                return [KrogerOrdersEntity, null];
            case ALL_PLATFORMS.WALMART:
                return [WalmartOrdersEntity, this.walmartOrder];
            case ALL_PLATFORMS.AMAZON:
            default:
                return [AmazonOrdersEntity, this.amazonOrder];
        }
    }

    async getIncentizedOrderCount(panelistId, incentiveDays, connectedStatus) {
        const date = new Date()
        const days = this.getWeekDays(date);
        const oneWeek = 7;
        const thresholdDays = startOfDay(subDays(new Date(), oneWeek));
        let filterDays = days.filter(d =>  incentiveDays.includes(d.day));
        filterDays = filterDays.map(f => {
            return {
                panelistId: panelistId,
                scrapingSessionContext: scrapingContext.ONLINE,
                scrapingSessionStatus: OrderStatus.COMPLETED,
                scrapingSessionStartedAt: Between(startOfDay(f.date),endOfDay(f.date))
            }
        });
        const condition: any = {
            select:['id'],
            where: filterDays
        }
        const incentiveOrderAmazon = await this.amazonOrderHistoryRepo.find(condition);
        const incentiveOrderAmazonCount = incentiveOrderAmazon && incentiveOrderAmazon.length ? await this.amazonOrder.count({where: { order_history: In(incentiveOrderAmazon.map(o => o.id)), orderDate: MoreThan(thresholdDays) }}) : 0;
        const incentiveOrderInstacart = await this.instacartOrderHistoryRepo.find(condition);
        const incentiveOrderInstacartCount = incentiveOrderInstacart && incentiveOrderInstacart.length ? await this.instacartOrder.count({where: { order_history: In(incentiveOrderInstacart.map(o => o.id)), orderDate: MoreThan(thresholdDays) }}) : 0;
        const incentiveOrderWalmart = await this.walmartOrderHistoryRepo.find(condition);
        const incentiveOrderWalmartCount = incentiveOrderWalmart && incentiveOrderWalmart.length ? await this.walmartOrder.count({where: { order_history: In(incentiveOrderWalmart.map(o => o.id)), orderDate: MoreThan(thresholdDays) }}) : 0; 
        return { incentiveOrderAmazonCount: connectedStatus['amazon'] ? incentiveOrderAmazonCount : 0,
                 incentiveOrderInstacartCount: connectedStatus['instacart'] ? incentiveOrderInstacartCount : 0,
                 incentiveOrderWalmartCount: connectedStatus['walmart'] ? incentiveOrderWalmartCount : 0,
        };
    }

    getWeekDays(current) {
        let week = new Array();
        let weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        let first = ((current.getDate() - current.getDay()));
        for (var i = 0; i < 7; i++) {
          const d = new Date(current.setDate(first++))
          week.push({ date: d, day: weekdays[d.getDay()], dateString: format(d,'yyyy-MM-dd') });
        }
        return week;
    }

}