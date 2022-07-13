import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('piiDetails')
export class PiiDetailsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'attributes', nullable: false })
  attributes: string;

  @Column({ name: 'status', nullable: false })
  status: boolean;

  @Column({ name: 'regex', nullable: true })
  regex: string;

}
