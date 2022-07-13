(function () {
    // window.addEventListener('load', function () {});

        var html, i, j, htmlHeight = 0, currentHtmlHeight = 0, pageContent = [], htmlContent = '', completedScrap = false;

        // declaration of date range.
        var startDate = '05-01-2017', endDate = '12-30-2018';

        // get html body
        html = document.querySelectorAll('html body');
        
        // array for order details and order list page.
        pageContent = ['orderDetails', 'yourOrders'];

        // start function to know current page.
        getCurrentStatus();
    
        // conver date format (date: send date value i.e. 11-nov-2017, dateFormate: send format required i.e. year, month or complete date change format)
        function formatDate(date, dateFormatType) {
            var d = new Date(date),
                month = '' + (d.getMonth() + 1),
                day = '' + d.getDate(),
                year = d.getFullYear(), 
                formatedDate = date;
            if (month.length < 2) month = '0' + month;
            if (day.length < 2) day = '0' + day;
        
            switch(dateFormatType) {
                case 'year':
                    formatedDate = year;
                    break;
                case 'month':
                    formatedDate = month;
                    break;
                default:
                    formatedDate = [month, day, year].join('-');
                    break;
            }
            return formatedDate;
        }
        
        //get current page status function
        function getCurrentStatus() { 
            // fetch url of current page.
            var currentPage = window.location.href;

            // check flag whether the scrapping is false or true.
            if (!completedScrap) {
                var startFilter = formatDate(startDate, 'year'); // change start date format eg. 11-may-2017 to 2017.
                var endFilter = formatDate(endDate, 'year'); // change start date format eg. 11-may-2017 to 2017.

                // get url search params.
                let params = new URLSearchParams(location.search);

                // get order filter from the url.
                var currentState = params.get('orderFilter');
                console.log('current page details', currentPage, currentState, startFilter, endFilter);
                checkFilter(currentPage, currentState, startFilter, endFilter);
            }
        }

        // function to check filter from url such as year, month or days.
        function checkFilter(currentPage, state, startFilter, endFilter) {
            console.log('checking current page filter i.e. year, month or days');
            switch(true) {
                case state.includes('year'):
                    console.log('year scrapping');
                    yearScrapping(currentPage, startFilter, endFilter);
                    break;
                case state.includes('month'):
                    console.log('month scrapping');
                    monthScrapping(currentPage, startFilter, endFilter);
                    break;
                case state.includes('last'):
                    console.log('days scrapping');
                    daysScrapping(currentPage, startFilter, endFilter);
                    break;
            }
        }

        // function to start year based scrapping.
        function yearScrapping(page, start, end) {
            console.log('year scrapping start details', page, start, end);
            completedScrap = true;
            for (i = 0; i < html.length; i++) {
                htmlContent = html[i].innerHTML;
                pageDetection(htmlContent)
            }
            console.log('completedScrap', completedScrap);
            if (!completedScrap) {
                if (end > start) {
                    const nextPageURL = page.replace(('year-' + start), ('year-' + end));
                    // redirect to next page
                    // location.href = nextPageURL;
                    if(page != nextPageURL) {
                        start = end;
                        console.log('nextPageURL', nextPageURL, start, end);
                    }
                } 
            } else {
                console.log('completed scrapping');
            }
        }

        // function to check on which page we are either on order list page or order details page
        function pageDetection(content) {
                console.log('Page Detection', content);
                if (content != '') {
                    for (j = 0; j < pageContent.length; j++) {
                        const elementById = document.getElementById(pageContent[j]);
                        switch (j) {
                            case 0:
                            case (elementById != null):
                                orderDetailsFunction(elementById, pageContent[0]);
                                break;
                            case 1:
                            case (elementById != null):
                                yourOrdersFunction(elementById, pageContent[1]);
                                break;
                            case (elementById != null):
                                errorMessageFunction();
                                break;
                        }
                    }
                }
        }

        // function to start order detail page scrapping.
        function orderDetailsFunction(element, id) {
            // if (element != null) {
            //     // console.log(element, 'orderDetailsFunction');
            //     var obj = element
            //         // Split content into lines (by "\n")
            //         .split('\n')
            //         // split each line into key and value (by " = ")
            //         .map(line => line.split(' = '))
            //         // reduce each key value pair into a single object with properties
            //         .reduce((acc, kvp) => { acc[kvp[0]] = kvp[1]; return acc; }, {})

            //     // Finally, turn the object into a JSON string.
            //     var json = JSON.stringify(obj);

            //     console.log(json);
            // }
        }

        // scrolling function for the page if there is multiple order in order list page.
        function getOrderList() {
            window.scrollTo(0, document.body.scrollHeight);
            htmlHeight = currentHtmlHeight;
            return document.body.scrollHeight;
        }

        // funciton to start order scrapping based on order list page.
        function yourOrdersFunction(element, id) {
            if (element != null) {

                var parentDiv = document.getElementsByClassName("hide-if-js");
                if (parentDiv.length > 0 && parentDiv[0].children.length > 0) {
                    currentHtmlHeight = getOrderList();
                }

                // setTimeout(() => {
                    if (currentHtmlHeight > htmlHeight) {
                        yourOrdersFunction(element, id);
                    } else {
                        // const domEle = convertToDom(html[0].innerHTML);
                        // const classIdJson = htmlClassIdJson(domEle, html[0].innerHTML);

                        // console.log(domEle, domEle.getElementsByTagName('span'));
                        html = document.querySelectorAll('#ordersContainer');
                        // console.log(element, html, id, 'yourOrdersFunction');
                        const li = document.querySelectorAll('.a-section.a-padding-small.js-item');
                        
                        // const domEle = convertToDom(li[0].innerHTML);
                        // console.log(li, domEle, domEle.getElementsByTagName('span'));
                        const elementArray = [];
                        if (li.length > 0) {
                            for (var index = 0; index < li.length; index++) {
                                const path = getXPathForElement(li[index]);
                                const elementByPath = getElementByXPath(path);
                                // push all the order list detilas in elementArray including digitial order or refund orders once.
                                elementArray.push(elementByPath);
                                // console.log(path);
                                // console.log(elementArray, elementByPath, (li[index] === getElementByXPath(path)));
                            }

                            // function callback to get the order links from the order scrapped data.
                            if (elementArray.length > 0) 
                                fetchOrderLinks(elementArray);
                        }
                    }
                // }, 10000);
            }
        }

        function errorMessageFunction() {
            console.log(elementById, 'errorMessageFunction');
        }

        // function htmlClassIdJson(str, contentData) {
        //     // console.log(str, contentData.replace(/\n/g, ''))

        //     const htmlStr = contentData.replace(/\n/g, '')

        //     const elements = []

        //     const findTag = /<[^\/].*?>/g
        //     let element
        //         while(element = findTag.exec(htmlStr)) {
        //         element = element[0];
        //         const id = (element.match(/id="(.*?)"/i) || [, ""])[1];
        //         const classes = (element.match(/class="(.*?)"/i) || [,""])[1].split(' ');

        //         element = {};
        //         element["id"] = id;
        //         element["class"] = classes;
        //         elements.push(element);
        //     }
        //     console.log("All elements", elements);

        //     // You can now also filter elements
        //     // console.log("All elements having btn class")    
        //     // console.log(elements.filter(element => element.class.indexOf("btn") != -1));

        //     return elements;
        // }

        // function to convert html string to dom element.
        function convertToDom(contentElements) {
            var xmlString = contentElements;
            var doc = new DOMParser().parseFromString(xmlString, "text/html");
            // console.log(doc, doc.firstChild.innerHTML);
            return doc;
        }

        // function to get xpath from the converted dom element.
        function getXPathForElement(element) {
            const idx = (sib, name) => sib
                ? idx(sib.previousElementSibling, name || sib.localName) + (sib.localName == name)
                : 1;
            const segs = elm => !elm || elm.nodeType !== 1
                ? ['']
                : elm.id && document.getElementById(elm.id) === elm
                    ? [`id("${elm.id}")`]
                    : [...segs(elm.parentNode), `${elm.localName.toLowerCase()}[${idx(elm)}]`];
            return segs(element).join('/');
        }

        // function to get element by xpath.
        function getElementByXPath(path) {
            return (new XPathEvaluator())
                .evaluate(path, document.documentElement, null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE, null)
                .singleNodeValue;
        }

        // function to scrap url, date, name, orderId, etc and store in array.
        function fetchOrderLinks(elementArray) {
            var links, productArray = [];

            for (var index = 0; index < elementArray.length; index++) {
                links = elementArray[index].getElementsByTagName('a');
                const textState = links[0].innerText;
                if (links[0].href.includes('/your-orders/pop/ref=')) {
                    if(!productArray.includes(links[0].href) && textState.includes('\nOrdered on')) {
                        const string = textState.replace(/[\t\n\r]/g, '');
                        const [productName, date] = string.split('Ordered on ');
                        productArray.push({'url': links[0].href, 'actualOrderDate': date, 'orderDate': formatDate(date), 'orderProductName': productName, 'orderYear': formatDate(date, 'year')});
                    }
                }
            }

            if (productArray.length > 0) {
                for (var hrefIndex = 0; hrefIndex < productArray.length; hrefIndex++) {
                    const currentUrl = productArray[hrefIndex].url;
                    const orderId = currentUrl.substring(currentUrl.indexOf('orderId='), currentUrl.indexOf('&packageId'));
                    const key = orderId.split('=')[0];
                    const value = orderId.split('=')[1];
                    productArray[hrefIndex][key] = value;
                    // console.log(productArray);
                }
                filterOrderOnDate(productArray);
            }
        }

        // function to store json in localstorage of client browser.
        function jsonToLocal(data) {
            if (localStorage.getItem("orderJsonData") == null) {
                localStorage.setItem('orderJsonData', JSON.stringify(data));
            } else {
                localStorage.removeItem("orderJsonData");
                console.log('Deleted...');
                jsonToLocal(data);
            }
        }

        // function to filter data based on date range i.e. startDate & endDate.
        function filterOrderOnDate(productArray) {
            const orderDataFiltered = [];
            for (var index = 0; index < productArray.length; index++) {
                const currentOrderDate = productArray[index].orderDate;
                if ((dateToDateParser(startDate) <= dateToDateParser(currentOrderDate)) && (dateToDateParser(currentOrderDate) <= dateToDateParser(endDate))) {
                    orderDataFiltered.push(productArray[index]);
                }
            }
            jsonToLocal(orderDataFiltered);
            // function call back if need to download the json file.
            // jsonDownload(orderDataFiltered, 'orderDataFilteredFile');


            // function call to back if need to send json data to server using ajax call.
            sendJSON(orderDataFiltered);
            // console.log(orderDataFiltered);

            // Flag to know whether the scripting for the current page is completed or not.
            completedScrap = false;
        }

        // function to send json data to server using ajax call.
        function sendJSON(orderDataFiltered){
               
            // Creating a XHR object
            let xhr = new XMLHttpRequest();
            // let url = "submit.php"; set url of server
        
            // open a connection
            xhr.open("POST", url, true);
  
            // Set the request header i.e. which type of content you are sending
            xhr.setRequestHeader("Content-Type", "application/json");
  
            // Create a state change callback
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    console.log(xhr.responseText);
                }
            };
  
            // Sending data with the request
            xhr.send(orderDataFiltered);
        }

        // function to download the json file
        // function jsonDownload(data, filename){

        //     if(!data) {
        //         console.error('Console.save: No data')
        //         return;
        //     }
        
        //     if(!filename) filename = 'console.json'
        
        //     if(typeof data === "object"){
        //         data = JSON.stringify(data, undefined, 4)
        //     }
        
        //     var blob = new Blob([data], {type: 'text/json'}),
        //         e    = document.createEvent('MouseEvents'),
        //         a    = document.createElement('a')
        
        //     a.download = filename
        //     a.href = window.URL.createObjectURL(blob)
        //     a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':')
        //     e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
        //     a.dispatchEvent(e)
        //     console.log(a);
        //  }

        function dateToDateParser(date) {
            return Date.parse(date);
        }
})();
