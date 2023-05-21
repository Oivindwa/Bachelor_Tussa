const axios = require('axios');

//Cisco Secure Endpoint endpoint 
const ciscoDevices = "https://api.eu.amp.cisco.com/v1/computers";

//API call to retrieve device information 
const secureEndpointDevices = async (clientId, clientSecret) => {
    if (!clientId || !clientSecret) {
        return []; // return an empty array if clientId or clientSecret is missing
    }
    try {
        const encodedAuthToken = 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const headers = {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: encodedAuthToken,
        };
        const { data } = await axios.get(ciscoDevices, { headers });
        return data.data; // returns object

    } catch (error) {
        console.error(error);
    }
};

//Fault check if tenant name is inncorect 
const seFetchDevicesForTenant = async (tenantIdentifier, keyTenant) => {
    const tenant = keyTenant[tenantIdentifier];

    if (!tenant) {
        throw new Error(`Invalid tenant identifier: ${tenantIdentifier}`);
    }

    return secureEndpointDevices(tenant.CiscoSEAPIClientId, tenant.CiscoSEAPIClientSecret);
};


module.exports = { seFetchDevicesForTenant };