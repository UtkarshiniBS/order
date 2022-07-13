import { EntitySubscriberInterface, EventSubscriber, InsertEvent, UpdateEvent } from 'typeorm';
import { AmazonConnectionEntity } from '../entity/amazon-connection.entity';
import { AmazonConnectionHistoryEntity } from '../entity/amazon-connection-history.entity';
import { KrogerConnectionEntity } from '../entity/kroger-connection.entity';
import { KrogerConnectionHistoryEntity } from '../entity/kroger-connection-history.entity';

@EventSubscriber()
export class KrogerConnectionSubscriber implements EntitySubscriberInterface<KrogerConnectionEntity> {
 
    listenTo(): any {
        return KrogerConnectionEntity;
    }
    async afterInsert(event: InsertEvent<any>) {
        const data = event.entity;
        data.kroger_connection = data.id;
        delete data.id;
        await event.manager.getRepository(KrogerConnectionHistoryEntity).save(data);
    };

    async afterUpdate(event: UpdateEvent<any>) {
        const beforeUpdate = event.databaseEntity;
        const afterUpdate = event.entity;
        if(beforeUpdate && afterUpdate) {
            if(beforeUpdate.status != afterUpdate.status || beforeUpdate.orderStatus != afterUpdate.orderStatus || beforeUpdate.message != afterUpdate.message){
                afterUpdate.kroger_connection = afterUpdate.id;
                delete afterUpdate.id;
                await event.manager.getRepository(KrogerConnectionHistoryEntity).save(afterUpdate);
            }
        }
    }
}