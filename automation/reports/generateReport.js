const fs = require("fs");
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { google } = require('googleapis');
const teamDriveParent = '1qzespq-LG5ldlyNtjezrQGDlxLwQRjaO';
const reportsTemplate = '1InFEkDkX4vaJb5a5w6aLfjkCWJpIEBJgszm58saTFi0';

function camelize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

async function cloneReportFile(auth, versionConfig, platformSource, toDate) {
    var copyRequest = {
        name: `${camelize(platformSource)} Order Scraping - ${toDate} Config - ${versionConfig.configIdentifier}`,
        parents: [teamDriveParent],
    };
    const drive = google.drive({ version: 'v3', auth });
    return await drive.files.copy({  
        fileId: reportsTemplate,
        supportsAllDrives: true,
        requestBody: copyRequest
    });
}

async function setPermission(auth, email, fileId) {
    const drive = google.drive({ version: 'v3', auth });
    return await drive.permissions.create({
        resource: {
          type: "user",
          role: "writer",
          emailAddress: email,
        },
        fileId: fileId,
        fields: "*",
        supportsAllDrives: true
      });
}

function getValue(objArray, filter) {
    let value = 0;
    let data = objArray.filter(function(item) {
        if(filter) {
            for (var key in filter) {
              if (item[key] === undefined || item[key] != filter[key])
                return false;
            }
        }
      return true;
    });
    if(!data.length) {
        return value;
    }
    data.map(d => {
        return value += parseInt(d.count)
    });
    return value;
}

function frameReason(objArray, filter) {
    let cellVal = '';
    const newLine = String.fromCharCode(10);
    let dataArr = null;
    if(filter) {
        dataArr = objArray.filter(function(item) {
            for (var key in filter) {
              if (item[key] === undefined || item[key] != filter[key])
                return false;
            }
            return true;
        });
    }
    objArray = dataArr || objArray;
    for (const [i, obj] of objArray.entries()) {
        const lineBreak = i === objArray.length-1 ? '' : newLine;
        cellVal += `${obj.count} - ${obj.message}` + lineBreak; 
    }
    return cellVal;
}

function frameReasonFailedOrder(objArray, filter) {
    let mainLine = '';
    let mainMessage = '';
    let allMessages = [];
    const newLine = String.fromCharCode(10);
    let dataArr = null;
    if(filter) {
        dataArr = objArray.filter(function(item) {
            for (var key in filter) {
              if (item[key] === undefined || item[key] != filter[key])
                return false;
            }
            return true;
        });
    }
    objArray = dataArr || objArray;
    if(!objArray.length) {
        return mainLine;
    }
    objArray.sort((a,b) => b.count - a.count);
    mainMessage = objArray[0].message;
    mainLine = `≈ ${objArray[0].count} - ${mainMessage}` + newLine;
    objArray.forEach((obj) => {
        if(obj.message.toLowerCase().indexOf('unknown error type') > -1) {
            obj.message = obj.message.split('-')[0]
        }
        allMessages.push(obj.message);
    });
    allMessages = [...new Set(allMessages)];
    if(allMessages.includes(mainMessage)) {
        allMessages = allMessages.filter(e => e !== mainMessage)
    }
    return mainLine + 'Others - ' + allMessages.join(', ');
}

function formatDateText(dateString) {
    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'long' });
    const suffix = (i) =>{
        var j = i % 10,
            k = i % 100;
        if (j == 1 && k != 11) {
            return i + "st";
        }
        if (j == 2 && k != 12) {
            return i + "nd";
        }
        if (j == 3 && k != 13) {
            return i + "rd";
        }
        return i + "th";
    }
    return `${suffix(dateString.split('-')[2])} ${month}`;
}

