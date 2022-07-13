import { OrdersEntityType } from 'src/common/entityTypes/ordersEntity.type';
import { Entity, Column, ManyToOne } from 'typeorm';
import { InstacartOrderHistoryEntity } from './instacartOrderHistory.entity';

@Entity('instacartOrders')
export class InstacartOrdersEntity extends OrdersEntityType {
    @ManyToOne(type => InstacartOrderHistoryEntity, orderHistory => orderHistory.id, { onDelete: 'SET NULL'})
    order_history: InstacartOrderHistoryEntity;
}
