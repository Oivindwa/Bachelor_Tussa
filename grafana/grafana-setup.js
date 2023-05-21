//Author: Sindre Schonhowd, Magnus Voll, og Øivind Wahlstrøm
//Date: 21.05.2023
const { getIntuneGroups, getGroupMembers, setKeyVaultSecret } = require('./azure-api');
const axios = require("axios");

const baseUrl = 'http://tussa-app_grafana:3000'

const basicAuth = 'Basic ' + Buffer.from('admin:admin').toString('base64');

//Creates a header for basic authenticantion 
const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "Authorization": basicAuth
};

//Creates a team in Grafana based on the tenant name
const createTeam = async (tenant) => {
    const teamData = {
        "name": tenant,
        "email": tenant + "@test.com"
    };

    try {
        const addTeamResponse = await axios.post(baseUrl + "/api/teams", teamData, { headers });
        console.log(`Team created: ${addTeamResponse.data.teamId}`);
        return addTeamResponse.data.teamId;

    } catch (error) {
        console.error(error);

    }
};


// Creates a user in Grafana based on porperties from Azure
const addUser = async (user, mail) => {
    const userData = {
        name: user,
        email: mail,
        login: mail,
        password: generateRandomPassword(20),
    };

    try {
        const addUserResponse = await axios.post(baseUrl + '/api/admin/users', userData, { headers });
        console.log(`User created: ${addUserResponse.data.id}`);
        return addUserResponse.data.id;

    } catch (error) {
        console.error(error);

    }
};

//Generates a random password
const generateRandomPassword = (length) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
    }
    return password;
}

//Assign a user to a team with the "Viewer" role
const addUserToTeam = async (teamId, userId) => {
    const userTeamData = {
        "userId": userId,
        "role": "Viewer"
    }

    try {
        const addTeam = await axios.post(baseUrl + '/api/teams/' + teamId + '/members', userTeamData, { headers });
        console.log(`User added to team: - ${addTeam.data}`);

    } catch (error) {
        console.error(error);
    }
};

//Creates a datasource that is connected to elastic to retrieve information
const dataSource = async (tenantName) => {
    const dataSourceData = {
        "name": tenantName + "-datasource",
        "type": "elasticsearch",
        "access": "proxy",
        "basicAuth": false,
        "url": "http://tussa-app_elasticsearch:9200",
        "database": tenantName, // Elasticsearch index pattern
        "jsonData": {
            "timeField": "timeField", //When data was sent gathered 
            "esVersion": 7, // Elasticsearch version (major version)
            "maxConcurrentShardRequests": 5,
            "semanticVersion": '7.17.0', // Elasticsearch full version
        },
    };

    try {
        const addDataSource = await axios.post(baseUrl + '/api/datasources', dataSourceData, { headers });
        console.log(`Data source created: ${addDataSource.data.name}`);
        return addDataSource.data.name;

    } catch (error) {
        console.error(error);

    }
};

