const axios = require('axios');
const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");

//API endpoint URL to fetch groups in azure
const groupURL = 'https://graph.microsoft.com/v1.0/groups';

//Azure key vault 
const keyVaultURL = "https://test-tussa-vault.vault.azure.net/";

//Retrieve access token for further use in APIs
const getAccessTokenI = async () => {
    try {
        const credential = new DefaultAzureCredential();
        const scope = "https://graph.microsoft.com/.default";
        const token = await credential.getToken(scope);
        console.log("Token found");
        return token.token;

    } catch (error) {
        console.log(error);
    }
};

//Fetches groups in azure starting with the name "test-tussa", puts displayname of all the groups in an array and returns it
const getIntuneGroups = async () => {
    try {

        const filter = "?$filter=startswith(displayName, 'test-tussa-')";

        const authToken = await getAccessTokenI();
        const headers = {
            Accept: "application/json", "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
        };

        const res = await axios.get(groupURL + filter, { headers });

        const groups = res.data.value.map(group => group.displayName);
        console.log(groups);
        return groups; //returns object 

    } catch (error) {
        console.log(`Error: ${error}` + ` -- URL used: ${groupURL} `);
    }
};

//Retrieve API credentials form Azure key vault 
const getKeyVault = async (vaultName, secretName) => {
    try {
        const keyVaultURL = `https://${vaultName}.vault.azure.net`;
        const credential = new DefaultAzureCredential();
        const client = new SecretClient(keyVaultURL, credential);

        const data = await client.getSecret(secretName);
        const parsedSecret = JSON.parse(data.value);
        return parsedSecret; //returns object 

    } catch (error) {
        console.log(`Error: ${error}` + ` -- URL used: ${keyVaultURL} `);
    }
};

module.exports = { getIntuneGroups, getKeyVault };