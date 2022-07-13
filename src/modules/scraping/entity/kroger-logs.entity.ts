import { LogsEntity } from "src/common/entityTypes/logs.entity";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
@Entity('krogerLogs')
export class KrogerLogsEntity extends LogsEntity{
}
