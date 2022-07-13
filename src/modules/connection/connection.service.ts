import { HttpException, HttpService, HttpStatus, Inject, Injectable, Logger, Scope, UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { ALLOWED_PLATFORMS, ALL_PLATFORMS, ENTITY } from 'src/app.models';
import { CommonModule } from 'src/common/module/common-module';
import { ScraperConfigService } from 'src/common/service/scraperConfig.service';
import { getConnection, Raw, Repository, Not } from 'typeorm';
import { ConfigService } from '../../common/service/config.service';
import { CreateConnectionV1Dto } from './dto/v1/create-connection.dto';
import { SearchConnectionV1Dto } from './dto/v1/search-connection.dto';
import { UpdateConnectionV1Dto } from './dto/v1/update-connection.dto';
import { CreateConnectionV2Dto } from './dto/v2/create-connection.dto';
import { SearchConnectionV2Dto } from './dto/v2/search-connection.dto';
import { UpdateConnectionV2Dto } from './dto/v2/update-connection.dto';
import { AmazonConnectionHistoryEntity } from './entity/amazon-connection-history.entity';
import { AmazonConnectionEntity } from './entity/amazon-connection.entity';
const path = require('path');
const fs = require('fs');
const dateFormat = require('dateformat');

export enum ConnectionState {
  NEVER_CONNECTED = "NeverConnected",
  CONNECTED = "Connected",
  CONNECTION_IN_PROGRESS = "ConnectionInProgress",
  CONNECTED_AND_DISCONNECTED = "ConnectedAndDisconnected",
  CONNECTED_BUT_EXCEPTION = "ConnectedButException"
}

export enum OrderStatus {
  NONE = "None",
  INITIATED = "Initiated",
  COMPLETED = "Completed",
  INPROGRESS = "InProgress",
  FAILED = "Failed"
}

@Injectable({ scope: Scope.REQUEST })
export class ConnectionService {

  uploadDirectory = __dirname.replace(/src|modules|amazon-connection/g, '').replace("dist", "");
  connectionRepository: Repository<any>;
  connectionHistoryRepository: Repository<any>;

  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private configService: ConfigService,
    private scraperConfigService: ScraperConfigService,
    private readonly httpService: HttpService
  ) { 
      this.connectionRepository = getConnection().getRepository(this.configService.getRepository(ENTITY.CONNECTION, request.params));
      this.connectionHistoryRepository = getConnection().getRepository(this.configService.getRepository(ENTITY.CONNECTION_HISTORY, request.params));
  }

  async register(registerDto: CreateConnectionV1Dto | CreateConnectionV2Dto | any, platformSource?: string) {
    platformSource = platformSource ? platformSource.toLowerCase() : ALLOWED_PLATFORMS.AMAZON;
    const platformConnection = `${platformSource}_connection`;
    registerDto.platformId = registerDto.platformId ? registerDto.platformId : registerDto.amazonId;
    let firstaccount = false;
    let status = registerDto.status ? registerDto.status : ConnectionState.CONNECTED.toString();
    let message = registerDto.message ? registerDto.message : "Account connected successfully";
    let orderStatus = registerDto.orderStatus || OrderStatus.NONE.toString();

    if (status === ConnectionState.NEVER_CONNECTED && orderStatus === OrderStatus.FAILED) {
      await this.UpdateConnectionStatus(registerDto.panelistId, registerDto.platformId, 'connect', 'FAIL', message);
    }
    if (status === ConnectionState.NEVER_CONNECTED && orderStatus === OrderStatus.NONE) {
      await this.UpdateConnectionStatus(registerDto.panelistId, registerDto.platformId, 'connect', 'FAIL', message);
    }
 
    let data = {
      panelistId: registerDto.panelistId,
      amazonId: registerDto.platformId,
      platformId: registerDto.platformId,
      status,
      orderStatus,
      message,
      firstaccount,
      lastConnectedAt: new Date(),
      // createdAt: new Date(),
      updatedAt: new Date(),
    };

    //get panelist data form DB
    const panelistData = await this.connectionRepository.findOne({
      where: { panelistId: registerDto.panelistId },
      order: { id: 'DESC' }
    });

    if (panelistData && panelistData.id) { // check if panelist id exist in DB
      if ([ConnectionState.CONNECTED.toString(),
      ConnectionState.CONNECTED_BUT_EXCEPTION.toString(),
      ConnectionState.CONNECTION_IN_PROGRESS.toString()
      ].includes(panelistData.status)) { // check if panelist already connected to any account
        const errMsg = platformSource === ALL_PLATFORMS.AMAZON ? 'You are already connected!' : 'You are already connected or connection is in progress!';
        return CommonModule.FormatErrorResponse(HttpStatus.BAD_REQUEST, errMsg, null);
      } else if (panelistData.status === ConnectionState.NEVER_CONNECTED && panelistData.orderStatus === OrderStatus.NONE) {
        data['firstaccount'] = true;
      }
    } else { // first time panelist 
      data['firstaccount'] = true;
    }

    // get amazon data form DB
    const amazonExit = await this.connectionRepository.findOne({
      where: { platformId: Raw(alias => `LOWER(${alias}) Like '%${registerDto.platformId.toLowerCase()}%'`)},
      order: { id: 'DESC' }
    });

    if (amazonExit && amazonExit.id) { // check if amazon account already exist
      const amazonData = await this.connectionRepository.findOne({
        where: [
          { platformId: Raw(alias => `LOWER(${alias}) Like '%${registerDto.platformId.toLowerCase()}%'`), status: ConnectionState.CONNECTED.toString() },
          { platformId: Raw(alias => `LOWER(${alias}) Like '%${registerDto.platformId.toLowerCase()}%'`), status: ConnectionState.CONNECTED_BUT_EXCEPTION.toString() },
          { platformId: Raw(alias => `LOWER(${alias}) Like '%${registerDto.platformId.toLowerCase()}%'`), status: ConnectionState.CONNECTION_IN_PROGRESS.toString() }
        ],
        order: { id: 'DESC' }
      });
      if (amazonData && amazonData.id) { // check if amazon account already connected to any panelist
        if (amazonData.panelistId === registerDto.panelistId) { // check if the DB amazon account panlist is same 
          return CommonModule.FormatErrorResponse(HttpStatus.BAD_REQUEST, 'This account is already associated with you!', null);
        } else {
          return CommonModule.FormatErrorResponse(HttpStatus.BAD_REQUEST, 'This account is already associated with an existing user. Please try with another account.', null);
        }
      } else { // amazon account exist with never connected / disconnected status
        let panelistEntry = null;
        const amazonData = await this.connectionRepository.findOne({
          where: { panelistId: registerDto.panelistId, platformId: Raw(alias => `LOWER(${alias}) NOT Like '%${registerDto.platformId.toLowerCase()}%'`)  },
          order: { id: 'DESC' }
        });
        if (amazonData && amazonData.id) { // check if the DB amazon account panlist is same 
          
          data['firstaccount'] = amazonData.firstaccount;
          
          panelistEntry = await this.connectionRepository.findOne({
            where: { panelistId: registerDto.panelistId, platformId: Raw(alias => `LOWER(${alias}) LIKE '%${registerDto.platformId.toLowerCase()}%'`)  },
            order: { id: 'DESC' }
          });

          const neverConnected = await this.connectionHistoryRepository.findOne({
            where: [
              { panelistId: registerDto.panelistId, status: ConnectionState.CONNECTED.toString() },
              { panelistId: registerDto.panelistId, status: ConnectionState.CONNECTION_IN_PROGRESS.toString() },
              { panelistId: registerDto.panelistId, status: ConnectionState.CONNECTED_AND_DISCONNECTED.toString() },
              { panelistId: registerDto.panelistId, status: ConnectionState.CONNECTED_BUT_EXCEPTION.toString() },
            ],
            order: { id: 'DESC' }
          });
          if (panelistEntry && panelistEntry.id) {
            data['id'] = panelistEntry.id;
            if(panelistEntry.status != ConnectionState.NEVER_CONNECTED && ![ConnectionState.CONNECTED, ConnectionState.CONNECTION_IN_PROGRESS].includes(registerDto.status)){ // update request status if existing status is not NeverConnected
              data['status'] = panelistEntry.status;
            }
            if(panelistEntry.orderStatus !== OrderStatus.NONE && registerDto.orderStatus != OrderStatus.INITIATED){ //update request order status if existing order status is not NONE
              data['orderStatus'] = panelistEntry.orderStatus;
            }
            if(panelistEntry && panelistEntry.status == ConnectionState.NEVER_CONNECTED) {
              if(neverConnected && neverConnected.id){
                data['firstaccount'] = panelistEntry.firstaccount;
              } else {
                data['firstaccount'] = true;
              }
            } 
            
            // if(orderStatus === OrderStatus.NONE){
            //   data['firstaccount'] = false;
            // }
          }
        } else {
          panelistEntry = await this.connectionRepository.findOne({
            where: { panelistId: registerDto.panelistId, platformId: Raw(alias => `LOWER(${alias}) LIKE '%${registerDto.platformId.toLowerCase()}%'`)  },
            order: { id: 'DESC' }
          });

          const neverConnected = await this.connectionHistoryRepository.findOne({
            where: [
              { panelistId: registerDto.panelistId,  status: ConnectionState.CONNECTED.toString() },
              { panelistId: registerDto.panelistId,  status: ConnectionState.CONNECTION_IN_PROGRESS.toString() },
              { panelistId: registerDto.panelistId,  status: ConnectionState.CONNECTED_AND_DISCONNECTED.toString() },
              { panelistId: registerDto.panelistId,  status: ConnectionState.CONNECTED_BUT_EXCEPTION.toString() },
            ],
            order: { id: 'DESC' }
          });
          if (panelistEntry && panelistEntry.id) {
            data['id'] = panelistEntry.id;
            if(orderStatus === OrderStatus.INITIATED && panelistEntry.firstaccount == false){
              if(neverConnected && neverConnected.id){
                data['firstaccount'] = panelistEntry.firstaccount;
              } else {
                data['firstaccount'] = true;
              }
            } else {
              data['firstaccount'] = panelistEntry.firstaccount;
            }
          }
        }
        // Override firstaccount flag in case use has deleted the account & connects again for same platform_id - Should not be provided connection incentives
        const connectedHistory = await this.connectionHistoryRepository.findOne({
          where: [
            { panelistId: Not(registerDto.panelistId), platformId: Raw(alias => `LOWER(${alias}) LIKE '%${registerDto.platformId.toLowerCase()}%'`), status: ConnectionState.CONNECTED.toString() },
            { panelistId: Not(registerDto.panelistId), platformId: Raw(alias => `LOWER(${alias}) LIKE '%${registerDto.platformId.toLowerCase()}%'`), status: ConnectionState.CONNECTION_IN_PROGRESS.toString() }
          ]
        });
        if(connectedHistory) {
          data['firstaccount'] = false;
        }
        const result = await this.connectionRepository.save(data);
        let res = result;
        if (result && result.id) {
          if (result[platformConnection]) {
            result.id = result[platformConnection];
            delete result[platformConnection];
          }
          res = await this.connectionRepository.findOne(result.id);
          if(panelistEntry && panelistEntry.id && panelistEntry.orderStatus==OrderStatus.NONE && panelistEntry.firstaccount == false){
            res['firstTimeConnection'] = true;
          } else {
            res['firstTimeConnection'] = false;
          }
          res['firstTimeConnection'] = false;
          res.createdAt = dateFormat(res.createdAt, "dd-mm-yyyy hh:MM:ss");
          res.updatedAt = dateFormat(res.updatedAt, "dd-mm-yyyy hh:MM:ss");
          res.lastConnectedAt = dateFormat(res.lastConnectedAt, "dd-mm-yyyy hh:MM:ss");
        }
        return CommonModule.FormatResponse(HttpStatus.OK, 'Accounts Connected successfully', this.frameRegisterResponse(res, platformSource));
      }
    } else { //amazon id not exist
      // if(orderStatus=== OrderStatus.NONE){
      //     data.firstaccount = false;
      // }

      // Check if panelists has ever been provided with first account flag in history table, if not make first account as true
      const firstConnectedAccount = await this.connectionHistoryRepository.findOne({
        where: { panelistId: registerDto.panelistId, firstaccount: true }
      });
      if(!firstConnectedAccount) {
       // uncomment this after approval
       data['firstaccount'] = true;
      }

      const result = await this.connectionRepository.save(data);
      let res = result;
      if (result && result.id) {
        if (result[platformConnection]) {
          result.id = result[platformConnection];
          delete result[platformConnection];
        }
        res = await this.connectionRepository.findOne(result.id);
        // await this.connectionRepository.update(result.id, {createdAt: res.createdAt});
        res['firstTimeConnection'] = true;
        res.createdAt = dateFormat(res.createdAt, "dd-mm-yyyy hh:MM:ss");
        res.updatedAt = dateFormat(res.updatedAt, "dd-mm-yyyy hh:MM:ss");
        res.lastConnectedAt = dateFormat(res.lastConnectedAt, "dd-mm-yyyy hh:MM:ss");
      }
      /* Hard Coded Temp - FirstAccount forceffuly true */
      // const hardCodeTempValues = ['supriyanale42@gmail.com','supriyatest14@gmail.com'];
      // if(hardCodeTempValues.includes(data.platformId)) {
      //   data.firstaccount = true;
      //   await this.connectionRepository.save(data);
      // }
      /*----------------------------------------------------*/
      return CommonModule.FormatResponse(HttpStatus.OK, 'Accounts Connected successfully', this.frameRegisterResponse(res, platformSource));
    }
  }

  frameRegisterResponse(result, platformSource) {
    if(platformSource === ALLOWED_PLATFORMS.AMAZON) {
      return result;
    }
    delete result['amazonId'];
    return result;
  }

  async getAccounts(panelistId: string, platformSource?: string) {
    if(platformSource) {
      this.connectionRepository = getConnection().getRepository(this.configService.getRepository(ENTITY.CONNECTION, { platformSource: platformSource}));
      this.connectionHistoryRepository = getConnection().getRepository(this.configService.getRepository(ENTITY.CONNECTION_HISTORY, { platformSource: platformSource}));
    }
    const connections = await this.connectionRepository.find({
      where: [
        { panelistId, status: ConnectionState.CONNECTED.toString() },
        { panelistId, status: ConnectionState.CONNECTED_BUT_EXCEPTION.toString() },
        { panelistId, status: ConnectionState.CONNECTION_IN_PROGRESS.toString() }
      ]
    });
    const neverConnected = await this.connectionHistoryRepository.find({
      where: [
        { panelistId, status: ConnectionState.CONNECTED.toString() },
        { panelistId, status: ConnectionState.CONNECTED_AND_DISCONNECTED.toString() },
        { panelistId, status: ConnectionState.CONNECTION_IN_PROGRESS.toString() },
        { panelistId, status: ConnectionState.CONNECTED_BUT_EXCEPTION.toString() },
      ],
      order: { id: 'DESC' }
    });
    connections.map(x => { x.createdAt = dateFormat(x.createdAt, "dd-mm-yyyy hh:MM:ss"); x.updatedAt = dateFormat(x.updatedAt, "dd-mm-yyyy hh:MM:ss"); x.lastConnectedAt = dateFormat(x.lastConnectedAt, "dd-mm-yyyy hh:MM:ss"); return x; });
    const msg = connections.length > 0 ? 'Accounts fetched successfully!' : 'No accounts fetched!';
    const connectionData = [];
    for (let index = 0; index < connections.length; index++) {
      const connection: any = Object.assign({},connections[index]);
      const platformId = connection.amazonId ? connection.amazonId.toLowerCase() : connection.platformId.toLowerCase();
      const { scrappingType, showNotification } = await this.scraperConfigService.getScrapingType(connection.panelistId, platformId, platformSource);
      connection.showNotification = showNotification;
      connectionData.push(connection);
    }
    const res = {
      hasNeverConnected: neverConnected.length > 0 ? false : true,
      accounts: connectionData.length > 0 ? connectionData : null
    };
    // return CommonModule.FormatResponse(HttpStatus.OK, msg, res);
    return { mesaage: msg, res: res };
  }

  async update(updateConnectionDto: UpdateConnectionV1Dto | UpdateConnectionV2Dto | any, platformSource?: string) {
    platformSource = platformSource ? platformSource.toLowerCase() : ALLOWED_PLATFORMS.AMAZON;
    updateConnectionDto.platformId = updateConnectionDto.platformId ? updateConnectionDto.platformId : updateConnectionDto.amazonId;
    const platformConnection = `${platformSource}_connection`;
    const platformId = updateConnectionDto.platformId;
    const panelistId = updateConnectionDto.panelistId;
    const connection = await this.connectionRepository.findOne({
      where: { panelistId, platformId: Raw(alias => `LOWER(${alias}) Like '%${platformId.toLowerCase()}%'`) },
      order: { id: 'DESC' }
    });
    if (!connection) {
      throw new HttpException(CommonModule.FormatErrorResponse(HttpStatus.BAD_REQUEST, 'Account not exist! ', null), HttpStatus.BAD_REQUEST);
    }
    connection.platformId = connection.platformId ? connection.platformId : connection.amazonId;
    if ((connection.status === ConnectionState.CONNECTED_AND_DISCONNECTED && updateConnectionDto.status === ConnectionState.CONNECTED) ||
      (connection.status === ConnectionState.NEVER_CONNECTED && updateConnectionDto.status === ConnectionState.CONNECTED)) {
      connection.lastConnectedAt = new Date();
    }
    if(updateConnectionDto.status === ConnectionState.CONNECTED_AND_DISCONNECTED){
      connection.firstaccount = false;
    }
    connection.updatedAt = new Date();
    
    connection.message = updateConnectionDto.message || null;
    const orderStatus = updateConnectionDto.orderStatus  || OrderStatus.NONE;
    connection.orderStatus = orderStatus; 
    // connection.status = connection.status != ConnectionState.NEVER_CONNECTED && updateConnectionDto.status == ConnectionState.NEVER_CONNECTED ? connection.status : updateConnectionDto.status;
    connection.status = updateConnectionDto.status || ConnectionState.NEVER_CONNECTED;
    const res = await this.connectionRepository.save(connection)
    // update connection status api call
    if (updateConnectionDto.status === ConnectionState.NEVER_CONNECTED && updateConnectionDto.orderStatus === OrderStatus.FAILED) {
      await this.UpdateConnectionStatus(connection.panelistId, connection.platformId, 'connect', "FAIL", connection.message);
    }

    if (connection.status === ConnectionState.CONNECTED || connection.status === ConnectionState.CONNECTED_BUT_EXCEPTION) {
      const connectStatus = connection.status === ConnectionState.CONNECTED_BUT_EXCEPTION ? 'FAIL' : 'SUCCESS';
      await this.UpdateConnectionStatus(connection.panelistId, connection.platformId, 'connect', connectStatus, connection.message);
    }

    if (connection.status === ConnectionState.CONNECTED_AND_DISCONNECTED) {
      await this.UpdateConnectionStatus(connection.panelistId, connection.platformId, 'disconnect', "SUCCESS", connection.message);
    }

    if (res && res.id) {
      if (res[platformConnection]) {
        res.id = res[platformConnection];
        delete res[platformConnection];
      }
      res.createdAt = dateFormat(res.createdAt, "dd-mm-yyyy hh:MM:ss");
      res.updatedAt = dateFormat(res.updatedAt, "dd-mm-yyyy hh:MM:ss");
      res.lastConnectedAt = dateFormat(res.lastConnectedAt, "dd-mm-yyyy hh:MM:ss");
    }
    // update disconnect tag
    await this.tagDisconnection(res.status, platformSource, panelistId)
    return CommonModule.FormatResponse(HttpStatus.OK, 'Status updated successfully!', this.frameRegisterResponse(res, platformSource));
  }

  async tagDisconnection(status, platformSource, panelistId) {
    if(status === ConnectionState.CONNECTED_AND_DISCONNECTED) {
      console.log('Disconnection tag API');
      await this.scraperConfigService.tagAPI(panelistId, `${platformSource}_connect_disconnected`)
    }
  }

  async updateStatus(panelistId, platformId) {
    const data = await this.connectionRepository.findOne({
      where: { panelistId, platformId: Raw(alias => `LOWER(${alias}) Like '%${platformId.toLowerCase()}%'`) },
      order: { id: 'DESC' }
    });
    if (!data) {
      return false;
    }
    data.status = ConnectionState.CONNECTED;
    data.orderStatus = OrderStatus.COMPLETED;
    data.message = "Receipts fetched successfully";
    await this.connectionRepository.save(data);
    return await this.UpdateConnectionStatus(data.panelistId, data.platformId, 'connect', "SUCCESS", data.message);
  }

  async UpdateConnectionStatus(panelistId: string, platformId: string, event: string, connectStatus: string, connectMsg: string): Promise<any> {
    if (this.configService.getNumber('ENABLE_IRI_NCP_AUTH')) {

      const url = `${this.configService.get('IRI_NCP_BASE_URL')}/UpdateConnectionStatus`;

      const token = Buffer.from(this.configService.get('IRI_NCP_USER') + ":" + this.configService.get('IRI_NCP_PASS')).toString('base64');

      const headers = { 'Content-Type': 'application/json', 'Authorization': `Basic ${token}` };

      const data = {
        panelistID: panelistId,
        connectName: "amazon_connect",
        event: event,
        connectId: platformId,
        connectStatus: connectStatus,
        connectMsg: connectMsg,
        Time: dateFormat(new Date(), "hh:MM:ss"),
        Date: dateFormat(new Date(), "mm/dd/yyyy")
      };

      const payload = { connectionEvents: [data] };

      const filePath = path.join(this.uploadDirectory, 'authLog.log');
      return await this.httpService.post(url, payload, { headers }).toPromise()
        .then(res => {
          if (res && res.data) {
            const data = {
              payload,
              response: res.data
            };
            fs.appendFile(filePath, JSON.stringify(data) + '\n', (e, data) => {
              if (e) {
                Logger.error(e.message);
              }
            });
            Logger.log(JSON.stringify(res.data));
            return res.data;
          }
        }).catch(e => {
          Logger.error(e);
          fs.appendFile(filePath, e.message + '\n', (e, data) => {
            if (e) {
              Logger.error(e.message);
            }
          });
        });
    }
    return false;
  }

  async findAll(data: SearchConnectionV1Dto | SearchConnectionV2Dto | any): Promise<any[]> {
    data.platformId = data.platformId ? data.platformId : data.amazonId;
    let where = {};
    if (data.platformId) {
      where['platformId'] = Raw(alias => `LOWER(${alias}) Like '%${data.platformId.toLowerCase()}%'`);
    }
    if (data.panelistId) {
      where['panelistId'] = data.panelistId;
    }
    if (data.status) {
      where['status'] = data.status;
    }
    if (data.orderStatus) {
      where['orderStatus'] = data.orderStatus;
    }
    return await this.connectionRepository.find({
      where,
      order: {
        id: 'DESC'
      },
      take: 100
    });
  }

  async findAllHistory(data): Promise<any[]> {
    let where = {};
    data.platformId = data.platformId ? data.platformId : data.amazonId;
    if (data.platformId) {
      where['platformId'] = Raw(alias => `LOWER(${alias}) Like '%${data.platformId.toLowerCase()}%'`);
    }
    if (data.panelistId) {
      where['panelistId'] = data.panelistId;
    }
    return await this.connectionHistoryRepository.find({
      where,
      order: {
        id: 'DESC'
      },
      take: data.limit || 100
    });
  }
}
