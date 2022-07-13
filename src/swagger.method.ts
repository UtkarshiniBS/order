import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AuthAdapter } from "./common/guard/dynamic-auth.guard";
import { API_VERSIONS } from "./app.models";
import { ConnectionV1Module } from "./modules/connection/modules/v1/connection-v1.module";
import { ConfigV1Module } from "./modules/config/modules/v1/config-v1.module";
import { DateRangeV1Module } from "./modules/date-range/modules/v1/date-range-v1.module";
import { PiiDetailsV1Module } from "./modules/pii_details/modules/v1/piiDetailsV1.module";
import { OrderHistoryV1Module } from "./modules/order_history/modules/v1/orderHistoryV1.module";
import { ScrappingV1Module } from "./modules/scraping/modules/v1/scraping-v1.module";
import { ConfigV2Module } from "./modules/config/modules/v2/config-v2.module";
import { ConnectionV2Module } from "./modules/connection/modules/v2/connection-v2.module";
import { DateRangeV2Module } from "./modules/date-range/modules/v2/date-range-v2.module";
import { OrderHistoryV2Module } from "./modules/order_history/modules/v2/orderHistoryV2.module";
import { PiiDetailsV2Module } from "./modules/pii_details/modules/v2/piiDetailsV2.module";
import { ScrappingV2Module } from "./modules/scraping/modules/v2/scraping-v2.module";
import { KrogerV2Module } from "./modules/kroger/modules/v2/kroger-v2.module";

export const VERSIONS = Object.values(API_VERSIONS);

function createSwaggerBuilder(title, desc, configService, versionNumber) {
    if(configService.get('AUTH_ADAPTER') === AuthAdapter.NCP_IRI) {
        return new DocumentBuilder()
        .setTitle(title)
        .setDescription(desc)
        .setVersion(`${versionNumber}.0`)
        .addServer(configService.get('SWAGGER_BASE_PATH'))
        .addBearerAuth({ type: 'http', name:'token', in: 'header' }, 'token')
        .addBearerAuth({ type: 'apiKey', name: 'panelist_id', in: 'header', bearerFormat: '' }, 'panelist_id')
        .build();
      }
      return new DocumentBuilder()
      .setTitle(title)
      .setDescription(desc)
      .setVersion(`${versionNumber}.0`)
      .addServer(configService.get('SWAGGER_BASE_PATH'))
      .addBearerAuth({ type: 'http', name:'token', in: 'header' }, 'token')
      .build();
}

function fallbackSwagger(versionNumber, configService) {
    const title = 'Amazon Orders History Scraping API';
    const desc = 'Amazon orders history scraping api service';
    return createSwaggerBuilder(title, desc, configService, versionNumber);
}

function SwaggerBuildConfig(version, configService) {
    const versionNumber = parseInt(version.charAt(version.length-1));
    if(version === API_VERSIONS.VERSION_1) {
        return fallbackSwagger(versionNumber, configService);
    }
    const title = 'Orders History Scraping API';
    const desc = 'Orders history scraping api service';
    return createSwaggerBuilder(title, desc, configService, versionNumber);
}

function getModuleScope(version) {
    if(version === API_VERSIONS.VERSION_1) {
        return {
            include: [OrderHistoryV1Module, PiiDetailsV1Module, DateRangeV1Module, ConfigV1Module, ConnectionV1Module, ScrappingV1Module],
        }
    }
    return {
        include: [
            ConnectionV2Module,
            DateRangeV2Module,
            ConfigV2Module,
            OrderHistoryV2Module,
            PiiDetailsV2Module,
            ScrappingV2Module,
            KrogerV2Module
        ],
    };
}

export function initSwagger(app, configService) {
    VERSIONS.forEach(version => {
        const document = SwaggerModule.createDocument(app, SwaggerBuildConfig(version, configService), getModuleScope(version) );
        if(version === API_VERSIONS.VERSION_1) {
            SwaggerModule.setup(`api`, app, document);
        }
        SwaggerModule.setup(`api/${version}`, app, document);
        // if (['development', 'staging'].includes(configService.nodeEnv)) {
        // }
    })
}