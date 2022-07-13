function callback(data) {
  const androidCallback = window.Android;
  if (typeof androidCallback != "undefined") {
    androidCallback.showToast(JSON.stringify(data));
  }
  if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.iOS) {
    window.webkit.messageHandlers.iOS.postMessage(JSON.stringify(data));
  }
  console.log('Result ', data)
}

workFlowData = window.inputData || inputData;

if (workFlowData.type === 'listing') {
  callback({
    "type": "orderlist",
    "status": "success",
    "isError": false,
    "errorMessage": null,
    "data": [
      {
        "orderId": "111-5936358-9519418",
        "itemName": "Delivered Saturday",
        "orderDate": "6-2-2021",
        "detailsUrl": "https://www.amazon.com/gp/aw/ya?oid=111-5936358-9519418"
      },
      {
        "orderId": "111-2824840-2978647",
        "itemName": "Delivered Sunday",
        "orderDate": "6-2-2021",
        "detailsUrl": "https://www.amazon.com/gp/aw/ya?oid=111-2824840-2978647"
      }
    ]
  })
}
if (workFlowData.type === 'details') {
  callback({
    "type": "orderdetails",
    "status": "success",
    "isError": false,
    "errorMessage": null,
    "data": {
      "Order date": "3-24-2021",
      "Order #": "111-6950119-4535436",
      "Order total": "$13.38",
      "items": [
        {
          "itemStatus": "Delivered",
          "itemStatusDate": "3-25-2021",
          "itemUrl": "https://www.amazon.com/gp/aw/d/B00GJ9SYWM/ref=ya_aw_od_pi?ie=UTF8&psc=1",
          "itemPrice": "$12.45",
          "itemTitle": "Malden 4x6 4-Opening Matted Collage Picture Frame, Displays Four, Black",
          "itemQuantity": "1",
          "itemSeller": "MMP Living"
        }
      ],
      "orderSummary": {
        "Items:": "$12.45",
        "Shipping & Handling:": "$0.00",
        "Total Before Tax:": "$12.45",
        "Estimated Tax Collected:": "$0.93",
        "Order Total": "$13.38",
        "Payment Total:": "INR 1,004.59"
      }
    }
  })
}