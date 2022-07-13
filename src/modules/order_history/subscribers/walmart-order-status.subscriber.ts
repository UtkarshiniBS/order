import { ALL_PLATFORMS } from 'src/app.models';
import { CommonModule } from 'src/common/module/common-module';
import { ConfigService } from 'src/common/service/config.service';
import { OrderStatus } from 'src/modules/connection/connection.service';
import { EntitySubscriberInterface, EventSubscriber, UpdateEvent } from 'typeorm';
import { WalmartOrderHistoryEntity } from '../entity/walmartOrderHistory.entity';
import { WalmartOrderRescrapeEntity } from '../entity/walmartOrderRescrape.entity';

@EventSubscriber()
export class WalmartOrderStatusSubscriber implements EntitySubscriberInterface<WalmartOrderHistoryEntity> {

 
    listenTo(): any {
        return WalmartOrderHistoryEntity;
    }
    async afterUpdate(event: UpdateEvent<WalmartOrderHistoryEntity>) {
        const beforeUpdate = event.databaseEntity;
        const afterUpdate = event.entity;
        const configService = new ConfigService();
        if(beforeUpdate && afterUpdate && afterUpdate.status === OrderStatus.COMPLETED) {
            const allConfig: any = await configService.scrapingConfig();// .getScraperConfig(ALL_PLATFORMS.INSTACART);
            let config = allConfig.platformSourceConfig.filter(c => c.platformSource.toLowerCase() === ALL_PLATFORMS.WALMART);
            config = config && config.length ? config[0] : null;
            if(!config) {
                return null;
            }
            const startDate = CommonModule.formatDate(config.start_date);
            if (startDate.toDateString() === afterUpdate.fromDate.toDateString()) {
                // History order, check for rescrape flag
                const orderRescrape = await event.manager.getRepository(WalmartOrderRescrapeEntity).findOne({ where: { panelistId: afterUpdate.panelistId }});
                if(orderRescrape && orderRescrape.isMarkedForRescrape) {
                    // const orderHistory = await event.manager.getRepository(WalmartOrderHistoryEntity).find({ where: { panelistId: afterUpdate.panelistId, platformId: afterUpdate.platformId }});
                    await event.manager.getRepository(WalmartOrderHistoryEntity).delete({ panelistId: afterUpdate.panelistId, platformId: afterUpdate.platformId });
                    orderRescrape.isMarkedForRescrape = false;
                    await event.manager.getRepository(WalmartOrderRescrapeEntity).save(orderRescrape);
                }
            }
        }
    };
}