export enum API_VERSIONS {
    VERSION_1 = 'v1',
    VERSION_2 = 'v2',
}

export enum ALLOWED_PLATFORMS {
    AMAZON = 'amazon',
    INSTACART = 'instacart',
    WALMART = 'walmart',
    KROGER = 'kroger'
}

export enum ALL_PLATFORMS {
    AMAZON = 'amazon',
    INSTACART = 'instacart',
    WALMART = 'walmart',
    KROGER = 'kroger'
}

export enum ENTITY {
    ORDER_HISTORY = 'order_history',
    CONNECTION = 'connection',
    CONNECTION_HISTORY = 'connection_history',
    EVENT_LOG = 'event_log',
    ORDERS = 'orders',
}

export enum scrapingContext {
    ONLINE = 'online',
    FOREGROUND = 'foreground',
    BACKGROUND = 'background',
    MANUAL = 'manual'
  }