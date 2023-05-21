const axios = require('axios');

//Cisco Umbrella endpoint
const apiURL = 'https://api.umbrella.com/deployments/v2/roamingcomputers';

//Generate access token for further use in APIs
const getToken = async (apiKey, apiSecret) => {
    try {
        const authString = `${apiKey}:${apiSecret}`;
        const encodedAuthString = Buffer.from(authString).toString('base64');
        const tokenResponse = await axios.post('https://api.umbrella.com/auth/v2/token', {
            grant_type: 'client_credentials',
        }, {
            headers: {
                Authorization: `Basic ${encodedAuthString}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        const accessToken = tokenResponse.data.access_token;
        return accessToken;

    } catch (error) {
        console.error(`Error getting access token: ${error}`);
    }
};

//API call to retrieve device information 
const getUmbrellaInfo = async (apiKey, apiSecret) => {
    if (!apiKey || !apiSecret) {
        return []; // return an empty array if clientId or clientSecret is missing
    }
    try {
        const authToken = await getToken(apiKey, apiSecret);
        const headers = {
            Accept: "application/json", "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
        };
        const { data } = await axios.get(apiURL, { headers });
        return data; //returns object 

    } catch (error) {
        console.log(`Error: ${error}` + ` -- URL used: ${apiURL} `);
    }
};

//Fault check if tenant name is inncorect 
const fetchUmbrellaInfoForTenant = async (tenantIdentifier, keyTenant) => {
    const tenant = keyTenant[tenantIdentifier];

    if (!tenant) {
        throw new Error(`Invalid tenant identifier: ${tenantIdentifier}`);
    }

    return getUmbrellaInfo(tenant.apiKey, tenant.apiSecret);
};

module.exports = { fetchUmbrellaInfoForTenant };
