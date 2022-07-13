import { BadRequestException, Controller, Get, Header, HttpCode, HttpException, HttpStatus, Logger, Post, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Body, Query } from '@nestjs/common/decorators/http/route-params.decorator';

import path = require('path');
import { CreateOrderHistoryV1Dto } from 'src/modules/order_history/dto/v1/createOrderHistoryV1.dto';
import { CreateOrdersV1Dto } from 'src/modules/order_history/dto/v1/createOrdersV1.dto';
import { OrderHistoryV1Dto } from 'src/modules/order_history/dto/v1/orderHistoryV1.dto';
import { SearchOrderHistoryV1Dto } from 'src/modules/order_history/dto/v1/searchOrderHistoryV1.dto';
import { CreateOrdersV2Dto } from 'src/modules/order_history/dto/v2/createOrdersV2.dto';
import { SearchOrderHistoryV2Dto } from 'src/modules/order_history/dto/v2/searchOrderHistoryV2.dto';
import { ScrappingType } from 'src/common/entityTypes/orderHistoryEntity.type';
import { ALLOWED_PLATFORMS, ALL_PLATFORMS, scrapingContext } from 'src/app.models';
import { CommonModule } from 'src/common/module/common-module';
import { ConfigService } from 'src/common/service/config.service';
import { ScraperConfigService } from 'src/common/service/scraperConfig.service';
import { generateName } from 'src/common/utils/file-upload.utils';
import { AuthService } from '../auth/service/auth.service';
import { ConnectionService, OrderStatus } from '../connection/connection.service';
import { OrderHistoryService } from './service/orderHistory.service';
import { QueryFailedError } from 'typeorm/error/QueryFailedError';
const fs = require('fs');
const dateFormat = require('dateformat');
const streamifier = require('streamifier');
const csv = require('csv-parse');

@Controller()
export class OrderHistoryCoreController {

  constructor(
    protected orderHistoryService: OrderHistoryService,
    protected authService: AuthService,
    protected scraperConfigService: ScraperConfigService,
    protected connectionService: ConnectionService,
    protected configService: ConfigService
  ) { }

