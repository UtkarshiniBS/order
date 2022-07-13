import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('walmartOrderRescrape')
export class WalmartOrderRescrapeEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column("character varying", { name: "panelist_id", nullable: false  })
  panelistId!: string;

  @Column({ name: 'isMarkedForRescrape', nullable: false, default: true })
  isMarkedForRescrape : boolean;

}
