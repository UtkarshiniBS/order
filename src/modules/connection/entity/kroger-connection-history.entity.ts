import { ConnectionHistoryEntityType } from "src/common/entityTypes/connection-history.entity";
import { Column, Entity, ManyToOne } from "typeorm";
import { InstacartConnectionEntity } from "./instacart-connection.entity";
import { KrogerConnectionEntity } from "./kroger-connection.entity";

@Entity('krogerConnectionHistory')
export class KrogerConnectionHistoryEntity extends ConnectionHistoryEntityType {
    @ManyToOne(type => KrogerConnectionEntity, connection => connection.id)
    kroger_connection: KrogerConnectionEntity;
}
