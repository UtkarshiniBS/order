import { Controller, Get, Post, Body, Put, Param, Delete, HttpStatus, UseGuards, HttpCode, Req, Res, HttpException } from '@nestjs/common';
import { KrogerService } from './kroger.service';
import * as rawbody from 'raw-body';
import { CommonModule } from 'src/common/module/common-module';
const path = require('path');
const fs = require('fs');

@Controller()
export class KrogerCoreController {

    constructor(
        protected readonly krogerService: KrogerService
    ) { }

    getKrogerSubsidiary(@Res() res) {
        const uploadDirectory = process.cwd().replace(/src|modules|config|controller|v[0-50]/g, '').replace("dist", "");
        const filePath = path.join(uploadDirectory,'assets','kroger-subsidiary.html');
        let data = fs.readFileSync(filePath, { encoding: 'utf8' });
        res.status(HttpStatus.OK).send(CommonModule.FormatResponse(HttpStatus.OK, "List fetched successfully", { HTMLResponse: data }));
    }
    
    async updateKrogerSubsidiary(@Body() data,  @Req() req, @Res() res) {
        const uploadDirectory = process.cwd().replace(/src|modules|config|controller|v[0-50]/g, '').replace("dist", "");
        const filePath = path.join(uploadDirectory,'assets','kroger-subsidiary.html');
        try {
            if (req.readable) {
                const raw = await rawbody(req);
                const text = raw.toString().trim();
                fs.writeFileSync(filePath, text);
                res.status(HttpStatus.OK).send(CommonModule.FormatResponse(HttpStatus.OK, "Updated", text));
              } else {
                fs.writeFileSync(filePath, data);
                res.status(HttpStatus.OK).send(CommonModule.FormatResponse(HttpStatus.OK, "Updated", data));
            }
        } catch(e) {
            throw new HttpException(CommonModule.FormatErrorResponse(HttpStatus.BAD_REQUEST, e, null), HttpStatus.BAD_REQUEST);
        }
    }
}
