import { OrdersEntityType } from 'src/common/entityTypes/ordersEntity.type';
import { Entity, Column, ManyToOne } from 'typeorm';
import { KrogerOrderHistoryEntity } from './krogerOrderHistory.entity';

@Entity('krogerOrders')
export class KrogerOrdersEntity extends OrdersEntityType {
    @ManyToOne(type => KrogerOrderHistoryEntity, orderHistory => orderHistory.id)
    order_history: KrogerOrderHistoryEntity;
}
