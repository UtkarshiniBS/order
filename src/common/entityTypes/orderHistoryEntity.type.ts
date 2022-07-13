import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";

export enum StorageType {
  FILE_SYSTEM = "fileSystem",
  AWS = "aws",
  AZURE = "azure"
}

export enum ScrappingType {
  REPORT = "report",
  HTML = "html",
}

// @Unique("date-range", ["panelistId", "platformId", "sessionId"])
export class OrderHistoryEntityType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'file_path', nullable: true })
  filePath: string;

  @Column({ name: 'file_name', nullable: true })
  fileName: string;

  @Column({ name: 'storage_type', type: "enum", enum: StorageType, default: StorageType.FILE_SYSTEM })
  storageType: StorageType;

  @Column({ name: 'from_date', nullable: false })
  fromDate: Date;

  @Column({ name: 'to_date', nullable: false })
  toDate: Date;

  @Column("character varying", { name: "panelist_id", nullable: false  })
  panelistId: string;

  @Column("character varying", { name: "platform_id", nullable: true  })
  platformId: string;

  @Column({ name: 'order_count', nullable: true})
  orderCount: number;

  @Column({ name: 'product_count', nullable: true })
  productCount: number;

  @Column("character varying", { name: 'last_order_id', nullable: true })
  lastOrderId: string;
  
  @CreateDateColumn({ update: false})
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ name: 'scrapping_type', type: "enum", enum: ScrappingType, nullable: false, default: ScrappingType.REPORT})
  scrappingType: ScrappingType;

  @Column({ name: 'order_data', type: "jsonb", nullable: true})
  orderData?: object[];
  
  @Column({ name: 'status', nullable: true })
  status: string;

  @Column({ name: 'listing_order_count', nullable: true, comment:'Value in Milliseconds'})
  listingOrderCount: number;

  @Column({ name: 'listing_scrape_time', nullable: true, comment:'Value in Milliseconds'})
  listingScrapeTime: number;

  @Column({ name: 'scraping_session_context', nullable: true })
  scrapingSessionContext: string;

  @Column({ name: 'scraping_session_status', nullable: true })
  scrapingSessionStatus: string;

  @Column({ name: 'scraping_session_started_at', nullable: true })
  scrapingSessionStartedAt: Date;

  @Column({ name: 'scraping_session_ended_at', nullable: true })
  scrapingSessionEndedAt: Date;

  @Column({name: 'session_id', nullable: true })
  sessionId: string;
}
