const axios = require('axios');
const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require('@azure/keyvault-secrets');

//API endpoint URL to fetch groups in azure
const groupURL = 'https://graph.microsoft.com/v1.0/groups';

//Generate access token for further use in APIs
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

//Fetches groups in azure starting with the name "test-tussa", puts the properties name and id in an individual object and returns it
const getIntuneGroups = async () => {
    try {

        const filter = "?$filter=startswith(displayName, 'test-tussa')";

        const authToken = await getAccessTokenI();
        const headers = {
            Accept: "application/json", "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
        };

        const res = await axios.get(groupURL + filter, { headers });

        const groups = res.data.value.map(group => {
            return {
                displayName: group.displayName,
                id: group.id
            };
        });

        console.log("GROUP: " + groups);
        return groups;

    } catch (error) {
        console.log(`Error: ${error}` + ` -- URL used: ${groupURL} `);
    }
};

//Fetches members from a azure groups and generates an induvidual object with their name and mail properties and returns it
const getGroupMembers = async (grpId) => {
    try {

        const filter = `/${grpId}/members`;

        const authToken = await getAccessTokenI();
        const headers = {
            Accept: "application/json", "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
        };


        const res = await axios.get(groupURL + filter, { headers });
        console.log("members:" + JSON.stringify(res.data.value, null, 2));

        const members = res.data.value.map(user => {
            console.log("user: " + user.displayName);
            console.log("mail:  " + user.mail);
            return {
                displayName: user.displayName,
                mail: user.mail
            };
        })

        console.log("Members: " + members);
        return members;

    } catch (error) {
        console.log(`Error: ${error}` + ` -- URL used: ${groupURL} `);
    }

}

//Puts grafana admin password in azure key vault, appendix the time to the secret name 
const setKeyVaultSecret = async (secretValue) => {
    const now = new Date();
    const date = now.toISOString();
    const keyVaultName = "bg-admin-pwd" + date.slice(0, 10);
    const vaultURL = "https://breaking-glass-grafana.vault.azure.net/";

    try {
        const credential = new DefaultAzureCredential();
        const client = new SecretClient(vaultURL, credential);
        await client.setSecret(keyVaultName, secretValue);
        console.log(`Secret ${keyVaultName} has been added to the Azure Key Vault`);

    } catch (error) {
        console.log(`Error: ${error}` + ` -- URL used: ${vaultURL} `);
    }
};


module.exports = { getIntuneGroups, getGroupMembers, setKeyVaultSecret };