async function updateConnectionData(doc, data, versionConfig, toDate) {
    let i = 0;
    for (const platform of ['ios', 'android']) {
        const connectionSheet = doc.sheetsByIndex[i];
        await connectionSheet.loadCells('A1:G17');
        const connectionData = data[platform].connectionBreakdown;
        // Connections value
        const connectedInitatedFilter = {'status':'Connected','order_status':'Initiated'};
        const connectedInitated = connectionSheet.getCellByA1('E6');
        connectedInitated.value = getValue(connectionData,connectedInitatedFilter);
        const connectedInitatedReason = connectionSheet.getCellByA1('F6');
        connectedInitatedReason.value = frameReason(connectionData,connectedInitatedFilter);

        const connectedCompletedFilter = {'status':'Connected','order_status':'Completed'};
        const connectedCompleted = connectionSheet.getCellByA1('E7');
        connectedCompleted.value = getValue(connectionData,connectedCompletedFilter);
        const connectedCompletedReason = connectionSheet.getCellByA1('F7');
        connectedCompletedReason.value = frameReason(connectionData,connectedCompletedFilter);

        const connectedFailedFilter = {'status':'Connected','order_status':'Failed'};
        const connectedFailed = connectionSheet.getCellByA1('E8');
        connectedFailed.value = getValue(connectionData,connectedFailedFilter);
        const connectedFailedReason = connectionSheet.getCellByA1('F8');
        connectedFailedReason.value = frameReason(connectionData,connectedFailedFilter);

        const connectedNoneFilter = {'status':'Connected','order_status':'None'};
        const connectedNone = connectionSheet.getCellByA1('E9');
        connectedNone.value = getValue(connectionData,connectedNoneFilter);
        const connectedNoneReason = connectionSheet.getCellByA1('F9');
        connectedNoneReason.value = frameReason(connectionData,connectedNoneFilter);

        const connectionInProgress = connectionSheet.getCellByA1('C10');
        connectionInProgress.value = getValue(connectionData,{'status':'ConnectionInProgress'});
        const disconnected = connectionSheet.getCellByA1('C11');
        disconnected.value = getValue(connectionData,{'status':'ConnectedAndDisconnected'});
        const connectedException = connectionSheet.getCellByA1('C12');
        connectedException.value = getValue(connectionData,{'status':'ConnectedButException'});

        const NCInitiatedFilter = {'status':'NeverConnected','order_status':'Initiated'};
        const NCInitiated = connectionSheet.getCellByA1('E13');
        NCInitiated.value = getValue(connectionData,NCInitiatedFilter);
        const NCInitiatedReason = connectionSheet.getCellByA1('F13');
        NCInitiatedReason.value = frameReason(connectionData,NCInitiatedFilter);

        const NCFailedFilter = {'status':'NeverConnected','order_status':'Failed'};
        const NCFailed = connectionSheet.getCellByA1('E14');
        NCFailed.value = getValue(connectionData,NCFailedFilter);
        const NCFailedReason = connectionSheet.getCellByA1('F14');
        NCFailedReason.value = frameReason(connectionData,NCFailedFilter);

        const NCNoneFilter = {'status':'NeverConnected','order_status':'None'};
        const NCNone = connectionSheet.getCellByA1('E15');
        NCNone.value = getValue(connectionData,NCNoneFilter);
        const NCNoneReason = connectionSheet.getCellByA1('F15');
        NCNoneReason.value = frameReason(connectionData,NCNoneFilter);

        // Unsuccessful
        const unsuccessfulConData = data[platform].unsuccessfulConnection;
        const unsuccessfulConCell = connectionSheet.getCellByA1('C17');
        unsuccessfulConCell.value = getValue(unsuccessfulConData);
        const unsuccessfulConReason = connectionSheet.getCellByA1('F17');
        unsuccessfulConReason.value = frameReason(unsuccessfulConData);

        const head1 = connectionSheet.getCellByA1('B2');
        head1.value = `New connections (${camelize(platform)}) - ${formatDateText(versionConfig[`${platform}ProdDeployedDate`])} - ${formatDateText(toDate)} (version - ${versionConfig[`${platform}VersionCoinout`]})`
        const head2 = connectionSheet.getCellByA1('B3');
        head2.value = `Total ${camelize(platform)} users upgraded - ${data[platform].totalUpdatedusers}`
        const head3 = connectionSheet.getCellByA1('B4');
        head3.value = `Total new connections ${camelize(platform)} - ${data[platform].totalConnection}`
        await connectionSheet.saveUpdatedCells();
        i++;
    }
}

