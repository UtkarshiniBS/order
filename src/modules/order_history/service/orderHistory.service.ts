import { Inject, Injectable, Logger, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Any, getConnection, IsNull, LessThanOrEqual, MoreThanOrEqual, Not, Raw } from "typeorm";

import { CreateOrderHistoryV1Dto } from '../dto/v1/createOrderHistoryV1.dto';
import { MoreThan, Repository } from 'typeorm';
import { ConfigService } from 'src/common/service/config.service';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';
import { ENTITY } from 'src/app.models';
import { CreateOrderHistoryV2Dto } from '../dto/v2/createOrderHistoryV2.dto';
import { CommonModule } from 'src/common/module/common-module';
import { ScraperConfigService } from 'src/common/service/scraperConfig.service';
import { format } from 'date-fns';

@Injectable({ scope: Scope.REQUEST })
export class OrderHistoryService {
  
  orderHistoryRepository: Repository<any>;
  orderRepository: Repository<any>;

  constructor(
    private readonly configService: ConfigService,
    @Inject(REQUEST) private readonly request: Request
  ) { 
    this.orderHistoryRepository = getConnection().getRepository(this.configService.getRepository(ENTITY.ORDER_HISTORY, request.params));
    this.orderRepository = getConnection().getRepository(this.configService.getRepository(ENTITY.ORDERS, request.params));
  }

  async create(data: any): Promise<any> {
    // const platformId = data.platformId ? data.platformId : data.amazonId;
    // const conditions = { platformId: Raw(alias => `LOWER(${alias}) Like '%${platformId.toLowerCase()}%'`), panelistId: data.panelistId, fromDate: data.fromDate, toDate: data.toDate };
    // const isRowAlreadyExist = await this.orderHistoryRepository.findOne({ where: conditions, order: { toDate: 'DESC', id: 'DESC' } });
    // if(isRowAlreadyExist) {
    //   data.id = isRowAlreadyExist.id;
    // }
    return await this.orderHistoryRepository.save(data);

  }

  async createOrderData(createOrderDto: any): Promise<any> {
    return await this.orderRepository.save(createOrderDto);
  }

  async getOrder(orderHistoryId): Promise<any> {
    return await this.orderRepository.find({
      select: ['orderId'],
      where: {
        order_history: orderHistoryId
      }
    });
  }


  async findAll(data): Promise<any[]> {
    let where = {};
    if(data.platformId || data.amazonId) {
      const platformId = data.platformId ? data.platformId : data.amazonId;
      if (platformId) {
        where['platformId'] = Raw(alias => `LOWER(${alias}) Like '%${platformId.toLowerCase()}%'`);
      }
    }
    if (data.panelistId) {
      where['panelistId'] = data.panelistId;
    }
    
    if (data.fromDate) {
      // where['fromDate'] = Raw(alias => `${alias} >= '${CommonModule.formatDate(data.fromDate)}'`);
      where['fromDate'] = MoreThanOrEqual(CommonModule.formatDate(data.fromDate))
    }

    if (data.toDate) {
      // where['toDate'] = Raw(alias => `${alias} <= '${CommonModule.formatDate(data.toDate)}'`);
      where['toDate'] = LessThanOrEqual(CommonModule.formatDate(data.toDate))
    }

    return await this.orderHistoryRepository.find({
      where,
      order: {
        id: 'DESC'
      },
      select: ['filePath','fileName','storageType','fromDate','toDate','panelistId','platformId','orderCount','productCount','lastOrderId','createdAt','updatedAt','scrappingType','status','listingOrderCount','listingScrapeTime'],
      take: 100
    });
  }

  async findAllOrders(data): Promise<any[]> {
    let where = {};
    if(data.platformId || data.amazonId) {
      const platformId = data.platformId ? data.platformId : data.amazonId;
      if (platformId) {
        where['platformId'] = Raw(alias => `LOWER(${alias}) Like '%${platformId.toLowerCase()}%'`);
      }
    }
    if (data.panelistId) {
      where['panelistId'] = data.panelistId;
    }
    
    if (data.fromDate) {
      // where['fromDate'] = Raw(alias => `${alias} >= '${CommonModule.formatDate(data.fromDate)}'`);
      where['createdAt'] = MoreThanOrEqual(CommonModule.formatDate(data.createdAt))
    }

    if (data.toDate) {
      // where['toDate'] = Raw(alias => `${alias} <= '${CommonModule.formatDate(data.toDate)}'`);
      where['createdAt'] = LessThanOrEqual(CommonModule.formatDate(data.createdAt))
    }

    return await this.orderRepository.find({
      where,
      order: {
        id: 'DESC'
      },
      take: 100
    });
  }

  async findFile(fileName: string): Promise<any> {
    return await this.orderHistoryRepository.findOne({ where: { fileName } });
  }

