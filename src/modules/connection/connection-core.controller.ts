import { Logger, HttpStatus, Req, Controller } from "@nestjs/common";
const dateFormat = require('dateformat');
import { CommonModule } from "src/common/module/common-module";
import { ConnectionService } from "./connection.service";
import { CreateConnectionV1Dto } from "./dto/v1/create-connection.dto";
import { SearchConnectionV1Dto } from "./dto/v1/search-connection.dto";
import { SearchHistoryConnectionV1Dto } from "./dto/v1/search-history-connection.dto";
import { UpdateConnectionV1Dto } from "./dto/v1/update-connection.dto";
import { CreateConnectionV2Dto } from "./dto/v2/create-connection.dto";
import { SearchConnectionV2Dto } from "./dto/v2/search-connection.dto";
import { UpdateConnectionV2Dto } from "./dto/v2/update-connection.dto";

@Controller()
export class ConnectionCoreController {
    
  constructor(protected ConnectionService: ConnectionService) {}

  async registerAccount(
    createConnectionDto: CreateConnectionV1Dto | CreateConnectionV2Dto | any,
    platformSource?: string,
  ) {
    Logger.log(createConnectionDto);
    return await this.ConnectionService.register(
        createConnectionDto,
      platformSource,
    );
  }

  async getAccounts(panelistId) {
    const response = await this.ConnectionService.getAccounts(panelistId);
    return CommonModule.FormatResponse(
      HttpStatus.OK,
      response.mesaage,
      response.res,
    );
  }

  async updateAccount(
    updateConnectionDto: UpdateConnectionV1Dto | UpdateConnectionV2Dto | any,
    @Req() request,
    platformSource?: string,
  ) {
    return await this.ConnectionService.update(
      updateConnectionDto,
      platformSource,
    );
  }

  async getConnections(
    body: SearchConnectionV1Dto | SearchConnectionV2Dto | any,
  ) {
    const response = await this.ConnectionService.findAll(body);
    response.map(x => {
      x.lastConnectedAt = dateFormat(x.lastConnectedAt, 'dd-mm-yyyy hh:MM:ss');
      x.createdAt = dateFormat(x.createdAt, 'dd-mm-yyyy hh:MM:ss');
      x.updatedAt = dateFormat(x.updatedAt, 'dd-mm-yyyy hh:MM:ss');
      return x;
    });
    return CommonModule.FormatResponse(
      HttpStatus.OK,
      response.length > 0
        ? 'Connections fetched successfully!'
        : 'Connections not fetched!',
      response,
    );
  }

  async findAll(body: SearchHistoryConnectionV1Dto | SearchHistoryConnectionV1Dto | any): Promise<any[]> {
    const response = await this.ConnectionService.findAllHistory(body);
    response.map(x => { x.fromDate = dateFormat(x.fromDate, "dd-mm-yyyy"); x.toDate = dateFormat(x.toDate, "dd-mm-yyyy"); x.createdAt = dateFormat(x.createdAt, "dd-mm-yyyy hh:MM:ss"); x.updatedAt = dateFormat(x.updatedAt, "dd-mm-yyyy hh:MM:ss"); delete x.filePath; return x; });
    return CommonModule.FormatResponse(HttpStatus.OK, 'Connection history fetched successfully!', response);
  }
}
