import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import path = require('path');
const fs = require('fs');
const streamifier = require('streamifier');
const csv = require('csv-parse');

import { PiiDetailsDto } from '../dto/piiDetails.dto';
import { IsNull, Not, Repository } from 'typeorm';
import { PiiDetailsEntity } from '../entity/piiDetails.entity';
import { getConnection } from "typeorm";
import { ConfigService } from 'src/common/service/config.service';
import { AmazonOrderHistoryEntity } from 'src/modules/order_history/entity/amazonOrderHistory.entity';
import { AmazonConnectionHistoryEntity } from 'src/modules/connection/entity/amazon-connection-history.entity';
import { AmazonConnectionEntity } from 'src/modules/connection/entity/amazon-connection.entity';

@Injectable()
export class PiiDetailsService {

  PII_ATTRIBUTES = [
    "PO Line Number",
    "Ordering Customer Email",
    "Shipment Date",
    "Shipping Address Name",
    "Shipping Address Street 1",
    "Shipping Address Street 2",
    "Shipping Address City",
    "Shipping Address State",
    "Shipping Address Zip",
    "Carrier Name & Tracking Number",
    "Buyer Name",
    "Group Name",
    "Payment Instrument Type",
    "Purchase Order Number",
  ];

  constructor(
    @InjectRepository(PiiDetailsEntity)
    private piiDetailsRepository: Repository<PiiDetailsEntity>,
    @InjectRepository(AmazonOrderHistoryEntity)
    private orderHistoryRepository: Repository<AmazonOrderHistoryEntity>,
    @InjectRepository(AmazonConnectionHistoryEntity)
    private connectionHistoryRepository: Repository<AmazonConnectionHistoryEntity>,
    @InjectRepository(AmazonConnectionEntity)
    private connectionRepository: Repository<AmazonConnectionEntity>,
    private configService: ConfigService
  ) { }

  async create(createOrderHistoryDto: any): Promise<PiiDetailsDto> {
    return await this.piiDetailsRepository.save(createOrderHistoryDto);
  }

  async findAll(): Promise<PiiDetailsDto[]> {
    return await this.piiDetailsRepository.find();
  }

  async findOne(): Promise<any> {
    return await this.piiDetailsRepository.find();
  }

  async findActiveDeactive(status: Boolean): Promise<any> {
    return await this.piiDetailsRepository.find({ where: { status } });
  }


  async seedAttributes(): Promise<any> {
    const count = await this.piiDetailsRepository.count();
    if (!count) {
      const values = this.PII_ATTRIBUTES.map(attribute => {
        return { attributes: attribute, status: false, regex: "" }
      });
      const res = await getConnection().createQueryBuilder().insert().into(PiiDetailsEntity).values(values).execute();
      if (res) {
        return values;
      }
    }
    await this.updatePlatformId();
    this.updateLastOrderId();
    return null;
  }

  async updateLastOrderId(): Promise<any> {
    const orderHistory = await this.orderHistoryRepository.find({
      where: { fileName: Not(IsNull()), lastOrderId: IsNull() },
    });
    for (let index = 0; index < orderHistory.length; index++) {
      const row = orderHistory[index];
      const orderData = await this.getCsvData(row.fileName);
      if(orderData.lastOrderId) {
        await this.orderHistoryRepository.update(row.id, { lastOrderId: orderData.lastOrderId});
      }
    }
    return orderHistory;
  }

  async updatePlatformId(): Promise<any> {
    const orderHistory = await this.orderHistoryRepository.find({
      where: [{ platformId: '' },{ platformId: null }],
    });
    for (let index = 0; index < orderHistory.length; index++) {
      const row = orderHistory[index];
      await this.orderHistoryRepository.update(row.id, { platformId: row.amazonId});
    }
    const connection = await this.connectionRepository.find({
      where: [{ platformId: '' },{ platformId: null }],
    });
    for (let index = 0; index < connection.length; index++) {
      const row = connection[index];
      await this.connectionRepository.update(row.id, { platformId: row.amazonId});
    }
    const connectionHistory = await this.connectionHistoryRepository.find({
      where: [{ platformId: '' },{ platformId: null }],
    });
    for (let index = 0; index < connectionHistory.length; index++) {
      const row = connectionHistory[index];
      await this.connectionHistoryRepository.update(row.id, { platformId: row.amazonId});
    }
    return null;
  }

  async getCsvData(fileName): Promise<any> {
    return new Promise((resolve, reject) => {
      const uploadDirectory = this.configService.getStoragePath;
      const filePath = path.join(uploadDirectory, fileName);
      const fileReader = fs.createReadStream(filePath);
      fileReader.on('error', function(err) {
        Logger.error(err);
        return resolve({ lastOrderId: null });
      });
      fileReader.pipe(csv({ delimiter: ',', quote: '"', skip_empty_lines: true, trim: true }, async (e: any, rows: any[]) => {
        if (e) {
          Logger.error(e.message);
          return null;  
        }
        let records = [];
        let orderIds = [];
        let lastOrderId;
        if (rows.length > 0) {
          const header = rows.length > 0 ? rows[0] : [];
          const orderIdIndex = header.length > 0 ? header.findIndex(c => c.trim() == 'Order ID') : null;
          if (orderIdIndex == null || orderIdIndex < 0) {
            Logger.error('Order Index not found');
            return resolve({ lastOrderId: null });
          }
          records = rows.filter(l => !!l).slice(1);
          orderIds = records.map((record) => record[orderIdIndex])
          lastOrderId = orderIds.length ? orderIds[orderIds.length - 1] : null;
        }
        return resolve({ orderIds: orderIds, lastOrderId: lastOrderId });
      }));
    });
  }

  async updatePii(attributes: String, status: boolean) {
    const piidetail = await this.piiDetailsRepository.findOneOrFail({ where: { attributes, status: status ? false : true } });
    if (!piidetail.id) {
      return null;
    }
    piidetail.status = status;
    await this.piiDetailsRepository.update(piidetail.id, piidetail);
    return await this.piiDetailsRepository.findOne(piidetail.id);
  }

  async updatePiiRegex(attributes: String, regex: string) {
    const piidetail = await this.piiDetailsRepository.findOneOrFail({ where: { attributes } });
    if (!piidetail.id) {
      return null;
    }
    piidetail.regex = regex || null;
    await this.piiDetailsRepository.update(piidetail.id, piidetail);
    return await this.piiDetailsRepository.findOne(piidetail.id);
  }
}