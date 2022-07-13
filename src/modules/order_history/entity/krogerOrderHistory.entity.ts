import { OrderHistoryEntityType } from "src/common/entityTypes/orderHistoryEntity.type";
import { Entity, OneToMany } from "typeorm";
import { KrogerOrdersEntity } from "./krogerOrder.entity";

@Entity('krogerOrderHistory')
export class KrogerOrderHistoryEntity extends OrderHistoryEntityType {
    @OneToMany(type => KrogerOrdersEntity, orders => orders.order_history)
    orders: KrogerOrdersEntity[]
}