//Creates a pre-configured dashboard based on information form the datasource 
const createDashboard = async (tenantName, dataSourceName) => {
    const dashboardData = {
        "dashboard": {
            "id": null,
            "uid": null,
            "title": 'Dashboard for: ' + tenantName,
            "panels": [
                {
                    "type": "table",
                    "title": "Table for " + tenantName,
                    "datasource": dataSourceName,
                    "fieldConfig": {
                        "defaults": {
                            "color": {
                                "mode": "fixed"
                            },
                            "custom": {
                                "align": "auto",
                                "cellOptions": {
                                    "type": "auto"
                                },
                                "filterable": false,
                                "inspect": false
                            },
                            "mappings": [],
                            "noValue": "N/A",
                            "thresholds": {
                                "mode": "absolute",
                                "steps": [
                                    {
                                        "color": "green",
                                        "value": null
                                    },
                                    {
                                        "color": "red",
                                        "value": 80
                                    }
                                ]
                            }
                        },
                        "overrides": [
                            {
                                "matcher": {
                                    "id": "byName",
                                    "options": "connector_version"
                                },
                                "properties": [
                                    {
                                        "id": "custom.width",
                                        "value": 154
                                    }
                                ]
                            },
                            {
                                "matcher": {
                                    "id": "byName",
                                    "options": "timeField"
                                },
                                "properties": [
                                    {
                                        "id": "custom.width",
                                        "value": 207
                                    }
                                ]
                            },
                            {
                                "matcher": {
                                    "id": "byName",
                                    "options": "User Principal Name "
                                },
                                "properties": [
                                    {
                                        "id": "custom.width",
                                        "value": 334
                                    }
                                ]
                            },
                            {
                                "matcher": {
                                    "id": "byName",
                                    "options": "Intune Last Sync"
                                },
                                "properties": [
                                    {
                                        "id": "custom.width",
                                        "value": 195
                                    }
                                ]
                            },
                            {
                                "matcher": {
                                    "id": "byName",
                                    "options": "SP Last Sync"
                                },
                                "properties": [
                                    {
                                        "id": "custom.width",
                                        "value": 202
                                    }
                                ]
                            },
                            {
                                "matcher": {
                                    "id": "byName",
                                    "options": "Umbrella Last Sync"
                                },
                                "properties": [
                                    {
                                        "id": "custom.width",
                                        "value": 231
                                    }
                                ]
                            },
                            {
                                "matcher": {
                                    "id": "byName",
                                    "options": "Enrolment Date"
                                },
                                "properties": [
                                    {
                                        "id": "custom.width",
                                        "value": 205
                                    }
                                ]
                            }
                        ]
                    },
                    "gridPos": {
                        "h": 20,
                        "w": 24,
                        "x": 0,
                        "y": 0
                    },
                    "id": 1,
                    "metrics": [
                        {
                            "id": "1",
                            "type": "count"
                        }
                    ],
                    "options": {
                        "cellHeight": "md",
                        "footer": {
                            "countRows": false,
                            "enablePagination": false,
                            "fields": "",
                            "reducer": [
                                "sum"
                            ],
                            "show": false
                        },
                        "showHeader": true,
                        "sortBy": [
                            {
                                "desc": false,
                                "displayName": "Compromised"
                            },
                            {
                                "desc": false,
                                "displayName": "Compliance"
                            },
                            {
                                "desc": false,
                                "displayName": "Encrypted"
                            },
                            {
                                "desc": false,
                                "displayName": "Last Sync Compare"
                            }
                        ]
                    },
                    "pluginVersion": "9.5.1",
                    "targets": [
                        {
                            "alias": "",
                            "bucketAggs": [],
                            "datasource": dataSourceName,
                            "expr": "logs",
                            "format": "time_series",
                            "interval": "",
                            "intervalFactor": 1,
                            "legendFormat": "",
                            "metrics": [
                                {
                                    "id": "1",
                                    "settings": {
                                        "size": "500"
                                    },
                                    "type": "raw_data"
                                }
                            ],
                            "query": "",
                            "refId": "A",
                            "timeField": "timeField"
                        }
                    ],
                    "timezone": "browser",
                    "title": "Table for: " + tenantName,
                    "transformations": [
                        {
                            "id": "organize",
                            "options": {
                                "excludeByName": {
                                    "_id": true,
                                    "_type": true,
                                    "highlight": true,
                                    "sort": true
                                },
                                "indexByName": {
                                    "_id": 18,
                                    "_index": 0,
                                    "_type": 20,
                                    "connector_version": 15,
                                    "device_compliance_status": 4,
                                    "device_name": 1,
                                    "enrollment_date": 10,
                                    "highlight": 17,
                                    "is_compromised": 3,
                                    "last_syncI": 7,
                                    "last_syncS": 8,
                                    "last_syncU": 9,
                                    "last_sync_compare": 6,
                                    "manufacturer_model": 12,
                                    "operating_system": 11,
                                    "sort": 19,
                                    "status_active": 5,
                                    "timeField": 16,
                                    "user_principal_name": 2,
                                    "versionS": 13,
                                    "versionU": 14
                                },
                                "renameByName": {
                                    "_id": "",
                                    "_index": "Tenant",
                                    "connector_version": "",
                                    "device_compliance_status": "Compliance ",
                                    "device_name": "Device Name",
                                    "enrollment_date": "Enrolment Date",
                                    "is_compromised": "Compromised ",
                                    "last_syncI": "Intune Last Sync",
                                    "last_syncS": "SP Last Sync",
                                    "last_syncU": "Umbrella Last Sync",
                                    "last_sync_compare": "Last Sync Compare",
                                    "manufacturer_model": "Model",
                                    "operating_system": "OS",
                                    "status_active": "Encrypted ",
                                    "user_principal_name": "User Principal Name ",
                                    "versionS": "",
                                    "versionU": ""
                                }
                            }
                        }
                    ],
                }
            ],
            "schemaVersion": 38,
            "refresh": "",
            "time": {
                "from": "now-24h",
                "to": "now"
            },
        },
        "folderId": 0,
        "message": "Dashboard created for: " + tenantName,
        "overwrite": true
    };

    try {
        console.log("CREATING DASHBOARD");
        const addDashboard = await axios.post(baseUrl + '/api/dashboards/db', dashboardData, { headers });
        console.log(`Dashboard created with UID: ${addDashboard.data.uid}`);
        return addDashboard.data.uid;

    } catch (error) {
        console.error("FAILED TO CREATE THE DASHBOARD" + error);
    }
}



//Gives a team, View permissions to a dashboard
const dashboardPermissions = async (dashboardUid, teamId) => {
    const permissionsData = {
        "items": [
            {
                "teamId": teamId,
                "permission": 1, // 1 = View, 2 = Edit, 3 = Admin
            },
        ]
    };

    try {
        const addPermissions = await axios.post(baseUrl + '/api/dashboards/uid/' + dashboardUid + '/permissions', permissionsData, { headers });
        console.log(`Dashboard permissions set: ${JSON.stringify(addPermissions.data)}`);

    } catch (error) {
        console.error(error);
    }
}

//Generates a new random password for the admin user, and then stores it in Azure key vault 
const changeAdminPwd = async () => {
    const adminPassword = generateRandomPassword(25);

    const testPass = {
        "password": adminPassword
    };

    try {
        const adminPwd = await axios.put(baseUrl + '/api/admin/users/1/password', testPass, { headers });
        console.log(adminPwd.data.message);

        await setKeyVaultSecret(adminPassword);

    } catch (error) {
        console.error(error);
    }
}

//Main function that utilise all the functinos 
(async () => {
    const groups = await getIntuneGroups();

    // Goes through every group returned by Azure AD
    for (const grp of groups) {
        console.log("TEAM found:" + grp.displayName);
        const teamId = await createTeam(grp.displayName);
        const groupMembers = await getGroupMembers(grp.id);

        for (const member of groupMembers) {
            console.log("NAME: " + member.displayName);
            console.log("Email: " + member.mail);
            const userId = await addUser(member.displayName, member.mail);
            await addUserToTeam(teamId, userId);
        }

        const dataSourceName = await dataSource(grp.displayName);
        const dashboardUid = await createDashboard(grp.displayName, dataSourceName);
        await dashboardPermissions(dashboardUid, teamId);

    }

    await changeAdminPwd();

})();