  async uploadOrders(@Body() body: CreateOrdersV1Dto | CreateOrdersV2Dto | any, platformSource?: ALL_PLATFORMS ) {
    const fromDate = CommonModule.formatDate(body.fromDate);
    const toDate = CommonModule.formatDate(body.toDate);
    body.platformId = body.platformId ? body.platformId : body.amazonId;
    const orderData = await this.filterOrderData(fromDate, toDate, body.data);
    // Additional condition for instacart rescraping
    // get Start date configured for instacart
    // check if the panelists has a record with from date same as configured (instacartOrder)
    // if there is an order -> continue to upload order else -> throw success with messgae 
    if(platformSource === ALL_PLATFORMS.INSTACART || platformSource === ALL_PLATFORMS.WALMART) {
      const config = await this.scraperConfigService.getScraperConfig(platformSource);
      if(await this.canSkipOrder(config.start_date, body.fromDate, body.platformId, body.panelistId)) {
        return CommonModule.FormatResponse(HttpStatus.OK, `Skipped order as the part of ${platformSource} rescraping`, { panelistId: body.panelistId, platformId: body.platformId });
      }
    }
    const bodyData = Object.assign({}, body);
    bodyData.fromDate = fromDate
    bodyData.toDate = toDate
    const existingOrder = await this.orderHistoryService.getHistoryOrder(bodyData, ScrappingType.HTML, body.sessionId);

    //get order data
    // const orderData = await this.getOrderData(bodyData, oldOrdersHTML);
    let record: any = {
      panelistId : body.panelistId,
      platformId: body.platformId,
      fromDate,
      toDate,
      // orderCount: orderData.orderCount ? orderData.orderCount : "0",
      // productCount: orderData.productCount ? orderData.productCount : "0",
      status: body.status,
      scrappingType: ScrappingType.HTML,
      listingOrderCount: body.listingOrderCount || null,
      listingScrapeTime: body.listingScrapeTime || null,
      scrapingSessionContext: body.scrapingSessionContext ? body.scrapingSessionContext.toLowerCase() : null,
      scrapingSessionStatus: body.scrapingSessionStatus || null,
      scrapingSessionStartedAt: body.scrapingSessionStartedAt || null,
      scrapingSessionEndedAt: body.scrapingSessionEndedAt || null,
      sessionId: body.sessionId || null
    };

    if(platformSource === ALL_PLATFORMS.AMAZON) {
      record.amazonId = body.platformId;
    }
    if(existingOrder) {
      record.id = existingOrder.id;
      // Additional condition to handle same date range manual scraping conflict with `online` orders
      // TODO: handle this for non session Id rows
      if(existingOrder.scrapingSessionContext && existingOrder.scrapingSessionContext === scrapingContext.ONLINE) {
        record['scrapingSessionContext'] = scrapingContext.ONLINE;
      }
      if(existingOrder.listingOrderCount) {
        record['listingOrderCount'] = existingOrder.listingOrderCount;
      }
      // Additional check to prevent updating session date/created date of the record
      if(existingOrder.scrapingSessionStartedAt) {
        record['scrapingSessionStartedAt'] = existingOrder.scrapingSessionStartedAt;
      }
      record['createdAt'] = existingOrder.createdAt;
      record['updatedAt'] = new Date();
    }
    record.status = body.status || 'Inprogress';
    // Send orderId in response for SDK to remove it from queue
    const orderObj = body.data.map(orderData => {
      return { orderId: orderData.orderId };
    });
    const res = await this.orderHistoryService.create(record);
    res.orderData = orderObj && orderObj.length ? orderObj : [];
    res.fromDate = dateFormat(res.fromDate, "dd-mm-yyyy");
    res.toDate = dateFormat(res.toDate, "dd-mm-yyyy");
    res.createdAt = dateFormat(res.createdAt, "dd-mm-yyyy hh:MM:ss");
    res.updatedAt = dateFormat(res.updatedAt, "dd-mm-yyyy hh:MM:ss");
    if(platformSource === ALL_PLATFORMS.AMAZON) {
      //update Amazon connection status
      await this.connectionService.updateStatus(record.panelistId, record.platformId);
    }
    if(orderData.length) {
      try {
        await this.updateOrdersTable(record, platformSource, orderData);
      } catch(err) {
        if(err instanceof QueryFailedError) {
          console.log(err.message);
        } else {
          throw err;
        }
      }
    }
    // Tag connect Active
    this.tagConnectActive(body.panelistId, platformSource, orderData.length, ScrappingType.HTML);
    return CommonModule.FormatResponse(HttpStatus.OK, 'Order history uploaded successfully!', res);
  }

  async updateOrdersTable(orderHistory, platformSource, orderData?, extraData?) {
    let allData: any = [];
    const dataFormat: any = {
      panelistId: orderHistory.panelistId,
      platformId: orderHistory.platformId,
      order_history: orderHistory.id,
      scrappingType: orderHistory.scrappingType,
    };
    if(orderData) {
      for (const data of orderData) {
        const dataClone = Object.assign({},data);
        allData.push({
          ...dataFormat,
          orderData: this.removeScrapeTimeDetails(dataClone),
          orderId: data.orderId,
          orderDate: new Date(data.orderDate),
          orderPageLoadTime: data.scrapingTime && data.scrapingTime.pageLoadTime ? data.scrapingTime.pageLoadTime : null,
          orderScrapeTime: data.scrapingTime && data.scrapingTime.scrapeTime ? data.scrapingTime.scrapeTime : null,
          scrapingContext: data.scrapingTime && data.scrapingTime.scrapingContext ? data.scrapingTime.scrapingContext : null
        })
      }
      // allData = this.removeScrapeTimeDetails(allData);
      let allIds = await this.orderHistoryService.getOrder(orderHistory.id);
      allIds = allIds.map(a => a.orderId);
      allData = allData.filter(f => !allIds.includes(f.orderId));
      await this.orderHistoryService.createOrderData(allData);
    }
    if(platformSource === ALL_PLATFORMS.AMAZON && dataFormat.scrappingType === ScrappingType.REPORT) {
      dataFormat.filePath = orderHistory.filePath;
      dataFormat.scrappingType = orderHistory.scrappingType;
      dataFormat.orderPageLoadTime = orderHistory.pageLoadTime ? parseInt(orderHistory.pageLoadTime) : null;
      dataFormat.orderScrapeTime = orderHistory.scrapeTime ? parseInt(orderHistory.scrapeTime) : null;
      dataFormat.scrapingContext = orderHistory.scrapingContext ? orderHistory.scrapingContext : null;
      dataFormat.orderId = extraData && extraData.lastOrderId ? extraData.lastOrderId : null;
      dataFormat.orderDate = extraData && extraData.lastOrderDate ? extraData.lastOrderDate : null;
      await this.orderHistoryService.createOrderData(dataFormat);
    }
    return
  }

