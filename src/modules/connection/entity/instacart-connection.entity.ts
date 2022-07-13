import { Logger } from "@nestjs/common";
import { ConnectionEntityType } from "src/common/entityTypes/connection.entity";
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, AfterInsert, AfterUpdate } from "typeorm";
import { InstacartConnectionHistoryEntity } from "./instacart-connection-history.entity";

@Entity('instacartConnection')
export class InstacartConnectionEntity extends ConnectionEntityType {
    @OneToMany(type => InstacartConnectionHistoryEntity, history => history.instacart_connection)
    history: InstacartConnectionHistoryEntity[]
}
