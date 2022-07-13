import { Logger } from "@nestjs/common";
import { ConnectionEntityType } from "src/common/entityTypes/connection.entity";
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, AfterInsert, AfterUpdate } from "typeorm";
import { AmazonConnectionHistoryEntity } from "./amazon-connection-history.entity";

@Entity('amazonConnection')
export class AmazonConnectionEntity extends ConnectionEntityType {
    @Column("character varying", { name: "amazon_id", nullable: false })
    amazonId: string;

    @OneToMany(type => AmazonConnectionHistoryEntity, history => history.amazon_connection)
    history: AmazonConnectionHistoryEntity[]
}
