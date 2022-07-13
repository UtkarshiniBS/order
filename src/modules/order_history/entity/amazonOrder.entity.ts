import { ScrappingType } from 'src/common/entityTypes/orderHistoryEntity.type';
import { OrdersEntityType } from 'src/common/entityTypes/ordersEntity.type';
import { Entity, Column, ManyToOne } from 'typeorm';
import { AmazonOrderHistoryEntity } from './amazonOrderHistory.entity';

@Entity('amazonOrders')
export class AmazonOrdersEntity extends OrdersEntityType {
    @ManyToOne(type => AmazonOrderHistoryEntity, orderHistory => orderHistory.id)
    order_history: AmazonOrderHistoryEntity;

    @Column({ name: 'file_path', nullable: true })
    filePath: string;

    @Column({ name: 'scrapping_type', type: "enum", enum: ScrappingType, nullable: false, default: ScrappingType.REPORT})
    scrappingType: ScrappingType;
  
}
