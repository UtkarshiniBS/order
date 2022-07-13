import { OrderHistoryEntityType } from "src/common/entityTypes/orderHistoryEntity.type";
import { Entity, OneToMany, Unique } from "typeorm";
import { InstacartOrdersEntity } from "./instacartOrder.entity";

@Entity('instacartOrderHistory')
@Unique("instacart-session", ["panelistId", "platformId", "sessionId"])
export class InstacartOrderHistoryEntity extends OrderHistoryEntityType {
    @OneToMany(type => InstacartOrdersEntity, orders => orders.order_history)
    orders: InstacartOrdersEntity[]
}