import { OrderHistoryEntityType } from 'src/common/entityTypes/orderHistoryEntity.type';
import { Entity, Column, OneToMany, Unique } from 'typeorm';
import { AmazonOrdersEntity } from './amazonOrder.entity';

@Entity('orderHistory')
@Unique("amazon-session", ["panelistId", "platformId", "sessionId"])
export class AmazonOrderHistoryEntity extends OrderHistoryEntityType {
  @Column('character varying', { name: 'amazon_id', nullable: false })
  amazonId: string;

  @OneToMany(type => AmazonOrdersEntity, orders => orders.order_history)
  orders: AmazonOrdersEntity[]
}
