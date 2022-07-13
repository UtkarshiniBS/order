import { EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm';
import { AmazonConnectionEntity } from '../entity/amazon-connection.entity';
import { AmazonConnectionHistoryEntity } from '../entity/amazon-connection-history.entity';
import { WalmartConnectionEntity } from '../entity/walmart-connection.entity';
import { WalmartConnectionHistoryEntity } from '../entity/walmart-connection-history.entity';

@EventSubscriber()
export class WalmartConnectionSubscriber implements EntitySubscriberInterface<WalmartConnectionEntity> {
 
    listenTo(): any {
        return WalmartConnectionEntity;
    }
    async afterInsert(event: InsertEvent<any>) {
        const data = event.entity;
        data.walmart_connection = data.id;
        delete data.id;
        await event.manager.getRepository(WalmartConnectionHistoryEntity).save(data);
    };

    async afterUpdate(event: UpdateEvent<any>) {
        const beforeUpdate = event.databaseEntity;
        const afterUpdate = event.entity;
        if(beforeUpdate && afterUpdate) {
            if(beforeUpdate.status != afterUpdate.status || beforeUpdate.orderStatus != afterUpdate.orderStatus || beforeUpdate.message != afterUpdate.message){
                afterUpdate.walmart_connection = afterUpdate.id;
                delete afterUpdate.id;
                await event.manager.getRepository(WalmartConnectionHistoryEntity).save(afterUpdate);
            }
        }
    }
}