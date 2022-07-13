import { Logger } from "@nestjs/common";
import { ConnectionEntityType } from "src/common/entityTypes/connection.entity";
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, AfterInsert, AfterUpdate } from "typeorm";
import { WalmartConnectionHistoryEntity } from "./walmart-connection-history.entity";

@Entity('walmartConnection')
export class WalmartConnectionEntity extends ConnectionEntityType {
    @OneToMany(type => WalmartConnectionHistoryEntity, history => history.walmart_connection)
    history: WalmartConnectionHistoryEntity[]
}
