const fs = require('fs');
const path = require('path');

(async () => {
    const readTextFile = (filePath) => {
        const rows = [];
        fs.readFileSync(filePath, 'utf-8').split(/\r?\n/).forEach(function(line){
            rows.push(line);
        });
        return rows;
    }
    const readFile = async (filePath) => {
        return new Promise((res,rej) => {
            const results = [];
            fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                res(results);
            })
            .on('error', (e) => {
                rej(e)
            });
        });
    }

    const formArray = (data) => {
        return data.split(',');
    }

    const matchASINByPattern = (value) => {
        // is All Caps
        if(value !== value.toUpperCase()) {
            return false
        }
        // is length 10
        if(value.length != 10) {
            return false;
        }
        // Does it starts with 'B'
        // if(value.charAt(0) !== 'B') {
        //     return false;
        // }
        return true;
    }

    const matchCategoryByPattern = (value) => {
        // is All Caps
        if(value !== value.toUpperCase()) {
            return false
        }
        // has whitespace
        if(value.indexOf(' ') >= 0) {
            return false;
        }
        // Does it starts with 'B'
        const hasSpecialChar = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(value);
        if(hasSpecialChar) {
            return value.indexOf('_') >= 0 ? true : false;
        }
        return true;
    }

    const getAllFiles = (dir) => {

        // get all 'files' in this directory
        var all = fs.readdirSync(dir);
    
        // process each checking directories and saving files
        return all.map(file => {
            // am I a directory?
            if (fs.statSync(`${dir}/${file}`).isDirectory()) {
                // recursively scan me for my files
                return getAllFiles(`${dir}/${file}`);
            }
            // WARNING! I could be something else here!!!
            return `${file}`;     // file name (see warning)
        });
    }

    const camelize = (str) => {
        return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
          return index === 0 ? word.toLowerCase() : word.toUpperCase();
        }).replace(/\s+/g, '');
    }

    const refitData = (headers,parsedData) => {
        const allowedData = ['orderDate','orderID','title','category','asin','uNSPSCCode','website','releaseDate','condition','seller','sellerCredentials','listPricePerUnit','purchasePricePerUnit','quantity','shipmentDate','orderStatus','itemSubtotal','itemSubtotalTax','itemTotal','taxExemptionApplied','taxExemptionType','exemptionOpt-Out','currency'];
        headers = headers.filter(head =>  allowedData.includes(head['id']));
        parsedData.map(data => {
            Object.keys(data).forEach(ok => {
                if(!allowedData.includes(ok)) {
                    delete data[ok];
                }
            });
            return data;
        });
        return [headers, parsedData]
    }

    const writeToFile = async (lineHeaders, data, outputFile) => {
        const headers = lineHeaders.map(lh => {
            lh.replace('-','');
            const header = camelize(lh) === 'aSIN/ISBN' ? 'asin' : camelize(lh);
            return { id: header, title: lh }
        })
        const createCsvWriter = require('csv-writer').createObjectCsvWriter;
        let parsedData = data.map((rowData) => {
            const d = {};
            if(headers.length == rowData.length) {
                rowData.map((v,i) => {
                    return d[headers[i].id] = v;
                });
                return d;
            } else{
                // console.log('Unmatched headers ', rowData, rowData.length)
            }
        });
        // console.log(parsedData)
        parsedData = parsedData.filter((m,i) => {
            if(m) return m;
        })
        if(lineHeaders.length > 23) {
            // Refix data with retaining only 23 columns
            const [headerData, parsedRefitData] = refitData(headers,parsedData);
        }
        const csvWriter = createCsvWriter({
            path: outputFile,
            header: headers
        });
        // return;
        // await csvWriter.writeRecords(parsedData) ;
        return parsedData.length;
    }

    const parseCSV = (filePath) => {
        let csvFile = readTextFile(filePath);
        const lineHeaders = formArray(csvFile[0]);
        csvFile.shift();
        const total = csvFile.length;
        const data = [];
        // console.log('lineHeaders length ', lineHeaders.length, filePath);
        // return [0,0,0];
        for (const row of csvFile) {
            const rowArray = rowArrayCopy = formArray(row);
            if(rowArray.length != lineHeaders.length) {
                // Row with comma issue
                // read from reverse & match ASIN & Category
                let isAsinColumnFound = false;
                let asinColumnIndex = null;
                // find ASIN index
                for (let index = rowArray.length; index >= 0; index--) {
                    const columnValue = rowArray[index];
                    if(!isAsinColumnFound && columnValue && matchASINByPattern(columnValue)) {
                        isAsinColumnFound = true;
                        asinColumnIndex = index;
                    }
                }
                if(asinColumnIndex) {
                    const categoryIndex = asinColumnIndex - 1;
                    const categoryStringTest = matchCategoryByPattern(rowArray[categoryIndex]);
                    // Verify if this is 
                    if(categoryStringTest) {
                        // Combine between items into the product
                        const productEndIndex = categoryIndex - 1;
                        const productElArray = rowArrayCopy.slice(2, productEndIndex + 1);
                        const productTitle = productElArray.join(',');
                        rowArray.splice(2,productElArray.length, productTitle);
                        if(rowArray.length == 24) {
                            // Merge seller row data
                            const seller = rowArray[9] + ', ' + rowArray[10];
                            rowArray.splice(9,2, seller);
                            // console.log('data metrics ', rowArray, rowArray.length)
                        }
                    } else {
                        // console.log('Cannot find Index of Category column for orderId ', rowArray[1], filePath);
                    }
                    data.push(rowArray);
                } else {
                    // console.log('Cannot find Index of ASIN column for orderId ', rowArray[1], filePath);
                }
            } else {
                data.push(rowArray);
            }
        }
        return [lineHeaders,data, total];
    }

    try {
        const files = getAllFiles('error_csv');
        const csvFilepath = files;
        for (let inputFile of csvFilepath) {            
            // const inputFile = '04-Jun-2019_to_07-Jun-2021-57fc9424-7f58-4954-90b2-4786e03c793b';
            const file = path.join(process.cwd(),'error_csv', inputFile.replace('.csv',''));
            outputFile = path.join(process.cwd(),'output_csv', inputFile.replace('.csv',''));
            const [lineHeaders,data, totalRows] = parseCSV(`${file}.csv`);
            // console.log(JSON.stringify(data));
            const dataWritten = await writeToFile(lineHeaders, data, `${outputFile}.csv`);
            console.log('----------------------File ----------------------------');
            console.log('Total row', totalRows);
            console.log('Parsed rows', dataWritten);
            console.log('Row Skipped ', totalRows - dataWritten)
            console.log('---------------------- File End----------------------------');
        }
    } catch (e) {
        console.log('Errorrrrr ', e);
    }
})();