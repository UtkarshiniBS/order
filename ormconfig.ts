import * as dotenv from 'dotenv';

import { SnakeNamingStrategy } from './src/common/strategy/snake-naming.strategy';

if (!(<any>module).hot /* for webpack HMR */) {
    process.env.NODE_ENV = process.env.NODE_ENV || 'development';
}

dotenv.config({
    path: `.env`,
});

// Replace \\n with \n to support multiline strings in AWS
for (const envName of Object.keys(process.env)) {
    process.env[envName] = process.env[envName].replace(/\\n/g, '\n');
}

module.exports = {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: +process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    name: 'default',
    namingStrategy: new SnakeNamingStrategy(),
    entities: ['src/modules/**/*{.ts,.js}'],
    subscribers: ['src/modules/**/*.subscriber.ts'],
    migrations: ['src/common/migrations/*{.ts,.js}'],
    seeds: ['src/modules/**/*{.seed.ts,.seed.js}'],
    synchronize: parseInt(process.env.AUTO_SYNC_DB) ? true : false
};