  async canSkipOrder(configStartDate, fromDate, platformId, panelistId) {
    const historyOrder = await this.orderHistoryService.getOrderByFromDate(platformId, panelistId, configStartDate);
    if(fromDate === configStartDate || historyOrder) {
      return false;
    }
    return true;
  }

  removeScrapeTimeDetails(orderData) {
    if(!orderData) {
      return orderData;
    }
    if(Array.isArray(orderData)) {
      for (const data of orderData) {
        if(data.scrapingTime) {
          delete data.scrapingTime
        }
      }
    } else {
      delete orderData.scrapingTime
    }
    return orderData;
  }
  

  async uploadOrderHistory(body: CreateOrderHistoryV1Dto | any, file: Express.Multer.File, platformSource?: string) {
    platformSource = platformSource ? platformSource.toLowerCase() : ALLOWED_PLATFORMS.AMAZON;
    body.platformId = body.platformId ? body.platformId : body.amazonId;
    body.amazonId = body.platformId;
    // const checkConfig = await this.scraperConfigService.checkScaperInterval(body.panelistId, body.platformId, platformSource);    
    // if (!checkConfig.enableScraping) {
    //   throw new HttpException(CommonModule.FormatErrorResponse(HttpStatus.BAD_REQUEST, 'Scraping is disabled', null), HttpStatus.BAD_REQUEST);
    // }
    if (!file) {
      throw new HttpException(CommonModule.FormatErrorResponse(HttpStatus.BAD_REQUEST, 'Order history file missing!', null), HttpStatus.BAD_REQUEST);
    }
    const fileName = generateName(file);
    const fromDate = CommonModule.formatDate(body.fromDate);
    const toDate = CommonModule.formatDate(body.toDate);
    const uploadDirectory = this.configService.getStoragePath;
    Logger.log(uploadDirectory);
    const filePath = path.join(uploadDirectory, fileName);
    if (!fs.existsSync(uploadDirectory)) {
      fs.mkdirSync(uploadDirectory);
    }

    //get uploaded csv data
    const csv = await this.getCsvData(file);
    let record = {
      ...body,
      fromDate,
      toDate,
      orderCount: csv.orderCount ? csv.orderCount : "0",
      productCount: csv.productCount ? csv.productCount : "0",
      status: OrderStatus.COMPLETED
    };
    if(body.scrapingContext) {
      record.scrapingSessionContext = body.scrapingContext.toLowerCase();
    }
    if(body.scrapingContext && body.scrapingContext === scrapingContext.ONLINE) {
      record.scrapingSessionStatus = OrderStatus.COMPLETED;
      record.scrapingSessionStartedAt = new Date();
      // Add time here
    }
    if (csv && csv.productCount > 0) { // check csv is empty
      // remove duplicate order histories
      // await this.removeDuplicateHistory(record);

      // console.log('csv producst', csv);
      // await this.validateDuplicateOrders(body.panelistId, body.platformId, file);

      const writeStream = fs.createWriteStream(filePath);
      const readStream = streamifier.createReadStream(file.buffer).setEncoding('UTF8');
      readStream.pipe(writeStream);
      return await new Promise((resolve, reject) => {
        writeStream.on("finish", async () => {
          const getStoragePath = this.configService.getStoragePath;
          record['fileName'] = fileName;
          record['filePath'] = path.join(getStoragePath, fileName);
          record['lastOrderId'] = csv.products && csv.products.length ? csv.products[csv.products.length - 1] : null;
          const res = await this.orderHistoryService.create(record);
          res.fromDate = dateFormat(res.fromDate, "dd-mm-yyyy");
          res.toDate = dateFormat(res.toDate, "dd-mm-yyyy");
          res.createdAt = dateFormat(res.createdAt, "dd-mm-yyyy hh:MM:ss");
          res.updatedAt = dateFormat(res.updatedAt, "dd-mm-yyyy hh:MM:ss");
          await this.updateOrdersTable(res, platformSource, null, { lastOrderId: record['lastOrderId'], lastOrderDate: csv.lastOrderDate });
          delete res.filePath;
          delete res.orderData;
          delete res.scrappingType;
          //update Amazon connection status
          await this.connectionService.updateStatus(record.panelistId, record.platformId);
          // Tag connect Active
          this.tagConnectActive(body.panelistId, platformSource, res.orderCount, ScrappingType.REPORT);
          return resolve(CommonModule.FormatResponse(HttpStatus.OK, 'Order history uploaded successfully!', res));
        });
        writeStream.on("error", (e) => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          return reject(CommonModule.FormatErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, e.message, null));
        });
        readStream.on('error', function (e) {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          return reject(CommonModule.FormatErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, e.message, null));
        });
      });
    } else if (csv && !csv.productCount) { // empty csv file
      // console.log('!csv.productCount', lastOrderId);
      // remove duplicate order histories
      // await this.removeDuplicateHistory(record);
      // const lastOrderId = await this.getLastOrderId(record);
      record['fileName'] = null;
      record['filePath'] = null;
      record['lastOrderId'] = null;
      const res = await this.orderHistoryService.create(record);
      res.fromDate = dateFormat(res.fromDate, "dd-mm-yyyy");
      res.toDate = dateFormat(res.toDate, "dd-mm-yyyy");
      res.createdAt = dateFormat(res.createdAt, "dd-mm-yyyy hh:MM:ss");
      res.updatedAt = dateFormat(res.updatedAt, "dd-mm-yyyy hh:MM:ss");
      delete res.filePath;
      //update Amazon connection status
      await this.connectionService.updateStatus(record.panelistId, record.platformId);
      return CommonModule.FormatResponse(HttpStatus.OK, 'Order history uploaded successfully!', res);
    } else {
      throw new HttpException(CommonModule.FormatErrorResponse(HttpStatus.BAD_REQUEST, 'Order history not uploaded!', null), HttpStatus.BAD_REQUEST);
    }
  }

  async filterOrderData(fromDate, toDate, data) {
    let orders = [];
    let itemCount = 0;
    if(data.length > 0){
      const startDate = new Date(fromDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date (toDate);
      endDate.setHours(23, 59, 59, 999);
      orders = data.filter((order) => {
        const orderDate = new Date(order.orderDate);
        return orderDate >= startDate && orderDate <= endDate;
      });
      // orders.map((orderData) => {
      //   if(orderData.items && orderData.items.length) {
      //     itemCount = itemCount + orderData.items.length
      //   }
      // });
    }
    Logger.log('Orders: ' + orders.length);
    // return { orderCount: orders.length, productCount: itemCount, products: orders };
    return orders;
  }

  async getCsvData(file): Promise<any> {
    return new Promise((resolve, reject) => {
      const readStream = streamifier.createReadStream(file.buffer, 'utf8');
      let data = '';
      readStream.on('data', (row: any) => {
        data += row.toString();
      });
      readStream.on('error', (e: { message: any; }) => {
        return reject(new HttpException(CommonModule.FormatErrorResponse(HttpStatus.BAD_REQUEST, e.message, null), HttpStatus.BAD_REQUEST));
      });
      readStream.on('end', () => {
        const rows = data.length > 0 ? data.split('\n') : [];
        let records = [];
        let orders = [];
        let lastOrderDate = null;
        if (rows.length > 0) {
          const header = rows[0].split(',');
          const orderIdIndex = header.length > 0 ? header.findIndex(c => c.trim() == 'Order ID') : null;
          if (orderIdIndex == null || orderIdIndex < 0) {
            return reject(new HttpException(CommonModule.FormatErrorResponse(HttpStatus.BAD_REQUEST, 'Inconsistent header in csv!', null), HttpStatus.BAD_REQUEST));
          }
          records = rows.filter(l => !!l).slice(1).map((row: any) => {
            lastOrderDate = row.split(',')[0] ? row.split(',')[0].trim() : null;
            return row.split(',')[orderIdIndex] ? row.split(',')[orderIdIndex].trim() : null;
          }).filter((x) => x != null && x != '');
          orders = records.filter((v, i, p) => p.indexOf(v) === i); // filter unique row order ids
        }
        if (records.includes('No data found for this time period')) {
          return resolve({ orderCount: 0, productCount: 0, products: [], lastOrderDate: lastOrderDate });
        }
        Logger.log('Uploaded csv Orders: ' + orders.length + ', Products: ' + records.length);
        return resolve({ orderCount: orders.length, productCount: records.length, products: orders, lastOrderDate: lastOrderDate });
      });
    });
  }

  async findAll(body: SearchOrderHistoryV1Dto | SearchOrderHistoryV2Dto | any): Promise<OrderHistoryV1Dto[]> {
    const response = await this.orderHistoryService.findAll(body);
    response.map(x => { x.fromDate = dateFormat(x.fromDate, "dd-mm-yyyy"); x.toDate = dateFormat(x.toDate, "dd-mm-yyyy"); x.createdAt = dateFormat(x.createdAt, "dd-mm-yyyy hh:MM:ss"); x.updatedAt = dateFormat(x.updatedAt, "dd-mm-yyyy hh:MM:ss"); delete x.filePath; return x; });
    return CommonModule.FormatResponse(HttpStatus.OK, 'Order history fetched successfully!', response);
  }

  async findAllOrders(body: SearchOrderHistoryV1Dto | SearchOrderHistoryV2Dto | any): Promise<OrderHistoryV1Dto[]> {
    const response = await this.orderHistoryService.findAllOrders(body);
    response.map(x => { x.orderDate = dateFormat(x.orderDate, "dd-mm-yyyy"); x.createdAt = dateFormat(x.createdAt, "dd-mm-yyyy hh:MM:ss"); return x; });
    return CommonModule.FormatResponse(HttpStatus.OK, 'Order history fetched successfully!', response);
  }

  async getFile(filename, res): Promise<any> {
    const response = await this.orderHistoryService.findFile(filename);
    if (response == undefined) {
      throw new HttpException(CommonModule.FormatErrorResponse(HttpStatus.BAD_REQUEST, 'Order history csv not found!', null), HttpStatus.BAD_REQUEST);
      // res.status(HttpStatus.BAD_REQUEST).json(CommonModule.FormatErrorResponse(HttpStatus.BAD_REQUEST, 'Order history csv not found!', null));
    } else {
      const filePath = path.join(this.configService.getStoragePath, filename);
      if(!fs.existsSync(filePath)){
        throw new HttpException(CommonModule.FormatErrorResponse(HttpStatus.BAD_REQUEST, 'Order history csv not found!', null), HttpStatus.BAD_REQUEST);
        // res.status(HttpStatus.BAD_REQUEST).json(CommonModule.FormatErrorResponse(HttpStatus.BAD_REQUEST, 'Order history csv not found!', null));
      } else {
        res.setHeader('filename', filename);
        res.sendFile(filename, { root: this.configService.getStoragePath });
      }
    }
  }

  async tagConnectActive(panelistId, platformSource, orderCount, scrapingType) {
    let isValid = false;
    if(platformSource === ALL_PLATFORMS.AMAZON && scrapingType === ScrappingType.REPORT) {
      isValid = true;
    } else {
      if(scrapingType === ScrappingType.HTML && orderCount >= 1) {
        isValid = true;
      }
    }
    if(isValid) {
      console.log('Connection Active tag API');
      await this.scraperConfigService.tagAPI(panelistId, `${platformSource}_connect_active`);
    }
  }
}