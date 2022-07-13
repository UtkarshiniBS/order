(async () => {
    const AmazonScript = async function () {
        const LISTING_WORKFLOW = 'listing';
        const DETAILS_WORKFLOW = 'details';
        const WORK_FLOW_DATA = 'workFlowData';
        const CONFIG_DATA = 'configData';

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
            if (localStorage.getItem(key)) {
                return JSON.parse(localStorage.getItem(key));
            }
            return null;
        };

        /**
         * Set data from local storage
         */
        const setStorage = function (key, value) {
            localStorage.setItem(key, JSON.stringify(value));
        };

        /**
         * Checks if local storage has key
         */
        const hasStorage = function (key) {
            return localStorage.getItem(key) ? true : false;
        };

        /**
         * Delete all relevant data from storage
         */
        const deleteAllStorage = function () {
            localStorage.removeItem(WORK_FLOW_DATA);
            localStorage.removeItem(CONFIG_DATA);
        };

        /**
         * Converts string to `camelCase`
         */
        const camelize = function (str) {
            return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
                return index === 0 ? word.toLowerCase() : word.toUpperCase();
            }).replace(/\s+/g, '');
        }

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
                }
                // if(androidCallback.jsCallback != "undefined") {
                //     androidCallback.jsCallback(JSON.stringify(data));
                // }
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
            const regex = /[A-Z][a-z]{2,3} [0-9]{1,2}[,]? (20)[0-9]{2}|[0-3]?[0-9]-[A-Z][a-z]{2,3}-(20)[0-9]{2}|[0-9]{1,2} [A-Z][a-z]{2,20} (20)[0-9]{2}|[A-Z][a-z]{2,10} [0-9]{1,2}[,]? (20)[0-9]{2}|[A-Z][a-z]{2,5}[,] [A-Z][a-z]{2,3} [0-9]{2}|[A-Z][a-z]{2,3} [0-9]{1,2} - [A-Z][a-z]{2,3} [0-9]{1,2}|[A-Z][a-z]{0,20} date pending/;
            const dateStr = dateString.match(regex);
            return dateStr && dateStr.length ? dateStr[0] : null;
        };

        /**
         * Main Details Scrapper Object,
         * All scrapping functionality on Order Details is handled here
         */
        const detailsScrapper = {
            DETAILS_HEADER: 'order details',
            SHIPMENT_HEADER: 'shipment',
            SUMMARY_HEADER: 'order summary',
            PAYMENT_HEADER: 'payment',
            REFUND_HEADER: 'return',
            /**
             * Process Details workflow for initalizing scraping
             */
            processWorkflow: function (configData) {
                const detailsUrl = configData.detailsUrl
                    .split('?')[0]
                    .trim()
                    .toLowerCase();
                if (!window.location.href.includes(detailsUrl)) {
                    SDKEvent.log(`This is Not Details URL, Current URL is ${window.location.href} configured Detail URL is ${detailsUrl}`, configData.type);
                    throw new Error('Page loaded is different from the URL configured');
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
             * Fetch Selector for the relevant block
             */
            getDetailBlock: function (blockHeader) {
                let blockSelector = [];
                const selector = document.querySelectorAll('.a-section .a-box-title');
                selector.forEach(function (el) {
                    if (el.textContent.trim().toLowerCase().indexOf(blockHeader) > -1) {
                        blockSelector.push(el.parentElement);
                    }
                });
                return blockSelector.length > 1 ? blockSelector : blockSelector[0];
            },

            /**
             * Scrapping Details page sub section
             */
            detailsSection: {

                /**
                 * Details page `View Order details` block
                 */
                viewDetailsBlock: function (orderDetailsSelector) {
                    const data = {};
                    orderDetailsSelector.querySelectorAll('.a-box.a-vertical .a-unordered-list li .a-row').forEach(function (item, index) {
                        const orderDetailAttribute = item.querySelectorAll('.a-column')[0].textContent.trim();
                        switch (index) {
                            case 0:
                                const dateString = item.querySelectorAll('.a-column')[1].textContent.trim();
                                data[camelize(orderDetailAttribute)] = formatDate(extractDateString(dateString));
                                break;
                            case 1:
                                data['orderId'] = item.querySelectorAll('.a-column')[1].textContent.trim();
                                break;
                            case 2:
                                let index = -1;
                                const totalContainer = item.querySelector('#od-summary-content-total');
                                totalContainer.childNodes.forEach(function (value, key) {
                                    if (value.tagName && value.tagName.toLowerCase() === 'span') {
                                        index = key;
                                    }
                                });
                                if (totalContainer.childNodes[index]) {
                                    totalContainer.removeChild(totalContainer.childNodes[index]);
                                }
                                data[camelize(orderDetailAttribute)] = totalContainer.textContent.trim();
                                break;
                            default:
                                data[camelize(orderDetailAttribute)] = item.querySelectorAll('.a-column')[1].textContent.trim();
                                break;
                        }
                    });
                    return data;
                },

                /**
                 * Form Shipment Details
                 */
                formShipmentDetail: function (itemEl, shipping, index) {
                    const items = [];
                    if(!shipping.querySelector('h3')) {
                        return null;
                    }
                    const orderStatus = shipping.querySelector('h3').textContent.trim()
                    const orderStatusDate = shipping.querySelector('.a-color-success.a-text-bold') ? shipping.querySelector('.a-color-success.a-text-bold').textContent.trim() : "";
                    const shippingItems = itemEl.querySelectorAll(`.a-box-group .a-box:nth-last-child(${index}) .a-section.a-padding-none`);
                    shippingItems.forEach(function (item) {
                        const orderItem = {};
                        const orderItemBlocks = item.querySelectorAll('.a-column .a-row');
                        let itemQuantityBlock = orderItemBlocks[1];
                        let itemSellerBlock = orderItemBlocks[2];
                        let autoDeliveredBlock = null;
                        if(orderItemBlocks.length > 3) {
                            // Handle 'Contact Seller' button
                            if(!orderItemBlocks[3].querySelector('.a-button')) {
                                // Subscription item scenario
                                autoDeliveredBlock = orderItemBlocks[2];
                                itemSellerBlock = orderItemBlocks[3];
                            }
                        }
                        orderItem.itemStatus = orderStatus;
                        // orderItem.itemStatusDate = extractDateString(orderStatusDate) ? formatDate(extractDateString(orderStatusDate)) : orderStatusDate;
                        orderItem.itemStatusDate = orderStatusDate;
                        orderItem.itemUrl = window.location.origin + orderItemBlocks[0].querySelector('a').getAttribute('href');
                        orderItem.itemPrice = orderItemBlocks[0].querySelector('.a-column.a-text-right').textContent.trim();
                        orderItem.itemTitle = orderItemBlocks[0].querySelector('a').textContent.trim();
                        orderItem.itemQuantity = itemQuantityBlock.textContent.trim().split(':')[1].trim();
                        orderItem.itemSeller = itemSellerBlock.textContent.trim().split(':')[1].trim();
                        if(autoDeliveredBlock) {
                            orderItem.itemAutoDelivered = autoDeliveredBlock.textContent.trim().split(':')[1].trim();
                        }
                        items.push(orderItem);
                    });
                    return items;
                },

                /**
                 * Details page `Shipment Details` block
                 */
                shipmentBlock: function (shipmentElements) {
                    let items = [];
                    const _this = this;
                    if(!shipmentElements) {
                        return items;
                    }
                    let iterator = Array.isArray(shipmentElements) ? shipmentElements: [shipmentElements];
                    iterator.forEach(function (itemEl) {
                        let index = 1;
                        let shipping = null;
                        shipping = itemEl.querySelector(`.a-box-group .a-box:nth-last-child(${index}) .a-section h3`);
                        if (!shipping) {
                            // When shipping is not found at index 1 (Use Case: Approval)
                            shipping = itemEl.querySelector(`.a-box-group .a-box:nth-last-child(${index})`);
                            const itemLocal = _this.formShipmentDetail(itemEl, shipping, index);
                            if(itemLocal) {
                                items = items.concat(itemLocal);
                            }
                            index = 2;
                        }
                        shipping = itemEl.querySelector(`.a-box-group .a-box:nth-last-child(${index}) .a-section:first-child`);
                        if (!shipping) {
                            index = 3;
                        }
                        shipping = itemEl.querySelector(`.a-box-group .a-box:nth-last-child(${index}) .a-section:first-child`);
                        if (!shipping) {
                            index = 4;
                        }
                        shipping = itemEl.querySelector(`.a-box-group .a-box:nth-last-child(${index}) .a-section:first-child`);
                        if(shipping) {
                            const itemLocal = _this.formShipmentDetail(itemEl, shipping, index);
                            items = items.concat(itemLocal);
                        }
                    });
                    return items;
                },

                /**
                 * Details page `Order Summary` block
                 */
                summaryBlock: function (orderSummarySelector) {
                    const orderSummary = {};
                    const summaryItems = orderSummarySelector.querySelectorAll('li#od-subtotals .a-row')
                    summaryItems.forEach(function (item) {
                        const itemBlocks = item.querySelectorAll('.a-column');
                        const summaryKey = itemBlocks[0].textContent.trim();
                        const summaryValue = itemBlocks[1].querySelector('.a-text-right').textContent.trim();
                        orderSummary[summaryKey] = summaryValue;
                    });
                    return orderSummary;
                },

                /**
                 * Details page `Refund items` block
                 */
                refundBlock: function (refundElements) {
                    const items = [];
                    if(!refundElements) {
                        return items;
                    }
                    let iterator = Array.isArray(refundElements) ? refundElements: [refundElements];
                    iterator.forEach(function (itemEl) {
                        let shipping = itemEl.querySelector('.a-row.a-spacing-base');
                        const orderStatus = shipping.querySelector('h3').textContent.trim()
                        // const orderStatusDate = shipping.querySelector('.a-color-success.a-text-bold').textContent.trim()
                        const shippingItems = itemEl.querySelectorAll(`.a-section.a-padding-none`);
                        shippingItems.forEach(function (item) {
                            const orderItem = {};
                            const orderItemBlocks = item.querySelectorAll('.a-column .a-row');
                            orderItem.itemStatus = orderStatus;
                            // orderItem.itemStatusDate = formatDate(extractDateString(orderStatusDate));
                            orderItem.itemUrl = window.location.origin + orderItemBlocks[0].querySelector('a').getAttribute('href');
                            orderItem.itemPrice = orderItemBlocks[0].querySelector('.a-column.a-text-right').textContent.trim();
                            orderItem.itemTitle = orderItemBlocks[0].querySelector('a').textContent.trim();
                            orderItem.itemQuantity = orderItemBlocks[1].textContent.trim().split(':')[1].trim();
                            orderItem.itemSeller = orderItemBlocks[2].textContent.trim().split(':')[1].trim();
                            items.push(orderItem);
                        });
                    });
                    return items;
                },

            },

            /**
             * Order Details scrapper wrapper fucntion
             */
            doScrapping: function () {
                const configData = getStorage(CONFIG_DATA);
                const isValid = this.validateDetailPreScrapping(configData);
                if (!isValid) {
                    SDKEvent.log('Validation of order details selector failed', configData.type);
                    return {};
                }
                const orderDetailsSelector = document.querySelector('h3.a-size-large.a-spacing-micro').parentElement;
                const data = this.detailsSection.viewDetailsBlock(orderDetailsSelector);
                SDKEvent.log('After view details scrapping', configData.type);
                const shipmentElements = this.getDetailBlock(this.SHIPMENT_HEADER);
                data.items = this.detailsSection.shipmentBlock(shipmentElements);
                SDKEvent.log('After shippng scrapping', configData.type);
                const refundSelector = this.getDetailBlock(this.REFUND_HEADER);
                data.refundItems = this.detailsSection.refundBlock(refundSelector);
                SDKEvent.log(`After Refund section scrapping`,configData.type);
                const orderSummarySelector = this.getDetailBlock(this.SUMMARY_HEADER);
                data.orderSummary = this.detailsSection.summaryBlock(orderSummarySelector);
                const payemntSelector = this.getDetailBlock(this.PAYMENT_HEADER);
                const payEl = Array.from(payemntSelector.querySelectorAll('ul li'))[0];
                const paymentText = payEl.querySelector('div.a-section p');
                if(paymentText) {
                    data.paymentMethod = paymentText.textContent.replace(/[0-9]/g, '').trim();
                    SDKEvent.log(`After Payment section scrapping`,configData.type);
                }
                SDKEvent.log('After orderSummary scrapping', configData.type);
                return data;
            },

            /**
             * Entry point for Details page scrapping
             */
            scrape: function (configData) {
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
                delete detailsData.refundItems;
                SDKEvent.log(`End Post Processing the details data`, configData.type);
                cloneConfig.scrappingData = detailsData;
                setStorage(CONFIG_DATA, cloneConfig);
                return cloneConfig;
            },

            /**
             * Initalize Scrapping
             */
            initScrapping: function (configData) {
                try {
                    detailsScrapper.scrape(configData);
                    configData = getStorage(CONFIG_DATA);
                    SDKEvent.log(`Details Scrapping is complete, Total - ${JSON.stringify(configData.scrappingData)}`, configData.type);
                    configData = detailsScrapper.processData(configData);
                    // SDKEvent.log(`Processing is complete, Total - ${JSON.stringify(configData.scrappingData)}`, configData.type);
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
                    let listingScrollResponseTimeout = 20000;
                    SDKEvent.log('Start of promise if part is loaded', configData.type);
                    const interval = setInterval(() => {
                        timeout += 100;
                        if (timeout >= listingScrollResponseTimeout) {
                            rej(new Error('Listing items Timeout'));
                            clearInterval(interval);
                            SDKEvent.log('Loading failed - Timeout', configData.type);
                            return;
                        }
                        const loaderEl = document.querySelectorAll('.a-row.loading-spinner')[1];
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
                const startYear = parseInt(
                    workFlowData.startDate.substr(workFlowData.startDate.length - 4)
                );
                const endYear = parseInt(
                    workFlowData.endDate.substr(workFlowData.endDate.length - 4)
                );
                if (startYear === endYear) {
                    // Same year
                    data.isSinglePage = true;
                    data.year = startYear;
                } else {
                    // multiple years
                    data.isSinglePage = false;
                    data.yearList = [];
                    for (var i = startYear; i <= endYear; i++) {
                        data.yearList.push(i);
                    }
                }
                setStorage(CONFIG_DATA, data);
                return data;
            },

            processWorkflowRedirection: function (configData, filter) {
                const url = configData.url.replace('${filter}', filter);
                if (window.location.href.indexOf(filter) <= -1) {
                    SDKEvent.log(
                        `Redirect with ${configData.yearList && configData.yearList.length ? configData.yearList.length[0] : configData.year} for ${filter}`,
                        configData.type
                    );
                    window.location.href = url;
                    return false;
                }
                return true;
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
                    // TEMPORARY condition for sample testable app
                    if (window.location.href.includes(`gp/your-account/order-history`)) {
                        SDKEvent.log('Continue the process to redirect to correct URL', configData.type);
                        window.location.href = configData.url;
                        return false;
                    }
                    SDKEvent.log(`This is Not Listing URL, Current URL is ${window.location.href} configured listing URL is ${listingUrl}`, configData.type);
                    throw new Error('Page loaded is different from the URL configured');
                    // return false;
                }
                const workflow = getStorage(WORK_FLOW_DATA);
                const startDateSting = workflow.startDate.split("-");
                const startDateObj = new Date(startDateSting[2], startDateSting[1] - 1, startDateSting[0]);
                const diffTime = Math.abs(new Date() - startDateObj);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays <= 30) {
                    SDKEvent.log('Process listing for last 30 days', configData.type);
                    return this.processWorkflowRedirection(configData, 'last30');
                }
                else if (diffDays <= 180) {
                    SDKEvent.log('Process listing for last 6 months', configData.type);
                    return this.processWorkflowRedirection(configData, 'months-6');
                }
                else {
                    if (configData.isSinglePage) {
                        SDKEvent.log('Process listing for single year', configData.type);
                        return this.processWorkflowRedirection(configData, `year-${configData.year}`);
                    } else {
                        if (configData.yearList.length) {
                            SDKEvent.log(`Process listing for multiple years ${configData.yearList}`, configData.type);
                            return this.processWorkflowRedirection(configData, `year-${configData.yearList[0]}`);
                        } else {
                            return true;
                        }
                    }
                }
            },

            /**
             * Recursively loads item until all order items are loaded
             */
            waitToLoadAllItems: async function () {
                const configData = getStorage(CONFIG_DATA);
                SDKEvent.log('Start of promise to load all items', configData.type);
                let atBottom = false;
                while (!atBottom) {
                    window.scrollTo(0, document.body.scrollHeight);
                    await this.isItemsLoaded();
                    const isLast =
                        window.innerHeight + window.scrollY + 1 >=
                        document.body.offsetHeight;
                    atBottom = isLast;
                }
                SDKEvent.log('End loading all items', configData.type);
                return;
            },
            
            /**
             * Recursively loads item until all order items are loaded based on Alternative method by item count
             */
            waitToLoadAllItemsByItemCount: async function (type) {
                const delay = function(ms) {
                    return new Promise(resolve => setTimeout(() => resolve(), ms));
                };
                const scrollPaddingConstant = 20;
                SDKEvent.log('Start of promise to load all items', type);
                let atBottom = false;
                while (!atBottom) {
                    let itemAll = document.querySelectorAll('#ordersContainer .a-section.a-padding-small.js-item');
                    const footerItem = document.querySelector('footer');
                    const before = itemAll.length;
                    // document.documentElement.scrollTo(0, document.body.offsetHeight - footerItem.clientHeight - scrollPaddingConstant);
                    window.scrollTo(0, document.body.offsetHeight - footerItem.clientHeight - scrollPaddingConstant);
                    await delay(50);
                    await this.isItemsLoaded();
                    await delay(50);
                    itemAll = document.querySelectorAll('#ordersContainer .a-section.a-padding-small.js-item');
                    const after = itemAll.length;
                    atBottom = before === after ? true : false;
                }
                SDKEvent.log('End loading all items', type);
                return; 
            },

            /**
             * Validate if order listing UI selector is updated
             */
            validateListingPreScrapping: function () {
                let isValid = true;
                const configData = getStorage(CONFIG_DATA);
                const orderListingSelector = document.querySelector(
                    '#ordersContainer .a-padding-small.js-item'
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
                    if(item.orderId) {
                        returnData.push({
                            orderId: item.orderId,
                            itemName: item.itemName,
                            orderDate: item.orderDate,
                            detailsUrl: detailsUrl
                        });
                    }
                }
                configData.scrappingData = returnData;
                setStorage(CONFIG_DATA, configData);
                SDKEvent.log('End of Processing', configData.type);
                return configData;
            },

            /**
             * Validate if given string matches Order listing date format
             */
            validateDate: function (dateString, endDate) {
                /** Commented out Order Listing Scraping based on Regex
                // Condition to handle `listing` page order status
                const regex = /(out for [a-z]{3,20}|refund|tomorrow|(mon|tues|wed(nes)|thur(s)|fri|yester|to|sat(ur)|sun)(day))/;
                const dateStr = dateString.toLowerCase().match(regex);
                if (dateStr && dateStr.length) {
                    const endDateString = endDate.split("-");
                    return formatDate(new Date(endDateString[2], endDateString[1] - 1, endDateString[0]));
                }
                // Condition to handle `listing` page order status - Regex to Match Case Sensitive
                const regex1 = /Arriving|Expected by [A-Z][a-z]{2,3} [0-9]{1,2}|[A-Z][a-z]{2,3} [0-9]{1,2} - [A-Z][a-z]{2,3} [0-9]{1,2}|[A-Z][a-z]{0,20} date pending/;
                const res = dateString.match(regex1);
                if(res && res.length) {
                    const endDateString = endDate.split("-");
                    return formatDate(new Date(endDateString[2], endDateString[1] - 1, endDateString[0]));
                }
                return formatDate(dateExtracted);
                */
                const extractDateStringLocal = function (dateString) {
                    const regex = /[A-Z][a-z]{2,3} [0-9]{1,2}[,]? (20)[0-9]{2}/;
                    const dateStr = dateString.match(regex);
                    return dateStr && dateStr.length ? dateStr[0] : null;
                };
                const dateExtracted = extractDateStringLocal(dateString);
                if(dateExtracted) {
                    return formatDate(dateExtracted);
                } else {
                    const endDateString = endDate.split("-");
                    return formatDate(new Date(endDateString[2], endDateString[1] - 1, endDateString[0]));
                }
            },

            /**
             * Scrapes all order items in the listing page
             */
            scrapeItems: function () {
                const data = [];
                const workFlowData = getStorage(WORK_FLOW_DATA);
                document.querySelectorAll('#ordersContainer .a-padding-small.js-item')
                    .forEach(item => {
                        let orderId = null;
                        const urlLink = item.querySelector('a').getAttribute('href');
                        let deliverySelector = item.querySelector('span.a-size-small.a-color-secondary');
                        if (!deliverySelector) {
                            console.log('Delivery Date text selector not found');
                            deliverySelector = item.querySelector('.a-text-bold');
                            if (!deliverySelector) {
                                console.log('Delivery Date text selector not found for newer orders')
                            }
                        }
                        let delivery = deliverySelector.textContent.trim();
                        // Only if order date is valid
                        console.log('Check for Date Filter ', delivery, this.validateDate(delivery, workFlowData.endDate));
                        const orderDate = this.validateDate(delivery, workFlowData.endDate);
                        if (orderDate) {
                            const url = new URL(window.location.origin + urlLink);
                            // For some listing, format is different to get orderId
                            if (item.querySelector('.a-section.a-spacing-top-medium')) {
                                const orderLink = item
                                    .querySelector('.a-section.a-spacing-top-medium a:last-child');
                                const orderUrl = new URL(window.location.origin + orderLink);
                                orderId = orderUrl.searchParams.get('oid') || orderUrl.searchParams.get('orderID');
                            } else {
                                orderId =
                                    url.searchParams.get('orderId') || url.searchParams.get('oid');
                            }
                            const itemName = item.querySelector('.a-text-bold').textContent.trim();
                            data.push({
                                orderId: orderId,
                                orderDate: orderDate,
                                itemName: itemName
                            });
                        }
                    });
                return data;
            },

            /**
             * Listing scrapper wrapper fucntion
             */
            doScrapping: async function () {
                const configData = getStorage(CONFIG_DATA);
                if (!this.validateListingPreScrapping()) {
                    SDKEvent.log('Validation of order listing selector failed', configData.type);
                    return [];
                }
                await this.waitToLoadAllItemsByItemCount(configData.type);
                SDKEvent.log('After Loading all items', configData.type);
                return this.scrapeItems();
            },

            /**
             * Entry point for listing scrapping
             */
            scrape: async function (configData) {
                if (configData.isSinglePage) {
                    const listingData = await this.doScrapping();
                    const cloneConfig = Object.assign({}, configData);
                    cloneConfig.scrappingData = listingData;
                    SDKEvent.log(`Data Scrapped for Single Year ${configData.year}`, configData.type);
                    setStorage(CONFIG_DATA, cloneConfig);
                    SDKEvent.log('Get Scrapping data from local storage', configData.type);
                    return listingData;
                } else {
                    // const configData = getStorage(CONFIG_DATA);
                    const listingData = await this.doScrapping();
                    configData.scrappingData = configData.scrappingData.length
                        ? configData.scrappingData.concat(listingData)
                        : listingData;
                    SDKEvent.log(`Concat listing items with existing item - total ${configData.scrappingData.length}`, configData.type);
                    setStorage(CONFIG_DATA, configData);
                    if (configData.yearList.length) {
                        configData.yearList.shift();
                        setStorage(CONFIG_DATA, configData);
                        const shouldProcess = this.processWorkflow(configData);
                        return shouldProcess ? listingData : null;
                    } else {
                        return listingData;
                    }
                }
            },

            /**
             * Initalize Scrapping
             */
            initScrapping: async function (configData) {
                let listingData = null;
                try {
                    listingData = await listingScrapper.scrape(configData);
                    configData = getStorage(CONFIG_DATA);
                    if (!listingData) {
                        SDKEvent.log('Multiple year process subsequent year', configData.type);
                        return null;
                    }
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
                    return await listingScrapper.initScrapping(configData);
                } else if (configData.type === DETAILS_WORKFLOW) {
                    return detailsScrapper.initScrapping(configData);
                }
            }
            return configData.type;
        };
        try {
            // Additional Check to see localStorage Support
            if(!isStorageSupported(() => localStorage)) {
                throw new Error('Local Storage is not supported');
            }
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
    return await AmazonScript();
})();