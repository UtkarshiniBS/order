const MONTH_PATTERN = /\b(Jan|Feb|Mar|Apr|May|June?|July?|Aug|Sept?|Oct|Nov|Dec)/i;

function waitUntil(selector) {
    const MAX_RETRIES = 5, INTERVAL_MS = 2000;
    return new Promise((resolve, reject) => {
        let count = 0,
            intervalId;
        if (document.querySelector(selector)) resolve();
        else {
            intervalId = setInterval(() => {
                count++;
                if (count > MAX_RETRIES) {
                    reject(clearInterval(intervalId));
                }
                else if (document.querySelector(selector)) {
                    resolve(clearInterval(intervalId));
                }
            }, INTERVAL_MS);
        }
    });
}


const formatDate = function (date) {
    const fDate = new Date(date);
    return `${fDate.getMonth() + 1}/${fDate.getDate()}/${fDate.getFullYear()}`;
};


class DOM {
    static getElements(selector, parent = document) {
        return Array.from(parent.querySelectorAll(selector));
    }
    static getElement(selector, parent = document) {
        return (parent).querySelector(selector);
    }
}

function delay(ms) {
    return new Promise((res) => setTimeout(res, ms));
}

function toPromise(result) {
    return new Promise((res) => res(result));
}

const shallowClone = function (data) {
    return Object.assign({}, data);
};

const Product = {
    itemUrl: "",
    itemPrice: "",
    itemTitle: "",
    itemQuantity: "",
    itemUnitPrice: "",
    itemPackageUnit: ""
}

const Order = {
    orderId: "",
    orderDate: "",
    orderLink: "",
    hasNoDetails: false
}

const Action = Object.freeze({
    Searching: 0,
    Scraping: 1,
    Completed: 2
});

const OrderType = Object.freeze({
    Store: 'In-Store',
    Online: 'Online',
    Pickup: 'Pickup',
    Fuel: 'Fuel Center'
});

const orderTypePatterns = [
    { type: OrderType.Fuel, regex: /fuel/i },
    { type: OrderType.Store, regex: /in.?store/i },
    { type: OrderType.Pickup, regex: /pick.?up/i },
    { type: OrderType.Online, regex: /.*/i },
];

function ScrapeStatus() {
    this.action = Action.Searching;
    return {
        setStatus: (action) => this.action = action,
        isScraping: () => this.action === Action.Scraping,
        isCompleted: () => this.action === Action.Completed,
        isSearching: () => this.action === Action.Searching
    }
}

class KrogerScraper {
    constructor(config) {
        this.config = config;
    }