function getStructureForOne(sheetId, rowItems) {
    const bufferRows = 4;
    const endRowIndex = bufferRows + rowItems.length * 2;
    return [
        {
            unmergeCells: {
                range: {
                    sheetId: sheetId,
                    startRowIndex: bufferRows,
                    endRowIndex: endRowIndex,
                    startColumnIndex: 6,
                    endColumnIndex: 7
                  }
            }
        },
        {
            unmergeCells: {
                range: {
                    sheetId: sheetId,
                    startRowIndex: bufferRows,
                    endRowIndex: endRowIndex,
                    startColumnIndex: 7,
                    endColumnIndex: 8
                  }
            }
        },
        {
            unmergeCells: {
                range: {
                    sheetId: sheetId,
                    startRowIndex: bufferRows,
                    endRowIndex: endRowIndex,
                    startColumnIndex: 8,
                    endColumnIndex: 9
                  }
            }
        },
        {
            copyPaste: {
                source: {
                    sheetId: sheetId,
                    startRowIndex: bufferRows,
                    endRowIndex: bufferRows + 1,
                    startColumnIndex: 6,
                    endColumnIndex: 7 
                },
                destination:{
                    sheetId: sheetId,
                    startRowIndex: endRowIndex - 1,
                    endRowIndex: endRowIndex,
                    startColumnIndex: 6,
                    endColumnIndex: 7
                },
                pasteType: "PASTE_NORMAL"
            }
        },
        {
            updateBorders: {
                bottom: {
                    color: {
                        red: 0,
                        green: 0,
                        blue: 0,
                    },
                    style: 'SOLID'
                },
                range: {
                    sheetId: sheetId,
                    startRowIndex: endRowIndex - 1,
                    endRowIndex: endRowIndex,
                    startColumnIndex: 6,
                    endColumnIndex: 7
                }
            }
        },
        {
            copyPaste: {
                source: {
                    sheetId: sheetId,
                    startRowIndex: endRowIndex -1,
                    endRowIndex: endRowIndex,
                    startColumnIndex: 5,
                    endColumnIndex: 6 
                },
                destination:{
                    sheetId: sheetId,
                    startRowIndex: endRowIndex - 1,
                    endRowIndex: endRowIndex,
                    startColumnIndex: 7,
                    endColumnIndex: 8
                }
            }
        },
        {
            copyPaste: {
                source: {
                    sheetId: sheetId,
                    startRowIndex: bufferRows,
                    endRowIndex: bufferRows + 1,
                    startColumnIndex: 8,
                    endColumnIndex: 9 
                },
                destination:{
                    sheetId: sheetId,
                    startRowIndex: endRowIndex - 1,
                    endRowIndex: endRowIndex,
                    startColumnIndex: 8,
                    endColumnIndex: 9
                }
            }
        },
        {
            updateBorders: {
                bottom: {
                    color: {
                        red: 0,
                        green: 0,
                        blue: 0,
                    },
                    style: 'SOLID'
                },
                range: {
                    sheetId: sheetId,
                    startRowIndex: endRowIndex -1,
                    endRowIndex: endRowIndex,
                    startColumnIndex: 8,
                    endColumnIndex: 9 
                }
            }
        },
    ];
}

