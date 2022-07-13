import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Connection, createConnection } from "typeorm";
import * as dotenv from 'dotenv';

describe('AuthService', () => {
  let connection: Connection;
  beforeEach(async () => {
    dotenv.config({
      path: `.env`,
    });
  });

  describe('when check db connection', () => {
    it('should return a true', async () => {
      connection = await createConnection({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        name: 'default',
        logging: false,
      });
      if (!connection.isConnected) {
        throw new HttpException({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: connection,
          data: null,
          isError: true
        }, HttpStatus.INTERNAL_SERVER_ERROR);
      }
      expect(connection.isConnected).toBe(true)
      if (!connection.isConnected) {
        Logger.log('Database not connected!');
      }
    })
  });

  afterAll(done => {
    connection.close();
    done();
});


});
