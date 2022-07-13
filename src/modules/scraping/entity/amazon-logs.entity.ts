import { LogsEntity } from "src/common/entityTypes/logs.entity";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
@Entity('amazonLogs')
export class AmazonLogsEntity extends LogsEntity{
}