function getStructure(sheetId, rowItems) {
    const bufferRows = 4;
    const endRowIndex = bufferRows + rowItems.length * 2;
    console.log('row items ', rowItems, endRowIndex);
    return [
        {
            copyPaste: {
                source: {
                    sheetId: sheetId,
                    startRowIndex: 4,
                    endRowIndex: 6,
                    startColumnIndex: 2,
                    endColumnIndex: 6 
                },
                destination:{
                    sheetId: sheetId,
                    startRowIndex: 6,
                    endRowIndex: endRowIndex,
                    startColumnIndex: 2,
                    endColumnIndex: 6
                }
            }
        },
        {
            mergeCells: {
                range: {
                    sheetId: sheetId,
                    startRowIndex: 4,
                    endRowIndex: endRowIndex,
                    startColumnIndex: 1,
                    endColumnIndex: 2
                  },
                  mergeType: "MERGE_ALL"
            }
        },
        {
            mergeCells: {
                range: {
                    sheetId: sheetId,
                    startRowIndex: bufferRows,
                    endRowIndex: bufferRows + (rowItems.length),
                    startColumnIndex: 6,
                    endColumnIndex: 7
                  },
                  mergeType: "MERGE_COLUMNS"
            }
        },
        {
            copyPaste: {
                source: {
                    sheetId: sheetId,
                    startRowIndex: bufferRows,
                    endRowIndex: bufferRows + (rowItems.length),
                    startColumnIndex: 6,
                    endColumnIndex: 7 
                },
                destination:{
                    sheetId: sheetId,
                    startRowIndex: bufferRows,
                    endRowIndex: endRowIndex,
                    startColumnIndex: 6,
                    endColumnIndex: 7
                }
            }
        },
        {
            mergeCells: {
                range: {
                    sheetId: sheetId,
                    startRowIndex: bufferRows,
                    endRowIndex: bufferRows + (rowItems.length),
                    startColumnIndex: 7,
                    endColumnIndex: 8
                  },
                  mergeType: "MERGE_COLUMNS"
            }
        },
        {
            copyPaste: {
                source: {
                    sheetId: sheetId,
                    startRowIndex: bufferRows,
                    endRowIndex: bufferRows + (rowItems.length),
                    startColumnIndex: 7,
                    endColumnIndex: 8 
                },
                destination:{
                    sheetId: sheetId,
                    startRowIndex: bufferRows,
                    endRowIndex: endRowIndex,
                    startColumnIndex: 7,
                    endColumnIndex: 8
                }
            }
        },
        {
            mergeCells: {
                range: {
                    sheetId: sheetId,
                    startRowIndex: bufferRows,
                    endRowIndex: bufferRows + (rowItems.length),
                    startColumnIndex: 8,
                    endColumnIndex: 9
                  },
                  mergeType: "MERGE_COLUMNS"
            }
        },
        {
            copyPaste: {
                source: {
                    sheetId: sheetId,
                    startRowIndex: bufferRows,
                    endRowIndex: bufferRows + (rowItems.length),
                    startColumnIndex: 8,
                    endColumnIndex: 9
                },
                destination:{
                    sheetId: sheetId,
                    startRowIndex: bufferRows,
                    endRowIndex: endRowIndex,
                    startColumnIndex: 8,
                    endColumnIndex: 9
                }
            }
        }
    ];
}

async function updateStructure(sheets, fileId, sheetId, rowItems) {
    let requestArray = [];
    if(rowItems.length > 1) {
        requestArray = getStructure(sheetId, rowItems);
    } else {
        requestArray = getStructureForOne(sheetId, rowItems);
    }
    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: fileId,
        requestBody:{
            requests: requestArray
        }
    });
}

