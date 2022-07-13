import { OrderHistoryEntityType } from "src/common/entityTypes/orderHistoryEntity.type";
import { Entity, OneToMany, Unique } from "typeorm";
import { WalmartOrdersEntity } from "./walmartOrder.entity";

@Entity('walmartOrderHistory')
@Unique("walmart-session", ["panelistId", "platformId", "sessionId"])
export class WalmartOrderHistoryEntity extends OrderHistoryEntityType {
    @OneToMany(type => WalmartOrdersEntity, orders => orders.order_history)
    orders: WalmartOrdersEntity[]
}