  async getOrderHistory(data: CreateOrderHistoryV1Dto | CreateOrderHistoryV2Dto | any): Promise<any> {
    const platformId = data.platformId ? data.platformId : data.amazonId;
    return await this.orderHistoryRepository.find({ platformId: Raw(alias => `LOWER(${alias}) Like '%${platformId.toLowerCase()}%'`), panelistId: data.panelistId, fromDate: data.fromDate, toDate: data.toDate });
  }

  async getOrders(data: CreateOrderHistoryV1Dto | CreateOrderHistoryV2Dto | any, scrappingType, limit?: number): Promise<any> {
    const platformId = data.platformId ? data.platformId : data.amazonId;
    const conditions = { platformId: Raw(alias => `LOWER(${alias}) Like '%${platformId.toLowerCase()}%'`), panelistId: data.panelistId, fromDate: data.fromDate, toDate: data.toDate, scrappingType };
    if(limit) {
      return await this.orderHistoryRepository.find({ where: conditions, take: limit, order: { toDate: 'DESC', id: 'DESC' } });
    } else {
      return await this.orderHistoryRepository.find({ where: conditions, order: { toDate: 'DESC', id: 'DESC' } });
    }
  }

  async getHistoryOrder(data: CreateOrderHistoryV1Dto | CreateOrderHistoryV2Dto | any, scrappingType, sessionId?): Promise<any> {
    const platformId = data.platformId ? data.platformId : data.amazonId;
    const conditions = { platformId: Raw(alias => `LOWER(${alias}) Like '%${platformId.toLowerCase()}%'`), panelistId: data.panelistId, fromDate: data.fromDate, toDate: data.toDate, scrappingType };
    return await this.orderHistoryRepository.findOne({ where: conditions, select: ['id','scrapingSessionContext','scrapingSessionStartedAt','createdAt','listingOrderCount'], order: { toDate: 'DESC', id: 'DESC' } });
  }

  async getOrderByFromDate(platformId, panelistId, fromDate): Promise<any> {
    const date = format(CommonModule.formatDate(fromDate),'yyyy-MM-dd')
    const conditions = { platformId: Raw(alias => `LOWER(${alias}) Like '%${platformId.toLowerCase()}%'`), panelistId: panelistId, fromDate: date };
    return await this.orderHistoryRepository.findOne({ where: conditions, order: { id: 'DESC' } });
  }

  async getLastOrderHistory(data: CreateOrderHistoryV1Dto | CreateOrderHistoryV2Dto | any): Promise<any> {
    const platformId = data.platformId ? data.platformId : data.amazonId;
    const conditions = { platformId: Raw(alias => `LOWER(${alias}) Like '%${platformId.toLowerCase()}%'`), panelistId: data.panelistId, lastOrderId: Not(IsNull()) };
    return await this.orderHistoryRepository.findOne({
      where: conditions,
      select: ['lastOrderId'],
      order: { toDate: 'DESC', id: 'DESC' } 
    });
  }

  async deleteOrderHistory(data: CreateOrderHistoryV1Dto | CreateOrderHistoryV2Dto | any): Promise<any> {
    const platformId = data.platformId ? data.platformId : data.amazonId;
    return await this.orderHistoryRepository.delete({ platformId: Raw(alias => `LOWER(${alias}) Like '%${platformId.toLowerCase()}%'`), panelistId: data.panelistId, fromDate: data.fromDate, toDate: data.toDate });
  }

  async deleteOrderHistoryById(id: any): Promise<any> {
    return await this.orderHistoryRepository.delete({ id });
  }

  async deleteOrderHistoryByType(data: any, scrappingType): Promise<any> {
    const platformId = data.platformId ? data.platformId : data.amazonId;
    return await this.orderHistoryRepository.delete({ platformId: Raw(alias => `LOWER(${alias}) Like '%${platformId.toLowerCase()}%'`), panelistId: data.panelistId, fromDate: data.fromDate, toDate: data.toDate, scrappingType });
  }

  async findFileById(panelistId: string, platformId: string, limit?: number): Promise<any> {
    return await this.orderHistoryRepository.find({
      where: { panelistId, platformId: Raw(alias => `LOWER(${alias}) Like '%${platformId.toLowerCase()}%'`), orderCount: MoreThan(0), productCount: MoreThan(0) },
      order: { id: "DESC" },
      take: limit ? limit : 1,
    });
  }

  async updateOrderHistory(id: String, orderCount: number, productCount: number, updatedAt: Date, orderData?: any[]) {
    const data = await this.orderHistoryRepository.findOneOrFail({ where: { id } });
    if (!data.id) {
      return null;
    }
    data.updatedAt = updatedAt;
    data.orderCount = orderCount;
    data.productCount = productCount;
    if(orderData) {
      data.orderData = orderData;
    }
    await this.orderHistoryRepository.update(data.id, data);
    return await this.orderHistoryRepository.findOne(data.id);
  }
}