import { OrdersEntityType } from 'src/common/entityTypes/ordersEntity.type';
import { Entity, Column, ManyToOne } from 'typeorm';
import { WalmartOrderHistoryEntity } from './walmartOrderHistory.entity';

@Entity('walmartOrders')
export class WalmartOrdersEntity extends OrdersEntityType {
    @ManyToOne(type => WalmartOrderHistoryEntity, orderHistory => orderHistory.id, { onDelete: 'SET NULL'})
    order_history: WalmartOrderHistoryEntity;
}
