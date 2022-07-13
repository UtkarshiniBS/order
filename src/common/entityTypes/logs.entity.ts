import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export class LogsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("character varying", { name: "panelist_id", nullable: false  })
  panelistId: string;

  @Column("character varying", { name: "platform_id", nullable: false  })
  platformId: string;

  @Column({ name: 'section', nullable: false })
  section: string;

  @Column({ name: 'type', nullable: true })
  type: string;

  @Column({ name: 'status', nullable: false })
  status: string;

  @Column({ name: 'scrappingType', nullable: true })
  scrappingType: string;

  @Column({ name: 'from_date', nullable: true })
  fromDate: Date;

  @Column({ name: 'to_date', nullable: true })
  toDate: Date;
  
  @Column({ name: 'message', nullable: true })
  message: string;

  @Column({ name: 'scrapingContext', nullable: true })
  scrapingContext: string;

  @Column({ name: 'deviceId', nullable: true })
  deviceId: string;

  @Column({ name: 'devicePlatform', nullable: true })
  devicePlatform: string;

  @Column({ name: 'notifyType', nullable: true })
  notifyType: string;

  @Column({ name: 'url', nullable: true })
  url: string;

  @CreateDateColumn({ update: false})
  createdAt: Date;
      
  @UpdateDateColumn()
  updatedAt: Date;
}
