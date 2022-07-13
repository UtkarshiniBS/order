import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export class OrdersEntityType {
  @PrimaryGeneratedColumn({ type: 'bigint'})
  id: string;

  @Column("character varying", { name: "panelist_id", nullable: false  })
  panelistId!: string;

  @Column("character varying", { name: "platform_id", nullable: false  })
  platformId!: string;

  @Column({ name: 'order_page_load_time', nullable: true, comment:'Value in Milliseconds'})
  orderPageLoadTime: number;

  @Column({ name: 'order_scrape_time', nullable: true, comment:'Value in Milliseconds'})
  orderScrapeTime: number;

  @Column({ name: 'order_id', nullable: true })
  orderId: string;

  @Column({ name: 'order_date', nullable: true })
  orderDate: Date;

  @Column({ name: 'order_data', type: "jsonb", nullable: true})
  orderData: object;

  @Column({ name: 'scraping_context', nullable: true })
  scrapingContext: string;

  @CreateDateColumn({ update: false})
  createdAt: Date;

}
