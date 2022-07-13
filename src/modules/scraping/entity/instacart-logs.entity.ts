import { LogsEntity } from "src/common/entityTypes/logs.entity";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
@Entity('instacartLogs')
export class InstacartLogsEntity extends LogsEntity{
}
