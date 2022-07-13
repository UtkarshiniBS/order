(async () => {
    const InstacartScript = async function () {
        const LISTING_WORKFLOW = 'listing';
        const DETAILS_WORKFLOW = 'details';
        const WORK_FLOW_DATA = 'workFlowData';
        const CONFIG_DATA = 'configData';
        let mockStorage = {};
        /**
         * Check if storage is supported
         */
        const isStorageSupported = function (getStorage) {
            try {
                const key = "DummyKey";
                getStorage().setItem(key, key);
                getStorage().removeItem(key);
                return true;
            } catch (e) {
                return false;
            }
        }

        /**
         * Get data from local storage
         */
        const getStorage = function (key) {
            if (mockStorage[key]) {
                return JSON.parse(mockStorage[key]);
            }
            return null;
        };

        /**
         * Set data from local storage
         */
        const setStorage = function (key, value) {
            mockStorage[key] = JSON.stringify(value);
        };

        /**
         * Checks if local storage has key
         */
        const hasStorage = function (key) {
            return mockStorage[key] ? true : false;
        };

        /**
         * Delete all relevant data from storage
         */
        const deleteAllStorage = function () {
            mockStorage = {};
            // localStorage.removeItem(WORK_FLOW_DATA);
            // localStorage.removeItem(CONFIG_DATA);
        };

        /**
         * Events to SDK
         */
        const SDKEvent = {

            ORDER_LIST_TYPE: 'orderlist',
            ORDER_DETAIL_TYPE: 'orderdetails',

            callback: function (data) {
                const androidCallback = window.Android;
                if (typeof androidCallback != "undefined") {
                    androidCallback.showToast(JSON.stringify(data));
                    if(androidCallback.jsCallback) {
                        androidCallback.jsCallback(JSON.stringify(data));
                    }
                }
                if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.iOS) {
                    window.webkit.messageHandlers.iOS.postMessage(JSON.stringify(data));
                }
            },

            error: function (errorMsg, type) {
                const rType = type === LISTING_WORKFLOW ? this.ORDER_LIST_TYPE : this.ORDER_DETAIL_TYPE;
                const obj = { type: rType, status: 'failed', isError: true, message: null, data: null };
                obj.errorMessage = errorMsg;
                console.log('Error callback');
                this.callback(obj);
            },

            success: function (scrappingData, type) {
                const rType = type === LISTING_WORKFLOW ? this.ORDER_LIST_TYPE : this.ORDER_DETAIL_TYPE;
                const obj = { type: rType, status: 'success', isError: false, errorMessage: null };
                obj.data = scrappingData;
                obj.message = 'Page Scrapped Successfully';
                console.log('success data ', obj);
                this.callback(obj);
            },

            log: function (logString, type) {
                const rType = type === LISTING_WORKFLOW ? this.ORDER_LIST_TYPE : this.ORDER_DETAIL_TYPE;
                const obj = { type: rType, status: 'log', isError: false, errorMessage: null, data: null };
                obj.message = logString;
                console.log(logString);
                this.callback(obj);
            }
        };

        /**
         * Check for which flow of scrapping is required
         * Also check if the flow is already started & its continuing
         */
        const checkForWorkflow = function () {
            let workFlowData = null;
            if (hasStorage(WORK_FLOW_DATA)) {
                workFlowData = getStorage(WORK_FLOW_DATA);
                SDKEvent.log(`Workflow already has data in storage '${JSON.stringify(workFlowData)}`, workFlowData.type);
            } else {
                workFlowData = window.inputData || inputData;
                setStorage(WORK_FLOW_DATA, workFlowData);
                SDKEvent.log(
                    `Workflow data not in storage - Save from local variable ${JSON.stringify(workFlowData)}`, workFlowData.type
                );
            }
            return workFlowData ? workFlowData.type : null;
        };

        /**
         * Frame Scrapping configuration data based on workflow type
         */
        const frameScrappingConfigData = function (workFlowType) {
            if (!workFlowType) {
                throw new Error('Validation error, key `type` in inputData is missing');
            }
            if (hasStorage(CONFIG_DATA)) {
                const config = getStorage(CONFIG_DATA);
                SDKEvent.log(`Config data is already in storage '${JSON.stringify(config)}`, workFlowType);
                return config;
            }
            switch (workFlowType) {
                case LISTING_WORKFLOW:
                    return listingScrapper.frameData();
                case DETAILS_WORKFLOW:
                    return detailsScrapper.frameData();
                default:
                    return;
            }
        };

        /**
         * Process workflow for based on scrapping type
         */
        const processWorkflow = function (configData) {
            const type = configData.type;
            console.log('sdfsf ', configData)
            switch (type) {
                case LISTING_WORKFLOW:
                    return listingScrapper.processWorkflow(configData);
                case DETAILS_WORKFLOW:
                    return detailsScrapper.processWorkflow(configData);
                default:
                    SDKEvent.log('Process workflow - config type not matched', type);
                    return false;
            }
        };

        /**
         * Format Date object to the Date text
         */
        const formatDate = function (date) {
            const fDate = new Date(date);
            return `${fDate.getMonth() + 1}/${fDate.getDate()}/${fDate.getFullYear()}`;
        };

        /**
         * Extract date from given string
         */
        const extractDateString = function (dateString) {
            const regex = /[A-Z][a-z]{2,3} [0-9]{1,2}[,]? (20)[0-9]{2}/;
            const dateStr = dateString.match(regex);
            return dateStr && dateStr.length ? dateStr[0] : null;
        };

        /**
         * Wrapper to get Dom Element
         */
        const getElement = async function (querySelector, isArray, waitUntilLoaded, scope) {
            const timeoutValue = 30000; // 30 sec
            const interval = 100;
            let timer = 0;
            let condition;
            scope = scope || document;
            isArray = isArray || false;
            if(waitUntilLoaded) {
                condition = isArray ? scope.querySelectorAll(querySelector).length != 0 : !scope.querySelector(querySelector);
            } else {
                condition = isArray ? scope.querySelectorAll(querySelector).length : scope.querySelector(querySelector);
            }
            while (condition) {
                await new Promise(r => setTimeout(r, interval));
                timer += interval;
                if (timer >= timeoutValue) {
                    const textO = `timedout for querySelector ${querySelector} for array ${isArray} in scope ${scope}`
                    console.log(textO);
                    await Promise.reject(new Error(textO))
                    // return undefined;
                }
                condition = isArray ? scope.querySelectorAll(querySelector).length : scope.querySelector(querySelector);
            }
            return isArray ? scope.querySelectorAll(querySelector) : scope.querySelector(querySelector);
        }

        /**
         * Main Details Scrapper Object,
         * All scrapping functionality on Order Details is handled here
         */
        const detailsScrapper = {
            SUMMARY_HEADER: 'order totals',
            SHIPMENT_HEADER: 'delivery details',
            REFUND_HEADER: 'refund',

            /**
             * Process Details workflow for initalizing scraping
             */
            processWorkflow: function (configData) {
                console.log(configData)
                const rawURL = configData.detailsUrl.split('/');
                rawURL.pop();
                const detailsUrl = rawURL.join('/').trim().toLowerCase();
                if (!window.location.href.includes(detailsUrl)) {
                    const message = `This is Not Details URL, Current URL is ${window.location.href} configured Detail URL is ${detailsUrl}`;
                    SDKEvent.log(message, configData.type);
                    throw new Error(message);
                    // return false;
                }
                return true;
            },

            /**
             * Get & process Details data from workFlowData
             */
            frameData: function () {
                const data = { scrappingData: {} };
                const workFlowData = getStorage(WORK_FLOW_DATA);
                data.type = workFlowData.type;
                data.detailsUrl = workFlowData.detailsUrl;
                data.orderId = workFlowData.orderId;
                data.orderDate = workFlowData.orderDate;
                setStorage(CONFIG_DATA, data);
                return data;
            },

            /**
             * Validate if order details UI selector & provides shiping item selectors
             */
            validateDetailPreScrapping: function (configData) {
                let isValid = false;
                const _this = this;
                const allHeaders = [];
                const orderDetailsSelector = document.querySelector('h3.a-size-large.a-spacing-micro');
                if (!orderDetailsSelector) {
                    SDKEvent.log('Order Details Selector not available', configData.type);
                    return null;
                }
                if (orderDetailsSelector.textContent.trim().indexOf(this.DETAILS_HEADER) <= -1) {
                    SDKEvent.log('Order Details Selector not available', configData.type);
                    return null;
                }
                const testHeaders = [this.SUMMARY_HEADER];
                const selector = document.querySelectorAll('.a-section .a-box-title');
                selector.forEach(function (el) {
                    const text = el.textContent.trim().toLowerCase();
                    if (text.indexOf(_this.SHIPMENT_HEADER) > -1) {
                        isValid = true;
                    } else if (text.indexOf(_this.REFUND_HEADER) > -1) {
                        isValid = true;
                    } else {
                        allHeaders.push(text);
                    }
                });
                const hitMatches = allHeaders.filter(function (header) {
                    return testHeaders.includes(header);
                });
                console.log('Headers validated', hitMatches);
                if (hitMatches.length && isValid) {
                    return true;
                } else {
                    return false;
                }
            },

            /**
             * Scrapping Details page sub section
             */
            detailsSection: {
                DELIVERED: 'Delivered',
                DELIVERY: 'Delivery',
                PICKUP: 'Pickup',
                REFUNDED: 'Refunded',
                REPLACED: 'Replacement',
                DELIVERY_SECTION: 'delivery details',

                detailsPageSelector: {
                    itemsBlockSelector: '[class*="DeliveryStatusPage"]',
                    itemsSelector: 'li[class*="DeliveryItemDetails"]',
                    orderStatusHeader: '[data-testid="order-delivery-summary-header-test-id"] h1',
                    itemIterator: 'ul.order-item-list li',
                    itemTitle: '.order-status-item-details h5',
                    itemPriceSection: '.order-status-item-details p',
                    itemQuantity: '.order-status-item-qty p',
                    itemTotalPrice: '[data-testid="itemTotalPrice"] p',
                    itemStrikeOutPrice: '[data-testid="itemTotalPrice"] del',
                    itemActualPrice: '[data-testid="itemTotalPrice"] div',
                    retailerName: '[data-testid="pickup-location-name-text"] p',
                    retailerNamePickup: '.order-summary-header h3',
                    orderStatusTime: '.order-info-heading-wrapper p',
                    orderSummary: '.order-summary-totals tr'
                },

                /**
                 * Details page `Order item details` block
                 */
                viewDetailsBlock: function (data, blocks, parentRef) {
                    const _this = this;
                    data['orderStatus'] = blocks[0].querySelector('h1').textContent;
                    // Items List
                    blocks[0].querySelectorAll('main > div').forEach(function(el) {
                        const textEl = el.querySelector('h3') || el.querySelector('h2');
                        const text = textEl.textContent.toLowerCase().trim();
                        if(text.indexOf('refund') > -1) {
                            const refundEl =  el.nextElementSibling;
                            const refundBlock = refundEl.querySelectorAll(_this.detailsPageSelector.itemsSelector);
                            data['refundItems'] = _this.getItemBlock(refundBlock, _this.REFUNDED);
                        } else if(text.indexOf('replacement') > -1) {
                            const refundEl =  el.nextElementSibling;
                            const replacedBlock = refundEl.querySelectorAll(_this.detailsPageSelector.itemsSelector);
                            data['replacedItems'] = _this.getItemBlock(replacedBlock, _this.REPLACED);
                        } else if(text.indexOf('items') > -1) {
                            const itemsEl =  el.nextElementSibling;
                            const elementBlock = itemsEl.querySelectorAll(_this.detailsPageSelector.itemsSelector)
                            data['items'] = _this.getItemBlock(elementBlock, _this.DELIVERED);
                        } 
                    });
                    data.orderStatusTime = this.shipmentBlock(parentRef.SHIPMENT_HEADER);
                    data.orderSummary = this.summaryBlock(parentRef.SUMMARY_HEADER);
                    data.retailerName = this.getRetailerName(_this.DELIVERY_SECTION);
                    data.orderType = this.DELIVERY;
                    const allEl = Array.from(blocks[1].querySelectorAll('p'))
                    const payment = allEl.filter(el => el.textContent.toLowerCase().trim().indexOf('paid with') > -1);
                    if(payment.length) {
                        data.paymentMethod = payment[0].textContent.trim().replace(/[0-9]/g, '');
                    }
                    return data;
                },

                /**
                 * Details page `Order item details` block for pickup orders
                 */
                viewDetailsBlockPickUpOrders: function (data) {
                    const _this = this;
                    data['orderStatus'] = document.querySelector(this.detailsPageSelector.orderStatusHeader).textContent.trim();
                    const itemIterator = Array.from(document.querySelectorAll(this.detailsPageSelector.itemIterator));
                    data['items'] = _this.getItems(itemIterator, _this.DELIVERED);
                    data['orderStatusTime'] = document.querySelector(this.detailsPageSelector.orderStatusTime).textContent.trim();
                    const orderSummary = Array.from(document.querySelectorAll(this.detailsPageSelector.orderSummary));
                    orderSummary.pop();
                    data['orderSummary'] = {};
                    data.orderType = this.PICKUP;
                    const retailerNameEl = document.querySelector(this.detailsPageSelector.retailerNamePickup);
                    data.retailerName = retailerNameEl ? retailerNameEl.textContent.trim() : null;
                    if(data.retailerName && data.retailerName.indexOf('Summary') > -1) {
                        data.retailerName = data.retailerName.replace('Summary', '').trim();
                    } else {
                        data.retailerName = document.querySelector(this.detailsPageSelector.retailerName).textContent.trim();
                    }                    
                    orderSummary.forEach(el => {
                        const summaryKey = el.querySelectorAll('td')[0].textContent.trim();
                        const summaryValue = el.querySelectorAll('td')[1].textContent.trim();
                        data['orderSummary'][summaryKey] = summaryValue;
                    });
                    return data;
                },

                /**
                 * Details page `retailer name` 
                 */
                 getRetailerName: function (deliverSection) {
                    let allSectionHeads = Array.from(document.querySelectorAll('section'));
                    const deliverySection = allSectionHeads.filter(function(value) {
                        const header = value.querySelector('h3');
                        if(header) {
                            return header.textContent.toLowerCase().trim() === deliverSection;
                        }
                        return false;
                    });
                    if(deliverySection && deliverySection.length) {
                        let allPara = deliverySection[0].querySelectorAll('p');
                        if(allPara && allPara.length) {
                            return allPara[0].textContent.trim();
                        }
                    }
                    return null;
                },

                /**
                 * Details page `Shipment Details` block
                 */
                shipmentBlock: function (shipmentHeader) {
                    const item = Array.from(document.querySelectorAll('h3'))
                    .filter(el => {
                        const text = el.textContent.toLowerCase().trim();
                        if(text === shipmentHeader) {
                            return true;
                        }
                    });
                    if(item.length) {
                        const allTexts = item[0].closest('section').querySelectorAll('p');
                        if(allTexts.length) {
                            return allTexts[1].textContent.trim();
                        }
                    }
                    return;
                },

                /**
                 * Details page `Order Summary` block
                 */
                summaryBlock: function (summaryHeader) {
                    const orderSummary = {};
                    const blocks = document.querySelectorAll(this.detailsPageSelector.itemsBlockSelector);
                    blocks.forEach(function(element){
                        const head = element.querySelector('h2');
                        const summaryElements = [];
                        if(head) {
                            const text = head.textContent.toLowerCase().trim();
                            if(text === summaryHeader){
                                let nextSibling = head.nextElementSibling;
                                // New version of instacart - 10th June 2022
                                const summaryEls = element.querySelectorAll('ul li');
                                if(summaryEls.length) {
                                    summaryEls.forEach(function(el) {
                                        var summaryItemRow = el.querySelectorAll('p');
                                        if(summaryItemRow.length > 1) {
                                            const summaryKey = summaryItemRow[0].textContent.trim();
                                            orderSummary[summaryKey] = summaryItemRow[1].textContent.trim();
                                        }
                                    });
                                } else if(nextSibling.tagName === 'DIV') {
                                    // older version of instacart
                                    while(nextSibling) {
                                        if(nextSibling.tagName === 'DIV'){
                                            summaryElements.push(nextSibling)
                                        }
                                        nextSibling = nextSibling.nextElementSibling;
                                    }
                                    summaryElements.forEach(function(el){
                                        const element = el.querySelectorAll('p');
                                        const summaryKey = element[0].textContent.trim();
                                        orderSummary[summaryKey] = element[1].textContent.trim();
                                    })
                                } else {
                                    throw new Error('Cannot find Summary elements');
                                }
                            }
                        } 
                    });
                    return orderSummary;
                },

                /**
                 * Details page `items` block
                 */
                getItemBlock: function (itemElements, itemStatus) {
                    // document.querySelectorAll(this.detailsPageSelector.itemsSelector)
                    const data = [];
                    itemElements.forEach(el => {
                        const item = {};
                        let detailsBlock = Array.from(el.querySelectorAll('p'));
                        const qtyButton =  el.querySelector('button');
                        console.log('Detilas blok', detailsBlock);

                        if(qtyButton) {
                            detailsBlock.splice(2,0, qtyButton)
                        }
                        item['itemStatus'] = itemStatus;
                        item['itemTitle'] = detailsBlock[0].textContent.trim();
                        let unitPriceBlock= detailsBlock[1];
                        unitPriceBlock = unitPriceBlock.textContent.toLowerCase().trim();
                        item['itemUnitPrice'] = unitPriceBlock.split("•")[0].trim();
                        item['itemPackageUnit'] = unitPriceBlock.split("•")[1].trim();
                        item['itemQuantity'] = detailsBlock[2].textContent.trim();
                
                        if(detailsBlock[4]) {
                            item['itemPrice'] = detailsBlock[3].textContent.trim();
                            item['itemStrikeoutPrice'] = detailsBlock[4].textContent.trim();
                        } else {
                            item['itemPrice'] = detailsBlock[3].textContent.trim();
                        }
                        data.push(item);
                    });
                    return data;
                },

                /**
                 * Details page `items` block for pickup delivery
                 */
                getItems: function (itemElements, itemStatus) {
                    const data = [];
                    itemElements.forEach(el => {
                        const item = {};
                        item['itemStatus'] = itemStatus;
                        item['itemTitle'] = el.querySelector(this.detailsPageSelector.itemTitle).textContent.trim();
                        unitPriceBlock = el.querySelector(this.detailsPageSelector.itemPriceSection).textContent.toLowerCase().trim();
                        item['itemUnitPrice'] = unitPriceBlock.split("·")[0].trim();
                        item['itemPackageUnit'] = unitPriceBlock.split("·")[1].trim();
                        item['itemQuantity'] = el.querySelector(this.detailsPageSelector.itemQuantity).textContent.trim();
                        const strikeOutPrice = el.querySelector(this.detailsPageSelector.itemStrikeOutPrice);
                        if(strikeOutPrice) {
                            item['itemPrice'] = el.querySelector(this.detailsPageSelector.itemActualPrice).textContent.trim();
                            item['itemStrikeoutPrice'] = strikeOutPrice.textContent.trim();
                        } else {
                            item['itemPrice'] = el.querySelector(this.detailsPageSelector.itemTotalPrice).textContent.trim();
                        }
                        data.push(item);
                    });
                    return data;
                },

            },

            /**
             * Wait for all the elements in detail page to load
            */
            detailPageLoad: async function () {
                await getElement('.ic-loading', true, false);
                await getElement('div[style*="radium-animation"]', true, false);
            },

            /**
             * Order Details scrapper wrapper fucntion
             */
            doScrapping: function () {
                const configData = getStorage(CONFIG_DATA);
                const data = { orderId: configData.orderId, orderDate: configData.orderDate };
                const blocks = document.querySelectorAll(this.detailsSection.detailsPageSelector.itemsBlockSelector);
                if(blocks.length) {
                    return this.detailsSection.viewDetailsBlock(data, blocks, this); 
                } else {
                    // Order detail page in differen format (picked up orders)
                    return this.detailsSection.viewDetailsBlockPickUpOrders(data); 
                }
                // SDKEvent.log('After view details scrapping', configData.type);
                return data;
            },

            /**
             * Entry point for Details page scrapping
             */
            scrape: async function (configData) {
                await this.detailPageLoad();
                const detailsData = this.doScrapping();
                const cloneConfig = Object.assign({}, configData);
                cloneConfig.scrappingData = detailsData;
                SDKEvent.log(`Order details Scrapped for the order`, configData.type);
                setStorage(CONFIG_DATA, cloneConfig);
                return detailsData;
            },

            /**
             * Post Process Details data after scrapping
             */
            processData: function (configData) {
                const cloneConfig = Object.assign({}, configData);
                const detailsData = cloneConfig.scrappingData;
                SDKEvent.log(`Start Post Processing the details data`, configData.type);
                if(detailsData.refundItems && detailsData.refundItems.length) {
                    detailsData.refundItems.forEach(function (refundItem) {
                        detailsData.items.push(refundItem);
                    });
                }
                if(detailsData.replacedItems && detailsData.replacedItems.length) {
                    detailsData.replacedItems.forEach(function (replacedItem) {
                        detailsData.items.push(replacedItem);
                    });
                }
                delete detailsData.refundItems;
                delete detailsData.replacedItems;
                SDKEvent.log(`End Post Processing the details data`, configData.type);
                cloneConfig.scrappingData = detailsData;
                setStorage(CONFIG_DATA, cloneConfig);
                return cloneConfig;
            },

            /**
             * Initalize Scrapping
             */
            initScrapping: async function (configData) {
                try {
                    await detailsScrapper.scrape(configData);
                    configData = getStorage(CONFIG_DATA);
                    SDKEvent.log(`Details Scrapping is complete, Total - ${configData.scrappingData.length}`, configData.type);
                    configData = detailsScrapper.processData(configData);
                    SDKEvent.log(`Processing is complete, Total - ${configData.scrappingData.length}`, configData.type);
                    const cloneConfig = Object.assign({}, configData);
                    deleteAllStorage();
                    SDKEvent.success(cloneConfig.scrappingData, configData.type);
                } catch (e) {
                    throw e;
                }
                return configData.type;
            }
        }

        /**
         * Main Listing Scrapper Object,
         * All scrapping functionality on Order listing is handled here
         */
        const listingScrapper = {
            /**
             * Checks if item is loaded by listening to Loader style changes
             */
            isItemsLoaded: async function () {
                const configData = getStorage(CONFIG_DATA);
                return new Promise((res, rej) => {
                    let timeout = 0;
                    SDKEvent.log('Start of promise if part is loaded', configData.type);
                    const interval = setInterval(() => {
                        timeout += 100;
                        if (timeout >= 8000) {
                            rej('Timeout');
                            clearInterval(interval);
                            SDKEvent.log('Loading failed - Timeout', configData.type);
                            return;
                        }
                        const loaderEl = document.querySelectorAll(
                            '.a-row.loading-spinner',
                        )[1];
                        if(loaderEl) {
                            if (!loaderEl.hasAttribute('style')) {
                                res(true);
                                clearInterval(interval);
                                SDKEvent.log('Loaded success isItemLoaded - NO styles', configData.type);
                                return;
                            }
                            const loaderStyle = loaderEl
                                .getAttribute('style')
                                .split(':')[1]
                                .trim()
                                .slice(0, -1);
                            if (loaderStyle == 'none') {
                                res(true);
                                clearInterval(interval);
                                SDKEvent.log('Loaded success isItemLoaded', configData.type);
                                return;
                            }
                        }
                    }, 100);
                });
            },

            /**
             * Get & process Listing data from workFlowData
             */
            frameData: function () {
                const data = { scrappingData: [] };
                const workFlowData = getStorage(WORK_FLOW_DATA);
                data.type = workFlowData.type;
                data.url = workFlowData.urls.listing;
                data.detailsUrl = workFlowData.urls.details;
                data.startDate = workFlowData.startDate;
                data.endDate = workFlowData.endDate;
                const startYear = parseInt(
                    workFlowData.startDate.substr(workFlowData.startDate.length - 4),
                );
                const endYear = parseInt(
                    workFlowData.endDate.substr(workFlowData.endDate.length - 4),
                );
                setStorage(CONFIG_DATA, data);
                return data;
            },

            /**
             * Process Listing workflow for initalizing scraping
             */
            processWorkflow: function (configData) {
                const listingUrl = configData.url
                    .split('?')[0]
                    .trim()
                    .toLowerCase();
                if (!window.location.href.includes(listingUrl)) {
                    const message = `This is Not Listing URL, Current URL is ${window.location.href} configured Listing URL is ${listingUrl}`;
                    SDKEvent.log(message, configData.type);
                    throw new Error(message);
                    // return false;
                }
                return true;
            },
           

            /**
             * Validate if order listing UI selector is updated
             */
            validateListingPreScrapping: function () {
                let isValid = true;
                const configData = getStorage(CONFIG_DATA);
                const orderListingSelector = document.querySelector(
                    '#ordersContainer .a-padding-small.js-item',
                );
                if (!orderListingSelector) {
                    SDKEvent.log('No order data for the year', configData.type);
                    isValid = false;
                }
                const orderList = document.querySelectorAll(
                    '#ordersContainer .a-padding-small.js-item'
                );
                if (!orderList.length) {
                    SDKEvent.log('No order data for the year', configData.type);
                    isValid = false;
                }
                return isValid
            },

            /**
             * Post process scrappped data
             */
            processData: function (configData) {
                const returnData = [];
                SDKEvent.log('Start of Processing', configData.type);
                configData.scrappingData.sort(function (a, b) {
                    return new Date(a.orderDate) - new Date(b.orderDate);
                });
                SDKEvent.log(`Processing - Data after Sorting by Date, Total - ${configData.scrappingData.length}`, configData.type);
                const getUniqueListBy = function (arr, key) {
                    return [...new Map(arr.map(item => [item[key], item])).values()]
                }
                configData.scrappingData = getUniqueListBy(configData.scrappingData, 'orderId');
                SDKEvent.log(`Processing - After removing duplicate orderIds, Total - ${configData.scrappingData.length}`, configData.type);
                const workFlowData = getStorage(WORK_FLOW_DATA);
                const startDateSting = workFlowData.startDate.split("-");
                const startDate = new Date(startDateSting[2], startDateSting[1] - 1, startDateSting[0]);
                startDate.setHours(0, 0, 0, 0);
                const endDateString = workFlowData.endDate.split("-");
                const endDate = new Date(endDateString[2], endDateString[1] - 1, endDateString[0]);
                endDate.setHours(23, 59, 59, 999);
                configData.scrappingData = configData.scrappingData.filter((data) => {
                    const itemDate = new Date(data.orderDate);
                    // SDKEvent.log(`Data format for each item, ${startDate}, ${endDate}, ${itemDate}`, configData.type);
                    return itemDate >= startDate && itemDate <= endDate;
                });
                SDKEvent.log(`Processing - Orders removed based on date range, Total - ${configData.scrappingData.length}`, configData.type);
                for (let index = 0; index < configData.scrappingData.length; index++) {
                    const item = configData.scrappingData[index];
                    const detailsUrl = configData.detailsUrl.replace('${orderId}', item.orderId);
                    returnData.push({
                        orderId: item.orderId,
                        orderDate: item.orderDate,
                        detailsUrl: detailsUrl
                    });
                }
                configData.scrappingData = returnData;
                setStorage(CONFIG_DATA, configData);
                SDKEvent.log('End of Processing', configData.type);
                return configData;
            },

            /**
             * Recursively loads item until all order items for the date range is loaded
             */
            waitToLoadItems: async function (configData) {
                const delay = function (ms) {
                    return new Promise(resolve => setTimeout(() => resolve(), ms));
                };
                console.log('config json ', JSON.stringify(configData));
                const checkForRange = function () {
                    const items = document.querySelectorAll('#icOrdersList ul li');
                    if(!items.length) return false;
                    const lastItem = items[items.length - 1];
                    if(!lastItem) return false;
                    let orderDate = lastItem.querySelectorAll('p')[1].textContent.trim();
                    orderDate = new Date(extractDateString(orderDate));
                    const startDateSting = configData.startDate.split("-");
                    const startDate = new Date(startDateSting[2], startDateSting[1] - 1, startDateSting[0]);
                    startDate.setHours(0, 0, 0, 0);
                    const endDateString = configData.endDate.split("-");
                    const endDate = new Date(endDateString[2], endDateString[1] - 1, endDateString[0]);
                    endDate.setHours(23, 59, 59, 999);
                    return orderDate >= startDate && orderDate <= endDate;
                };
                SDKEvent.log('Start of promise to load all items', configData.type);
                let atBottom = false;
                while (!atBottom) {
                    const orderListButton = Array.from(document.querySelectorAll('#icOrdersList button'))
                        .filter(function (el) {
                            const text = el.textContent.toLowerCase().trim();
                            if (text === 'load more orders') {
                                return true;
                            }
                        });
                    if (orderListButton.length) {
                        document.documentElement.scrollTo(0, document.body.scrollHeight);
                        orderListButton[0].click();
                        await delay(50);
                        await this.listingPageLoad();
                        await delay(50);
                        atBottom = !checkForRange();
                    } else {
                        atBottom = true;
                    }
                }
                SDKEvent.log('End loading all items', configData.type);
                return;
            },

            /**
             * Wait for all the elements in listing page to load
            */
            listingPageLoad: async function () {
                await getElement('.ic-loading', true, false);
            },

            /**
             * Scrapes all order items in the listing page
             */
            scrapeItems: function () {
                const data = [];
                const ordersList = Array.from(document.querySelectorAll('#icOrdersList ul li'));
                for (let index = 0; index < ordersList.length; index++) {
                    const el = ordersList[index];                    
                    let orderId;
                    const orderDate = el.querySelectorAll('p')[1].textContent.trim();
                    const allAnchors = Array.from(el.querySelectorAll('a'));
                    const itemListInfoLength = el.querySelectorAll('p').length;
                    if(itemListInfoLength > 6) {
                        // indicates for additional info in the list
                        const canceledOrders = Array.from(el.querySelectorAll('p')).filter(function(listInfo) { return listInfo.textContent.trim().toLowerCase() === 'canceled' })
                        // Skip canceled orders
                        if(canceledOrders.length) {
                            continue;
                        }
                    }
                    const detialLink = allAnchors.filter(function(anchor) {
                        if(anchor.textContent.trim().toLowerCase().includes('order detail')){
                            return true;
                        }
                    });
                    if(detialLink && detialLink.length){
                        const hrefRaw = detialLink[0].getAttribute('href');
                        const splitted = hrefRaw.split('/');
                        orderId = splitted[splitted.length -1];
                    }
                    data.push({
                        orderId: orderId,
                        orderDate: formatDate(extractDateString(orderDate))
                    });
                }
                document.querySelectorAll('#icOrdersList ul li').forEach(function(el){                 
                });
                return data;
            },

            /**
             * Listing scrapper wrapper fucntion
             */
            doScrapping: async function () {
                const configData = getStorage(CONFIG_DATA);
                // if (!this.validateListingPreScrapping()) {
                //     SDKEvent.log('Validation of order listing selector failed', configData.type);
                //     return [];
                // }
                await this.listingPageLoad();
                await this.waitToLoadItems(configData);
                SDKEvent.log('After Loading all items', configData.type);
                return this.scrapeItems();
            },

            /**
             * Entry point for listing scrapping
             */
            scrape: async function (configData) {
                const listingData = await this.doScrapping();
                const cloneConfig = Object.assign({}, configData);
                cloneConfig.scrappingData = listingData;
                SDKEvent.log(`Data Scrapped for Single Year ${configData.year}`, configData.type);
                setStorage(CONFIG_DATA, cloneConfig);
                SDKEvent.log('Get Scrapping data from local storage', configData.type);
                return listingData;
            },

            /**
             * Initalize Scrapping
             */
            initScrapping: async function (configData) {
                let listingData = null;
                try {
                    listingData = await listingScrapper.scrape(configData);
                    configData = getStorage(CONFIG_DATA);
                    SDKEvent.log(`Scrapping is complete, Total - ${configData.scrappingData.length}`, configData.type);
                    configData = listingScrapper.processData(configData);
                    SDKEvent.log(`Processing is complete, Total - ${configData.scrappingData.length}`, configData.type);
                    const cloneConfig = Object.assign({}, configData);
                    deleteAllStorage();
                    SDKEvent.success(cloneConfig.scrappingData, configData.type);
                    // alert(JSON.stringify(configData.scrappingData));
                } catch (e) {
                    throw e;
                }
                return configData.type;
            }
        };

        /**
         * On JS script initialization, init is called
         */
        const onInit = async function () {
            const workFlowType = checkForWorkflow();
            SDKEvent.log('On Initialtization - Script starts', workFlowType);
            let configData = frameScrappingConfigData(workFlowType);
            const shouldProcess = processWorkflow(configData);
            SDKEvent.log(`Should process scrapping ${shouldProcess}`, configData.type);
            if (shouldProcess) {
                if (configData.type === LISTING_WORKFLOW) {
                    const delay = function (ms) {
                        return new Promise(resolve => setTimeout(() => resolve(), ms));
                    };
                    await delay(2000);
                    return await listingScrapper.initScrapping(configData);
                } else if (configData.type === DETAILS_WORKFLOW) {
                    return await detailsScrapper.initScrapping(configData);
                }
            }
            return configData.type;
        };
        try {
            // Additional Check to see localStorage Support
            // if(!isStorageSupported(() => localStorage)) {
            //     throw new Error('Local Storage is not supported');
            // }
            const type = await onInit();
            SDKEvent.log(`Climax - Script Ends for ${type}`, type);
            console.timeEnd('JsScript');
            return type;
        } catch (e) {
            SDKEvent.error(`Unknown error type - ${e.stack}`, LISTING_WORKFLOW);
            SDKEvent.error(`Unknown error type - ${e.stack}`, DETAILS_WORKFLOW);
            deleteAllStorage();
            console.timeEnd('JsScript');
            throw e;
        }
    };
    console.time('JsScript');
    return await InstacartScript();
})();