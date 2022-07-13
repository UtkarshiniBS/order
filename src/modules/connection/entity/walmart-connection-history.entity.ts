import { ConnectionHistoryEntityType } from "src/common/entityTypes/connection-history.entity";
import { Column, Entity, ManyToOne } from "typeorm";
import { InstacartConnectionEntity } from "./instacart-connection.entity";
import { WalmartConnectionEntity } from "./walmart-connection.entity";

@Entity('walmartConnectionHistory')
export class WalmartConnectionHistoryEntity extends ConnectionHistoryEntityType {
    @ManyToOne(type => WalmartConnectionEntity, connection => connection.id)
    walmart_connection: WalmartConnectionEntity;
}
