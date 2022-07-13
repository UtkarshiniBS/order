import { Logger } from '@nestjs/common';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { ALLOWED_PLATFORMS, ALL_PLATFORMS, ENTITY } from 'src/app.models';
import { ConfigEntity } from 'src/modules/config/entiry/config.entity';
import { AmazonConnectionHistoryEntity } from 'src/modules/connection/entity/amazon-connection-history.entity';
import { AmazonConnectionEntity } from 'src/modules/connection/entity/amazon-connection.entity';
import { InstacartConnectionHistoryEntity } from 'src/modules/connection/entity/instacart-connection-history.entity';
import { InstacartConnectionEntity } from 'src/modules/connection/entity/instacart-connection.entity';
import { KrogerConnectionHistoryEntity } from 'src/modules/connection/entity/kroger-connection-history.entity';
import { KrogerConnectionEntity } from 'src/modules/connection/entity/kroger-connection.entity';
import { WalmartConnectionHistoryEntity } from 'src/modules/connection/entity/walmart-connection-history.entity';
import { WalmartConnectionEntity } from 'src/modules/connection/entity/walmart-connection.entity';
import { AmazonOrdersEntity } from 'src/modules/order_history/entity/amazonOrder.entity';
import { AmazonOrderHistoryEntity } from 'src/modules/order_history/entity/amazonOrderHistory.entity';
import { InstacartOrdersEntity } from 'src/modules/order_history/entity/instacartOrder.entity';
import { InstacartOrderHistoryEntity } from 'src/modules/order_history/entity/instacartOrderHistory.entity';
import { KrogerOrdersEntity } from 'src/modules/order_history/entity/krogerOrder.entity';
import { KrogerOrderHistoryEntity } from 'src/modules/order_history/entity/krogerOrderHistory.entity';
import { WalmartOrdersEntity } from 'src/modules/order_history/entity/walmartOrder.entity';
import { WalmartOrderHistoryEntity } from 'src/modules/order_history/entity/walmartOrderHistory.entity';
import { AmazonLogsEntity } from 'src/modules/scraping/entity/amazon-logs.entity';
import { InstacartLogsEntity } from 'src/modules/scraping/entity/instacart-logs.entity';
import { KrogerLogsEntity } from 'src/modules/scraping/entity/kroger-logs.entity';
import { WalmartLogsEntity } from 'src/modules/scraping/entity/walmart-logs.entity';
import { getConnection, getManager, getRepository } from 'typeorm';
import { SnakeNamingStrategy } from '../strategy/snake-naming.strategy';
const fs = require('fs');
const path = require('path');
const shell = require('shelljs');

export class ConfigService {

    defaultPath = 'uploads';

    constructor(
    ) {
        const nodeEnv = this.nodeEnv;
        dotenv.config({
            path: `.env`,
        });

        // Replace \\n with \n to support multiline strings in AWS
        for (const envName of Object.keys(process.env)) {
            process.env[envName] = process.env[envName].replace(/\\n/g, '\n');
        }
        this.createStoragePath();
    }

    get isDevelopment(): boolean {
        return this.nodeEnv === 'development';
    }

    get isProduction(): boolean {
        return this.nodeEnv === 'production';
    }

    public get(key: string): string {
        return process.env[key];
    }

    public getBoolean(key: string): boolean {
        return process.env[key] === 'NO' ? false : true;
    }

    public getNumber(key: string): number {
        return Number(this.get(key));
    }

    get nodeEnv(): string {
        return this.get('NODE_ENV') || 'development';
    }

    get typeOrmConfig(): TypeOrmModuleOptions {
        let entities = [__dirname + '/../../modules/**/**/*.entity{.ts,.js}'];
        let subscribers = [__dirname + '/../../modules/**/**/*.subscriber{.ts,.js}'];
        let migrations = [__dirname + '/../../common/migrations/*{.ts,.js}'];
        if ((<any>module).hot) {
            const entityContext = (<any>require).context(
                './../../modules',
                true,
                /\.ts$/,
            );
            entities = entityContext.keys().map((id) => {
                const entityModule = entityContext(id);
                const [entity] = Object.values(entityModule);
                return entity;
            });
            const subscriberContext = (<any>require).context(
                './../../modules',
                true,
                /\.ts$/,
            );
            subscribers = subscriberContext.keys().map((id) => {
                const subscriberModule = entityContext(id);
                const [subscriber] = Object.values(subscriberModule);
                return subscriber;
            });
            const migrationContext = (<any>require).context(
                './../../common/migrations',
                false,
                /\.ts$/,
            );
            migrations = migrationContext.keys().map((id) => {
                const migrationModule = migrationContext(id);
                const [migration] = Object.values(migrationModule);
                return migration;
            });
        }
        return {
            entities,
            subscribers,
            migrations,
            keepConnectionAlive: true,
            type: 'postgres',
            host: this.get('DB_HOST'),
            port: this.getNumber('DB_PORT'),
            username: this.get('DB_USERNAME'),
            password: this.get('DB_PASSWORD'),
            database: this.get('DB_DATABASE'),
            uuidExtension: 'pgcrypto',
            name: 'default',
            migrationsRun: this.getBoolean('RUN_MIGRATIONS'),
            logging: ['development','local'].includes(this.nodeEnv),
            namingStrategy: new SnakeNamingStrategy(),
            synchronize: this.getNumber('AUTO_SYNC_DB') ? true : false,
            extra: {
                max: 13
            }
        };
    }

