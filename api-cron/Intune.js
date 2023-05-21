const axios = require('axios');
const qs = require('qs');

const scope = "https://graph.microsoft.com/.default";
//Intune endpoint
const endpoint = "https://graph.microsoft.com/beta/deviceManagement/managedDevices";

//Generate access token for further use in APIs
const getAccessTokenI = async (clientId, clientSecret, tenantId) => {
    const data = qs.stringify({
        'grant_type': 'client_credentials',
        'client_id': clientId,
        'client_secret': clientSecret,
        'scope': scope
    });

    const options = {
        method: 'post',
        url: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data
    };

    try {
        const response = await axios(options);
        return response.data.access_token;
    } catch (error) {
        console.log(error);
    }
};

//Retrives Intune devices 
const getIntuneDevices = async (clientId, clientSecret, tenantId) => {
    if (!clientId || !clientSecret || !tenantId) {
        return [];
    }
    try {
        const authToken = await getAccessTokenI(clientId, clientSecret, tenantId);
        const headers = {
            Accept: "application/json", "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
        };

        const { data } = await axios.get(endpoint, { headers });
        return data.value;

    } catch (error) {
        console.log(`Error: ${error}` + ` -- URL used: ${endpoint} `);
    }
};

//Fault check if tenant name is inncorect 
const fetchIntuneDevicesForTenant = async (tenantIdentifier, keyTenant) => {
    const tenant = keyTenant[tenantIdentifier];

    if (!tenant) {
        throw new Error(`Invalid tenant identifier: ${tenantIdentifier}`);
    }

    return getIntuneDevices(tenant.clientId, tenant.clientSecret, tenant.tenantId);
};

module.exports = { fetchIntuneDevicesForTenant };
