import { EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm';
import { AmazonConnectionEntity } from '../entity/amazon-connection.entity';
import { AmazonConnectionHistoryEntity } from '../entity/amazon-connection-history.entity';
import { InstacartConnectionEntity } from '../entity/instacart-connection.entity';
import { InstacartConnectionHistoryEntity } from '../entity/instacart-connection-history.entity';

@EventSubscriber()
export class InstacartConnectionSubscriber implements EntitySubscriberInterface<InstacartConnectionEntity> {
 
    listenTo(): any {
        return InstacartConnectionEntity;
    }
    async afterInsert(event: InsertEvent<any>) {
        const data = event.entity;
        data.instacart_connection = data.id;
        delete data.id;
        await event.manager.getRepository(InstacartConnectionHistoryEntity).save(data);
    };

    async afterUpdate(event: UpdateEvent<any>) {
        const beforeUpdate = event.databaseEntity;
        const afterUpdate = event.entity;
        if(beforeUpdate && afterUpdate) {
            if(beforeUpdate.status != afterUpdate.status || beforeUpdate.orderStatus != afterUpdate.orderStatus || beforeUpdate.message != afterUpdate.message){
                afterUpdate.instacart_connection = afterUpdate.id;
                delete afterUpdate.id;
                await event.manager.getRepository(InstacartConnectionHistoryEntity).save(afterUpdate);
            }
        }
    }
}