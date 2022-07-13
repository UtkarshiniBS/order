import { PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Entity } from "typeorm";

export enum Environment {
    LOCAL = "local",
    QA = "qa",
    DEV = "development",
    STAGING = "staging",
    UAT = "uat",
    PROD = "production",
    HOTFIX = "hotfix",
  }

@Entity('scrapingConfiguration')
export class ConfigEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'environment', type: "enum", enum: Environment, nullable: false})
    environment: Environment;

    @Column({ name: 'configurations', type: "jsonb", nullable: false})
    configurations!: object;

    @CreateDateColumn()
    createdAt: Date;
        
    @UpdateDateColumn()
    updatedAt: Date;

}
