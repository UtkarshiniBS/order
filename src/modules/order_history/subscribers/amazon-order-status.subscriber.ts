import { ScrappingType } from 'src/common/entityTypes/orderHistoryEntity.type';
import { LogsSectionType, LogsStatusType } from 'src/modules/scraping/dto/eventLogs.dto';
import { AmazonLogsEntity } from 'src/modules/scraping/entity/amazon-logs.entity';
import { EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm';
import { AmazonOrderHistoryEntity } from '../entity/amazonOrderHistory.entity';

@EventSubscriber()
export class AmazonOrderStatusSubscriber implements EntitySubscriberInterface<AmazonLogsEntity> {
 
    listenTo(): any {
        return AmazonLogsEntity;
    }
    async afterInsert(event: InsertEvent<any>) {
        const data = event.entity;
        if(data.message && (data.message.toLowerCase().indexOf('background scrapping completed') > -1 || data.message.toLowerCase().indexOf('background scrapping successful') > -1)) {
            if(data.fromDate && data.toDate && data.section === LogsSectionType.ORDER_UPLOAD && data.status === LogsStatusType.SUCCESS && data.scrappingType === ScrappingType.HTML) {
                const orderHistory: any = await event.manager.getRepository(AmazonOrderHistoryEntity).findOne({
                    where: {
                        fromDate: data.fromDate,
                        toDate: data.toDate,
                        panelistId: data.panelistId,
                        amazonId: data.platformId,
                    }
                });
                if(orderHistory) {
                    orderHistory.status = 'Completed';
                    // await event.manager.getRepository(AmazonOrderHistoryEntity).save(orderHistory);
                }
            }
        }
    };
}