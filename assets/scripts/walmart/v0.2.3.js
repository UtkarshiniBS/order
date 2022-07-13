(async () => {
  const WalmartScript = async function () {
    const LISTING_WORKFLOW = 'listing';
    const DETAILS_WORKFLOW = 'details';

    /**
     * Events to SDK
     */
    const SDKEvent = {
      ORDER_LIST_TYPE: 'orderlist',
      ORDER_DETAIL_TYPE: 'orderdetails',

      callback: function (data) {
        const androidCallback = window.Android;
        if (typeof androidCallback != 'undefined') {
          androidCallback.showToast(JSON.stringify(data));
          if (androidCallback.jsCallback) {
            androidCallback.jsCallback(JSON.stringify(data));
          }
        }
        if (
          window.webkit &&
          window.webkit.messageHandlers &&
          window.webkit.messageHandlers.iOS
        ) {
          window.webkit.messageHandlers.iOS.postMessage(JSON.stringify(data));
        }
      },

      error: function (errorMsg, type) {
        const rType =
          type === LISTING_WORKFLOW
            ? this.ORDER_LIST_TYPE
            : this.ORDER_DETAIL_TYPE;
        const obj = {
          type: rType,
          status: 'failed',
          isError: true,
          message: null,
          data: null,
        };
        obj.errorMessage = errorMsg;
        console.log('Error callback');
        this.callback(obj);
      },

      success: function (scrappingData, type) {
        const rType =
          type === LISTING_WORKFLOW
            ? this.ORDER_LIST_TYPE
            : this.ORDER_DETAIL_TYPE;
        const obj = {
          type: rType,
          status: 'success',
          isError: false,
          errorMessage: null,
        };
        obj.data = scrappingData;
        obj.message = 'Page Scrapped Successfully';
        console.log('success data ', obj);
        this.callback(obj);
      },

      log: function (logString, type) {
        const rType =
          type === LISTING_WORKFLOW
            ? this.ORDER_LIST_TYPE
            : this.ORDER_DETAIL_TYPE;
        const obj = {
          type: rType,
          status: 'log',
          isError: false,
          errorMessage: null,
          data: null,
        };
        obj.message = logString;
        console.log(logString);
        this.callback(obj);
      },
    };

    /**
     * Format Date object to the Date text
     */
    const formatDate = function (date) {
      const fDate = new Date(date);
      return `${fDate.getMonth() +
        1}/${fDate.getDate()}/${fDate.getFullYear()}`;
    };

    /**
     * Format Input Date object to the Date text
     */
    function formatInputDate(dateString, isEndDate) {
      dateString = dateString.split('-');
      const date = new Date(dateString[2], dateString[1] - 1, dateString[0]);
      if (isEndDate) {
        date.setHours(23, 59, 59, 999);
      } else {
        date.setHours(0, 0, 0, 0);
      }
      return date;
    }

    /**
     * Wrapper to get Dom Element
     */
    const getDOMElement = async function (
      querySelector,
      isArray,
      waitUntilLoaded,
      untilDestroyed,
      scope,
    ) {
      const timeoutValue = 30000; // 30 sec
      const interval = 100;
      let timer = 0;
      let condition;
      scope = scope || document;
      isArray = isArray || false;
      if (waitUntilLoaded) {
        if (untilDestroyed) {
          condition = isArray
            ? scope.querySelectorAll(querySelector).length === 0
            : scope.querySelector(querySelector);
        } else {
          condition = isArray
            ? scope.querySelectorAll(querySelector).length != 0
            : !scope.querySelector(querySelector);
        }
      } else {
        condition = isArray
          ? scope.querySelectorAll(querySelector).length
          : scope.querySelector(querySelector);
      }
      while (condition) {
        await new Promise(r => setTimeout(r, interval));
        timer += interval;
        if (timer >= timeoutValue) {
          const textO = `timedout for querySelector ${querySelector} for array ${isArray} in scope ${scope}`;
          console.log(textO);
          await Promise.reject(new Error(textO));
          // return undefined;
        }
        condition = isArray
          ? scope.querySelectorAll(querySelector).length
          : scope.querySelector(querySelector);
      }
      return isArray
        ? scope.querySelectorAll(querySelector)
        : scope.querySelector(querySelector);
    };

    /*
     **********************************************************************************
     * Start of Walmart Core Script
     */

    function waitUntil(predicateFn) {
      const MAX_RETRIES = 5,
        INTERVAL_MS = 2000;
      return new Promise((resolve, reject) => {
        let count = 0,
          intervalId;
        if (predicateFn()) resolve();
        else {
          intervalId = setInterval(() => {
            count++;
            if (count > MAX_RETRIES) reject(clearInterval(intervalId));
            else if (predicateFn()) {
              resolve(clearInterval(intervalId));
            }
          }, INTERVAL_MS);
        }
      });
    }

    function getXpathIter(expression, parentNode = document) {
      return document.evaluate(
        expression,
        parentNode,
        null,
        XPathResult.ANY_TYPE,
        null,
      );
    }

    function getXpathEl(expression, parentNode = document) {
      return getXpathIter(expression, parentNode).iterateNext();
    }

    const shallowClone = function (paymentInfo) {
      return Object.assign({}, paymentInfo);
    };

    function delay(ms) {
      return new Promise(res => setTimeout(res, ms));
    }

    const Order = {
      orderId: '',
      orderDate: '',
      orderLink: '',
    };

    class Scraper {
      scrape() {
        throw new Error('No implementation found');
      }
    }

    class OrderDetailsScraper extends Scraper {
      constructor() {
        super();

        this.selectors = {
          productCardExpandIcon:
            '[data-testid="orderInfoCard"] .ld-ChevronDown',
          productCard: '[data-testid="orderInfoCard"]',
          orderSummaryContainer: 'main > :last-child > :last-child',
          orderMetaContainer: 'main > :first-child > :first-child',
          orderCardChildren: '.pa3',
          PaymentSectionSelector: '.mv3',
          storeAddressXpath: './/*[text()="Store address"]',
          itemUrlSelector: '[link-identifier="itemClick"]',
        };
      }

      async scrape() {
        let {
          orderInfoCard,
          paymentObject,
          paymentSection,
          orderCardAll,
        } = this.getDOMelement();

        const patternsToIgnore = [/Add to cart/, /Write a review/];
        const purchaceType = orderInfoCard[0];
        let paymentMethod = [];

        paymentObject.forEach(g => {
          let imageTag = g.querySelector('img');
          if (imageTag != null) {
            paymentMethod.push(imageTag.alt);
          } else {
            paymentMethod.push(g.innerText.trim().replace(/[0-9]/g, ''));
          }
        });

        let finalCollection = [];
        let orderCardCollection = null;
        let purchaseType = null;
        orderCardAll.forEach(item => {
          purchaseType = item.innerText.split('\n')[0];
          item = Array.from(item.lastElementChild.children).filter(
            f => !f.innerText.includes('Unavailable'),
          );
          for (let card of item) {
            let orderCard = card.querySelectorAll(
              this.selectors.orderCardChildren,
            );
            orderCardCollection = Array.from(orderCard);

            orderCardCollection.map(inputLine => {
              const itemUrl = inputLine.querySelector(
                this.selectors.itemUrlSelector,
              ).href;
              inputLine = inputLine.innerText.trim();
              let productObject = inputLine
                .split(/\n/)
                .filter(
                  line => !patternsToIgnore.some(pattern => pattern.test(line)),
                );

              productObject = productObject.filter(
                product => !product.match(/return/i),
              );

              const productName = productObject.splice(0, 1).join('');

              const product = {
                itemName: productName,
                itemUrl: itemUrl,
                purchaseType: purchaseType,
                itemPrice: productObject
                  .splice(
                    productObject.findIndex(value =>
                      /^\$?[0-9]+[.][0-9]+$/.test(value),
                    ),
                    1,
                  )
                  .join(''),

                itemQuantity:
                  productObject.length === 1
                    ? productObject
                      .splice(0, 1)
                      .join('')
                      .replace(/Qty|Wt/gi, '')
                      .trim()
                    : productObject
                      .splice(
                        productObject.findIndex(value => !/\//.test(value)),
                        1,
                      )
                      .join('')
                      .replace(/Qty|Wt/gi, '')
                      .trim(),
                itemUnitPrice:
                  productObject.length > 0
                    ? productObject.splice(0, 1).join()
                    : '',
                itemActualPrice:
                  productObject.length > 0 &&
                    productObject[0].includes('Discount')
                    ? productObject[productObject.length - 1]
                    : '',
              };

              if (product.itemUnitPrice == '') {
                product.itemUnitPrice = product.itemPrice;
              }

              finalCollection.push(product);
              return product;
            });
          }
        });

        const orderSummary = {};
        paymentSection.forEach(() => {
          let paymentSectionDivision = [];
          if (paymentSection[0].includes('Fees')) {
            paymentSectionDivision[0] = paymentSection[1] + paymentSection[0];
            paymentSectionDivision[1] = paymentSection[2];
            paymentSection.splice(0, 3);
          } else {
            paymentSectionDivision = paymentSection.splice(0, 2);
            if (paymentSectionDivision[0].includes('Subtotal')) {
              paymentSectionDivision[0] = 'Subtotal';
            }
          }
          orderSummary[paymentSectionDivision[0]] = paymentSectionDivision[1];
        });
        let storeAddressEl = getXpathEl(
          this.selectors.storeAddressXpath,
          document.querySelector(this.selectors.productCard),
        );

        orderSummary['storeAddress'] =
          storeAddressEl != null ? storeAddressEl.nextSibling.innerText : '';
        orderSummary['paymentMethod'] = paymentMethod;

        let result = {
          items: finalCollection,
          orderDetails: orderSummary,
        };

        return result;
      }

      getDOMelement() {
        const openDropMenu = document.querySelectorAll(
          this.selectors.productCardExpandIcon,
        );

        openDropMenu.forEach(f => f.click());

        let orderCardAll = Array.from(
          document.querySelectorAll(this.selectors.productCard),
        );
        
        const orderInfoCard = document
          .querySelector(this.selectors.productCard)
          .firstChild.innerText.split('\n');

        const orderSummaryContainer = document.querySelector(
          this.selectors.orderSummaryContainer,
        );
        
        const orderSumary = Array.from(orderSummaryContainer.firstElementChild.children).find(
          d => d.textContent === 'Payment method',
        );
        let paymentObject = Array.from(orderSumary && orderSumary.nextSibling ? orderSumary.nextSibling.lastElementChild.children : []);

        let paymentSection = document
          .querySelector(this.selectors.PaymentSectionSelector)
          .nextElementSibling.innerText.split('\n');

        return {
          orderInfoCard,
          paymentObject,
          paymentSection,
          orderCardAll,
        };
      }
    }

    class OrderListScraper extends Scraper {
      constructor(config) {
        super();

        this.config = config;
        this.orderPrefixUrl = 'https://www.walmart.com/orders/';
        this.selectors = {
          orderCard: '.mv3',
          nextButton: '[aria-label="Next page"]',
          loader: '[role="status"]',
          orderIdXpath: './/*[starts-with(@id,"caption")]',
        };
      }

      async gotoNextPageIfExists() {
        const pagination = { next: null };
        pagination.next = document.querySelector(this.selectors.nextButton);
        if (!pagination.next || pagination.next.disabled) {
          return false;
        }

        pagination.next.click();
        await delay(500);
        await waitUntil(() => {
          return !document.querySelector(this.selectors.loader);
        });
        return true;
      }

      async getOrdersList() {
        await waitUntil(() => {
          return !document.querySelector(this.selectors.loader);
        });
        let orderCollection = [];
        let storePurchase = '?storePurchase=true';
        Array.from(document.querySelectorAll(this.selectors.orderCard)).forEach(
          g => {
            let orderCard = g.innerText;
            if (orderCard.length > 0 && !orderCard.match(/Cancel/i)) {
              let orderCardInfo = orderCard.split('\n');
              const order = shallowClone(Order);
              order.orderDate = new Date(
                orderCardInfo[0].split(/ (?=[a-zA-Z])/)[0].trim(),
              );

              const orderIdElement = getXpathEl(this.selectors.orderIdXpath, g);

              order.orderId = orderIdElement.id.replace(
                /Caption-|[a-z_]+$|[a-z]+-/gi,
                ''
              );
              if (orderCard.includes('Store purchase')) {
                order.orderLink =
                  this.orderPrefixUrl + order.orderId + storePurchase;
              } else {
                order.orderLink = this.orderPrefixUrl + order.orderId;
              }
              orderCollection.push(order);
            }
          },
        );

        return orderCollection;
      }

      async scrape() {
        const startDate = new Date(this.config.startDate),
          endDate = new Date(this.config.endDate);
        let collection = [];
        let lastOrderDate = null;
        let orders = await this.getOrdersList();
        if (orders.length > 0) {
          Array.prototype.push.apply(collection, orders);
          lastOrderDate = orders[orders.length - 1].orderDate;
        }

        if (lastOrderDate != null) {
          let shouldStop = false;
          while (lastOrderDate >= startDate && !shouldStop) {
            if (await this.gotoNextPageIfExists()) {
              let tempOrders = await this.getOrdersList();
              lastOrderDate = tempOrders[tempOrders.length - 1].orderDate;
              Array.prototype.push.apply(collection, tempOrders);
            } else {
              shouldStop = true;
              break;
            }
          }
        }

        return collection.filter(
          order => order.orderDate >= startDate && order.orderDate <= endDate,
        );
      }
    }

    /*
     **********************************************************************************
     * End of Walmart Core Script
     */

    /**
     * On JS script initialization, init is called
     */
    const onInit = async function () {
      let configData = window.inputData || inputData;
      if (configData.type === LISTING_WORKFLOW) {
        const config = {
          startDate: formatInputDate(configData.startDate),
          endDate: formatInputDate(configData.endDate, true),
        };
        const scraper = new OrderListScraper(config);
        await delay(500);
        const listingUrl = configData.urls.listing
          .trim()
          .toLowerCase();
        if (!window.location.href.includes(listingUrl)) {
          const message = `This is Not Listing URL, Current URL is ${window.location.href} configured listing URL is ${listingUrl}`;
          SDKEvent.log(message, configData.type);
          throw new Error(message);
        }
        let data = [];
        data = await scraper.scrape();
        if (data.length > 0) {
          data = data.map(d => {
            return {
              orderId: d.orderId,
              orderDate: formatDate(d.orderDate),
              detailsUrl: d.orderLink,
            };
          });
        }
        SDKEvent.success(data, configData.type);
        return configData.type;
      } else if (configData.type === DETAILS_WORKFLOW) {
        await delay(500);
        const scraper = new OrderDetailsScraper();
        const data = await scraper.scrape();
        data.orderId = configData.orderId;
        data.orderDate = configData.orderDate;
        SDKEvent.success(data, configData.type);
      }
      return configData.type;
    };
    try {
      const type = await onInit();
      SDKEvent.log(`Climax - Script Ends for ${type}`, type);
      console.timeEnd('JsScript');
      return type;
    } catch (e) {
      SDKEvent.error(`Unknown error type - ${e.stack}`, LISTING_WORKFLOW);
      SDKEvent.error(`Unknown error type - ${e.stack}`, DETAILS_WORKFLOW);
      console.timeEnd('JsScript');
      throw e;
    }
  };
  console.time('JsScript');
  return await WalmartScript();
})();
