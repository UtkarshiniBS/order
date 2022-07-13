import { LogsEntity } from "src/common/entityTypes/logs.entity";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
@Entity('walmartLogs')
export class WalmartLogsEntity extends LogsEntity{
}