async function updateOrderUploadData(auth, fileId, data, versionConfig, toDate) {
    let i = 2;
    const sheets = google.sheets({version: 'v4', auth});
    const allsheets = await sheets.spreadsheets.get({
        spreadsheetId: fileId
    });
    for (const platform of ['ios','android']) {
        const sheetId = allsheets.data.sheets[i].properties.sheetId;
        let dataO = [];
        const bufferRows = 4;
        const orderData = data[platform].orderScrapedData;
        const unsuccessfulOrderCount = data[platform].unsuccessfulOrderUploadCount;
        const unsuccessfulOrderBreakdown = data[platform].unsuccessfulOrderUploadBreakdown;
        let rowItems = orderData.map(v => parseInt(v.panelist_scraping_count));
        rowItems = [...new Set(rowItems)];
        const endRowIndex = bufferRows + rowItems.length * 2;
        await updateStructure(sheets, fileId, sheetId, rowItems);
        for (let index = 0; index < rowItems.length; index++) {
            dataO.push([ index + 1, 'CSV', getValue(orderData,{'panelist_scraping_count': index + 1,'scrapping_type':'report'})]);
            dataO.push([ '', 'HTML', getValue(orderData,{'panelist_scraping_count': index + 1,'scrapping_type':'html'}) ]);
        }
        const data1 = await sheets.spreadsheets.values.get({
            spreadsheetId: fileId,
            range: `Order History - ${platform.toLowerCase()}!G5:I${endRowIndex}`,
            majorDimension: 'ROWS'
        });
        indexId = rowItems.length > 1 ? 1 : 2;
        data1.data.values[0] = ['CSV',getValue(unsuccessfulOrderCount,{'scrappingType':'report'}),frameReasonFailedOrder(unsuccessfulOrderBreakdown, {'scrappingType':'report'})];
        const endIndexG = rowItems.length > 1 ? data1.data.values.length - 1 : 1;
        data1.data.values[endIndexG] = ['HTML',getValue(unsuccessfulOrderCount,{'scrappingType':'html'}),frameReasonFailedOrder(unsuccessfulOrderBreakdown, {'scrappingType':'html'})];
        const platformText = platform === 'ios' ? 'iOS' : 'Android';
        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: fileId,
            requestBody: {
                data: [
                {
                    values:  dataO,
                    range: `Order History - ${platform.toLowerCase()}!D5:F${endRowIndex}`,
                    majorDimension: 'ROWS',
                },
                {
                    values:  data1.data.values,
                    range: `Order History - ${platform.toLowerCase()}!G5:I${endRowIndex}`,
                    majorDimension: 'ROWS',
                },
                {
                    values:  [[`Cumulative Scraped Data - New connections (version - ${versionConfig[`${platform}VersionCoinout`]}) - how many panelists have scraped how many times for each scraping type`]],
                    range: `Order History - ${platform.toLowerCase()}!B2:I2`,
                    majorDimension: 'ROWS'
                },
                {
                    values:  [[`${platformText} - Order Scrapped - Scraping (${platformText} Order History Table - orderHistory)`]],
                    range: `Order History - ${platform.toLowerCase()}!B3:F3`,
                    majorDimension: 'ROWS'
                },
                {
                    values:  [[`${formatDateText(versionConfig[`${platform}ProdDeployedDate`])} - ${formatDateText(toDate)}`]],
                    range: `Order History - ${platform.toLowerCase()}!B5:${endRowIndex}`,
                    majorDimension: 'ROWS'
                }
            ],
                valueInputOption: 'USER_ENTERED'
            }
        });
        i++;
    }
}

async function main(auth, data, versionConfig, platformSource, toDate) {
    let account = fs.readFileSync('./serviceAccount.json', { encoding: 'utf8', flag: 'r' });
    account = JSON.parse(account);
    const clonedFile = await cloneReportFile(auth, versionConfig, platformSource, toDate);
    const fileId = clonedFile.data.id;
    await setPermission(auth, account.client_email, fileId);
    // const fileId = '10P86xXsr2BM23TsyM2ilf9N8JalVxli3o1lLweHO7yI';
    console.log('Report file Id', fileId);
    const doc = new GoogleSpreadsheet(fileId);
    await doc.useServiceAccountAuth({
        client_email: account.client_email,
        private_key: account.private_key,
    });
    await doc.loadInfo();
    await updateConnectionData(doc, data, versionConfig, toDate);
    await updateOrderUploadData(auth, fileId, data, versionConfig, toDate)
}

async function testIntegration(auth) {
    try {
    const sheets = google.sheets({version: 'v4', auth});
    const allsheets = await sheets.spreadsheets.get({
        spreadsheetId: reportsTemplate
    });
    if(allsheets.data) {
        console.log('Integration works ', allsheets.data.sheets[0].properties.sheetId);
    }
    } catch(e) {
        console.log('Integration test failed');
        console.log(e);
        throw 'Something went wrong';
    }
}


module.exports = { main, testIntegration };