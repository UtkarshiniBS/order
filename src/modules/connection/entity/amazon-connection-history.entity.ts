import { ConnectionHistoryEntityType } from "src/common/entityTypes/connection-history.entity";
import { Column, Entity, ManyToOne } from "typeorm";
import { AmazonConnectionEntity } from "./amazon-connection.entity";

@Entity('amazonConnectionHistory')
export class AmazonConnectionHistoryEntity extends ConnectionHistoryEntityType {
    @Column("character varying", { name: "amazon_id", nullable: false  })
    amazonId: string;

    @ManyToOne(type => AmazonConnectionEntity, connection => connection.id)
    amazon_connection: AmazonConnectionEntity;
}
