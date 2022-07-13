import { Logger } from "@nestjs/common";
import { ConnectionEntityType } from "src/common/entityTypes/connection.entity";
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, AfterInsert, AfterUpdate } from "typeorm";
import { KrogerConnectionHistoryEntity } from "./kroger-connection-history.entity";

@Entity('krogerConnection')
export class KrogerConnectionEntity extends ConnectionEntityType {
    @OneToMany(type => KrogerConnectionHistoryEntity, history => history.kroger_connection)
    history: KrogerConnectionHistoryEntity[]
}