    async scrapeOrderListing() {
        const listingSelectors = {
            PaginationContainer: "[aria-label=Pagination] > *",
            OrderHistoryCard: "[aria-label='Purchase History Order']",
            OrderDateText: "header .kds-Text--m:first-child",
            OrderDetailsLink: "header .kds-Link",
            ErrorMessage: ".kds-Message--error",
            PageLoadedPredicate: ".ReceiptList-listContent"
        }
        const startDate = new Date(this.config.startDate), endDate = new Date(this.config.endDate);
        const status = new ScrapeStatus();

        /* 
          Returns a list with previous button, page links and next button from pagination
        */
        function getPaginationComponents(paginationContainer) {
            return [
                paginationContainer[0], // Prev button
                paginationContainer.splice(1, paginationContainer.length - 2), // Page links
                paginationContainer[1], // Next button
            ];
        }

        function getNextButton(paginationContainer) {
            return paginationContainer.pop();
        }

        /*
          Returns an `Order` list
        */
        function getOrdersList() {
            return DOM.getElements(listingSelectors.OrderHistoryCard)
                .map(orderCard => {
                    const order = shallowClone(Order);
                    const orderDateContainer = DOM.getElement(listingSelectors.OrderDateText, orderCard);
                    if (orderDateContainer) {
                        order.orderDate = new Date(orderDateContainer.textContent);
                    } else {
                        const orderCardText = orderCard.innerText;
                        const dateText = orderCardText.split(/\n/g).find(text => MONTH_PATTERN.test(text))
                        const finalDateText = (dateText.includes("|")) ? dateText.split("|")[0].trim() : dateText.trim()
                        order.orderDate = new Date(finalDateText);
                    }

                    const orderHref = DOM.getElement(listingSelectors.OrderDetailsLink, orderCard).href;
                    order.orderLink = orderHref;
                    order.orderId = orderHref.replace(/.*\//, '');
                    const errorMessage = DOM.getElement(listingSelectors.ErrorMessage, orderCard);
                    if (errorMessage) {
                        order.hasNoDetails = true;
                    }
                    return order;
                });
        }

        const pagination = { next: null }

        function setNextButton() {
            pagination.next = getNextButton(DOM.getElements(listingSelectors.PaginationContainer));
        }

        /*
            Navigate to next page when button is not disabled
        */
        async function gotoNextPageIfExists() {
            setNextButton();

            if (!pagination.next || pagination.next.disabled) {
                return toPromise(false);
            }

            pagination.next.click();
            await waitUntil(listingSelectors.PageLoadedPredicate);
            return toPromise(true);
        }

        /*
            Search for the order with date lesser than end date 
        */
        let orders = getOrdersList();
        while (status.isSearching()) {
            const lastOrder = orders[orders.length - 1];
            if (lastOrder.orderDate <= endDate) {
                status.setStatus(Action.Scraping);
                break;
            }

            if (status.isSearching()) {
                if (await gotoNextPageIfExists()) {
                    orders = getOrdersList();
                } else {
                    status.setStatus(Action.Completed);
                }
            }
        }

        orders = orders.filter((order) => order.orderDate >= startDate && order.orderDate <= endDate);

        /*
            Save the orders with date within given range
        */
        const matchedOrders = [];
        while (status.isScraping()) {
            for (const order of orders) {
                if (order.orderDate >= startDate && order.orderDate <= endDate) {
                    order.orderDate = formatDate(order.orderDate);
                    matchedOrders.push(order);
                } else {
                    status.setStatus(Action.Completed);
                }
            }

            if (status.isScraping()) {
                if (await gotoNextPageIfExists()) {
                    orders = getOrdersList();
                } else {
                    status.setStatus(Action.Completed);
                }
            }
        }

        const finalOrders = matchedOrders
            .filter((order) => !order.hasNoDetails) // Remove orders without any details
            .map((order) => {
                delete order.hasNoDetails;
                return order;
            });

        return finalOrders;
    }
    async scrapeOrderDetails() {
        const orderDetailsSelector = {
            PurchaseDetailContainer: ".purchase-detail-footer",
            PurchaseSummaryItems: '[data-test="payment-summary-header"] ~ div.flex',
            TotalSavings: '[data-testid="PH-savings-amount"]',
            PackageCard: '.PH-package-card',
            ProductContainer: '[aria-label="Purchased Items"] .PH-ProductCard-container',
            ProductPrice: "data.kds-Price",
            ProductUnitPrice: "data.kds-Price + .kds-Text--s > span",
            ProductName: ".kds-Text--m",
            ProductQuantity: "data.kds-Price + .kds-Text--s",
            ProductPackageUnit: ".PH-ProductCard-item-description-size",
            ProductUrl: '.kds-Link',
            PaymentMethod: '[data-test="payment-method-header"] ~ span',
            OrderStatus: '[aria-label="Purchase History Order"] header h2'
        }

        /**
         * Find `OrderType` based on the order status
         * @param orderStatus 
         */
        function getOrderType(orderStatus) {
            return orderTypePatterns.find(x => x.regex.test(orderStatus)).type;
        }

        /*
            Returns order summary
        */
        function getOrderSummary() {
            const orderSummary = DOM.getElements(orderDetailsSelector.PurchaseSummaryItems)
                .reduce((acc, purchaseDetail) => {
                    const key = purchaseDetail.firstChild.textContent.trim();
                    let value = purchaseDetail.lastChild.textContent.trim();
                    if (/FREE/i.test(value)) value = 'FREE';
                    if (/[A-Z]+/i.test(key)) acc[key] = value;
                    return acc;
                }, {});
            return orderSummary;
        }

        /*
            Returns `Product` list of a package
        */
        function getPackageItems(productCards, packageDetails) {
            return productCards.map(productCard => {
                const product = shallowClone(Product);
                product.itemTitle = DOM.getElement(orderDetailsSelector.ProductName, productCard).textContent;
                product.itemPrice = DOM.getElement(orderDetailsSelector.ProductPrice, productCard).textContent;
                product.itemQuantity = DOM.getElement(orderDetailsSelector.ProductQuantity, productCard).textContent.match(/^[0-9]+/)[0];
                product.itemPackageUnit = DOM.getElement(orderDetailsSelector.ProductPackageUnit, productCard).textContent;
                product.itemUnitPrice = DOM.getElement(orderDetailsSelector.ProductUnitPrice, productCard).textContent;
                product.itemUrl = DOM.getElement(orderDetailsSelector.ProductUrl, productCard) ? DOM.getElement(orderDetailsSelector.ProductUrl, productCard).href : "";
                if (packageDetails) {
                    product.itemShipping = packageDetails.shipping;
                    product.itemStatus = packageDetails.status;
                    product.itemStatusDate = packageDetails.statusDate;
                }
                return product;
            });
        }

        /*
            Returns `Product` list of the order 
        */
        function getProductsByPackage() {
            const packages = DOM.getElements(orderDetailsSelector.PackageCard);
            return packages.reduce((acc, pkg) => {
                let packageDetails = null;
                if (pkg.children[2].querySelector('hr')) {
                    const orderInfo = pkg.children[2].innerText.split('\n');
                    const shipping = orderInfo[1];
                    const orderStatus = orderInfo[0].split(/ \b(?=\d)/);
                    packageDetails = { shipping, status: orderStatus[0], statusDate: orderStatus[1] };
                }
                const productCards = DOM.getElements(orderDetailsSelector.ProductContainer, pkg);
                const products = getPackageItems(productCards, packageDetails);
                acc.push(...products);
                return acc;
            }, []);
        }

        const orderedProducts = getProductsByPackage();
        const orderSummary = getOrderSummary();
        const paymentMethods = DOM.getElements(orderDetailsSelector.PaymentMethod).map((el) => {
            return (el.textContent.trim().replace(/[0-9]/g, ''));
        });
        const orderStatusElement = DOM.getElement(orderDetailsSelector.OrderStatus);
        if (orderStatusElement) {
            var orderStatus = orderStatusElement.textContent.trim().match(/[a-zA-Z]+/g).join(' ')
            var orderStatusDate = orderStatusElement.textContent.replace(/[a-zA-Z]+/g, '').trim();
            var orderType = getOrderType(orderStatus);
        }
        const orderDetails = {
            items: orderedProducts,
            orderSummary,
            paymentMethods,
        }
        if (orderStatus) {
            orderDetails['orderStatus'] = orderStatus;
        }
        if (orderStatusDate) {
            orderDetails['orderStatusDate'] = orderStatusDate;
        }
        if (orderType) {
            orderDetails['orderType'] = orderType;
        }

        return orderDetails;
    }
}