    get awsS3Config() {
        return {
            accessKeyId: this.get('AWS_S3_ACCESS_KEY_ID'),
            secretAccessKey: this.get('AWS_S3_SECRET_ACCESS_KEY'),
            bucketName: this.get('S3_BUCKET_NAME'),
        };
    }

    private createStoragePath() {
        const storagePath = this.get('FILE_STORAGE_PATH') != '' && this.get('FILE_STORAGE_PATH') != undefined ? this.get('FILE_STORAGE_PATH') : null;
        if (storagePath != null && !fs.existsSync(storagePath)) {
            try {
                fs.mkdirSync(storagePath, { recursive: true });
            } catch (error) {
                Logger.log(error.message);
            }
            if (!fs.existsSync(storagePath)) {
                if (!fs.existsSync(this.defaultPath)) {
                    try {
                        fs.mkdirSync(this.defaultPath, { recursive: true });
                    } catch (error) {
                        Logger.log(error.message);
                    }
                }
                Logger.log('Default Storage Path: ' + this.defaultPath);
            }
            Logger.log('Storage Path: ' + storagePath);
        } else {
            Logger.log('Storage Path: ' + storagePath);
        }
    }

    public get getStoragePath() {
        const storagePath = this.get('FILE_STORAGE_PATH') != '' && this.get('FILE_STORAGE_PATH') != undefined ? this.get('FILE_STORAGE_PATH') : null;
        if (storagePath != null && fs.existsSync(storagePath)) {
            return storagePath;
        } else {
            return this.defaultPath;
        }
    }

    public getRepository(entityType: any, reqParams: any) {
        const platform = reqParams.platformSource ? reqParams.platformSource.toLowerCase() : ALLOWED_PLATFORMS.AMAZON;
        switch (entityType) {
            case ENTITY.ORDER_HISTORY:
                switch (platform) {
                    case ALL_PLATFORMS.INSTACART:
                        return InstacartOrderHistoryEntity;
                    case ALL_PLATFORMS.KROGER:
                        return KrogerOrderHistoryEntity;
                    case ALL_PLATFORMS.WALMART:
                        return WalmartOrderHistoryEntity;
                    case ALL_PLATFORMS.AMAZON:
                    default:
                        return AmazonOrderHistoryEntity;
                }
            case ENTITY.CONNECTION_HISTORY:
                switch (platform) {
                    case ALL_PLATFORMS.INSTACART:
                        return InstacartConnectionHistoryEntity;
                    case ALL_PLATFORMS.KROGER:
                        return KrogerConnectionHistoryEntity;
                    case ALL_PLATFORMS.WALMART:
                        return WalmartConnectionHistoryEntity;
                    case ALL_PLATFORMS.AMAZON:
                    default:
                        return AmazonConnectionHistoryEntity;
                }
            case ENTITY.CONNECTION:
                switch (platform) {
                    case ALL_PLATFORMS.INSTACART:
                        return InstacartConnectionEntity;
                    case ALL_PLATFORMS.KROGER:
                        return KrogerConnectionEntity;
                    case ALL_PLATFORMS.WALMART:
                        return WalmartConnectionEntity;
                    case ALL_PLATFORMS.AMAZON:
                    default:
                        return AmazonConnectionEntity;
                }
            case ENTITY.EVENT_LOG:
                switch (platform) {
                    case ALL_PLATFORMS.INSTACART:
                        return InstacartLogsEntity;
                    case ALL_PLATFORMS.KROGER:
                        return KrogerLogsEntity;
                    case ALL_PLATFORMS.WALMART:
                        return WalmartLogsEntity;
                    case ALL_PLATFORMS.AMAZON:
                    default:
                        return AmazonLogsEntity;
                }
            case ENTITY.ORDERS:
                switch (platform) {
                    case ALL_PLATFORMS.INSTACART:
                        return InstacartOrdersEntity;
                    case ALL_PLATFORMS.KROGER:
                        return KrogerOrdersEntity;
                    case ALL_PLATFORMS.WALMART:
                        return WalmartOrdersEntity;
                    case ALL_PLATFORMS.AMAZON:
                    default:
                        return AmazonOrdersEntity;
                }
            default:
                return null;
        }
    }
    
    async scrapingConfig() {
        const entityManager = getManager();
        const config =  await entityManager.getRepository(ConfigEntity).findOne({
            where: {
                environment: this.nodeEnv
            }
        });
        return config.configurations;
    }
}
