import { ConnectionHistoryEntityType } from "src/common/entityTypes/connection-history.entity";
import { Column, Entity, ManyToOne } from "typeorm";
import { InstacartConnectionEntity } from "./instacart-connection.entity";

@Entity('instacartConnectionHistory')
export class InstacartConnectionHistoryEntity extends ConnectionHistoryEntityType {
    @ManyToOne(type => InstacartConnectionEntity, connection => connection.id)
    instacart_connection: InstacartConnectionEntity;
}
