import { PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";


export class ConnectionHistoryEntityType {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("character varying", { name: "panelist_id", nullable: false  })
    panelistId: string;
  
    @Column("character varying", { name: "platform_id", nullable: false, default:'' })
    platformId!: string;

    @Column({ name: 'status', nullable: false })
    status: string;

    @Column({ name: 'order_status', nullable: false })
    orderStatus: string;

    @Column({ name: 'message', nullable: true })
    message: string;

    @Column({ name: 'firstaccount', nullable: false, default: false })
    firstaccount: boolean;

    @Column({ name: 'last_connected_at', nullable: true })
    lastConnectedAt: Date;
  
    @CreateDateColumn()
    createdAt: Date;
        
    @UpdateDateColumn()
    updatedAt: Date;
}
