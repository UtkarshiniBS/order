const fs = require('fs');
const Queries = require('./queries');
const Report = require('./generateReport');
const {google} = require('googleapis');

(async () => {
    try {
        const args = process.argv.slice(2);
        // const platformSource = args.length ? args[0] : 'amazon';
        // const data = JSON.parse(fs.readFileSync('./data.json', { encoding: 'utf8', flag: 'r' }));
        const config = JSON.parse(fs.readFileSync('./config.json', { encoding: 'utf8', flag: 'r' }));
        const date  = new Date();
        date.setDate(date.getDate()-1);
        const toDate = date.toISOString().split('T')[0];
        const getJwt = () => {
            var credentials = require("./serviceAccount.json");
            return new google.auth.JWT(
              credentials.client_email, null, credentials.private_key,
              ['https://www.googleapis.com/auth/spreadsheets','https://www.googleapis.com/auth/drive']
            );
        }
        const auth = getJwt();
        await Report.testIntegration(auth);
        if(config.versionConfig && config.versionConfig.length) {
            for (const versionConfig of config.versionConfig) {
                await Queries.setUpgradedUsers(config, versionConfig);
                for (const platformSource of ['amazon','walmart','instacart']) {                    
                    const data = await Queries.init(platformSource, config, versionConfig, toDate);
                    await Report.main(auth, data, versionConfig, platformSource, toDate);       
                }
            }
        }
    } catch (e) {
        console.log('Errorrrrr ', e);
    }
})();