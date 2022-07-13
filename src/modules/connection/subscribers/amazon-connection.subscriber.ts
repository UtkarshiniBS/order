import { EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm';
import { AmazonConnectionEntity } from '../entity/amazon-connection.entity';
import { AmazonConnectionHistoryEntity } from '../entity/amazon-connection-history.entity';

@EventSubscriber()
export class AmazonConnectionSubscriber implements EntitySubscriberInterface<AmazonConnectionEntity> {
 
    listenTo(): any {
        return AmazonConnectionEntity;
    }
    async afterInsert(event: InsertEvent<any>) {
        const data = event.entity;
        data.amazon_connection = data.id;
        delete data.id;
        await event.manager.getRepository(AmazonConnectionHistoryEntity).save(data);
    };

    async afterUpdate(event: UpdateEvent<any>) {
        const beforeUpdate = event.databaseEntity;
        const afterUpdate = event.entity;
        if(beforeUpdate && afterUpdate) {
            if(beforeUpdate.status != afterUpdate.status || beforeUpdate.orderStatus != afterUpdate.orderStatus || beforeUpdate.message != afterUpdate.message){
                afterUpdate.amazon_connection = afterUpdate.id;
                delete afterUpdate.id;
                await event.manager.getRepository(AmazonConnectionHistoryEntity).save(afterUpdate);
            }
        }
    }
}