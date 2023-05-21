//Author: Sindre Schonhowd, Magnus Voll, og Øivind Wahlstrøm
//Date: 21.05.2023

//Required files and libraries 
const { seFetchDevicesForTenant } = require('./secureEndpoint');
const intune = require('./Intune');
const Umbrella = require('./Umbrella');
const { createOrUpdateIndex } = require('./elasticSearch');
const { getIntuneGroups, getKeyVault } = require('./azure-api');
const cron = require('cron');

//Main function
const processAPIs = async () => {

  //Get groups from Azure
  const groups = await getIntuneGroups();

  //Retrives API keys stored in Azure Key Vault
  const secureEndpointSecret = await getKeyVault("test-tussa-se", "secureEndpointSecret");
  const intuneSecret = await getKeyVault("test-tussa-intune", "intuneSecret");
  const umbrellaSecret = await getKeyVault("test-tussa-umbrella", "umbrellaSecret");

  //iterates though every group found
  for (const grp of groups) {
    console.log(grp);

    try {
      const tenantIdentifier = grp;
      const seArray = [];
      const intuneArray = [];
      const umbrellaArray = [];

      //Cisco Secure Endpoint 
      console.log(`Tenant ${tenantIdentifier} -- Secure Endpoint`);
      const seDevice = await seFetchDevicesForTenant(tenantIdentifier, secureEndpointSecret);
      if (seDevice) {
        for (let i = 0; i < seDevice.length; i++) {
          seArray.push({
            device_name: seDevice[i].hostname,
            user_principal_name: '',
            enrollment_date: seDevice[i].install_date,
            last_syncS: seDevice[i].last_seen,
            last_syncI: '',
            last_syncU: '',
            last_sync_compare: '',
            device_compliance_status: '',
            versionS: seDevice[i].connector_version,
            versionU: '',
            status_active: '',
            operating_system: seDevice[i].operating_system,
            manufacturer_model: '',
            connector_version: seDevice[i].connector_version,
            is_compromised: seDevice[i].is_compromised,
            timeField: '',
          });
        }
      }

      // Microsoft Intune
      console.log(`Tenant ${tenantIdentifier} -- Intune`);
      const responseI = await intune.fetchIntuneDevicesForTenant(tenantIdentifier, intuneSecret);
      if (responseI) {
        for (let i = 0; i < responseI.length; i++) {
          intuneArray.push({
            device_name: responseI[i].deviceName,
            user_principal_name: responseI[i].userPrincipalName,
            enrollment_date: responseI[i].enrolledDateTime,
            last_syncS: '',
            last_syncI: responseI[i].lastSyncDateTime,
            last_syncU: '',
            last_sync_compare: '',
            device_compliance_status: responseI[i].complianceState,
            versionS: '',
            versionU: '',
            status_active: '',
            operating_system: responseI[i].operatingSystem,
            manufacturer_model: responseI[i].manufacturer + ' - ' + responseI[i].model,
            connector_version: '',
            is_compromised: '',
            timeField: '',
          });
        }
      }


      //Cisco Umbrella 
      console.log(`Tenant ${tenantIdentifier} -- Umbrella`);
      const responseU = await Umbrella.fetchUmbrellaInfoForTenant(tenantIdentifier, umbrellaSecret);
      if (responseU) {
        for (let i = 0; i < responseU.length; i++) {
          umbrellaArray.push(
            {
              device_name: responseU[i].name,
              user_principal_name: '',
              enrollment_date: '',
              last_syncS: '',
              last_syncI: '',
              last_syncU: responseU[i].lastSync,
              last_sync_compare: '',
              device_compliance_status: '',
              versionS: '',
              versionU: responseU[i].version,
              status_active: responseU[i].status,
              operating_system: responseU[i].osVersionName,
              manufacturer_model: '',
              connector_version: '',
              is_compromised: '',
              timeField: '',
            }
          )
        }
      }

      // Merge objects from existing arrays into one
      [intuneArray, umbrellaArray].forEach(arr => {
        arr.forEach(obj => {
          const existingObj = seArray.find(newObj => newObj.device_name === obj.device_name);

          if (!existingObj) {
            // If object with same name does not exist, add new object to new array
            seArray.push(obj);

          } else {
            // If object with same name exists, merge additional properties into it
            Object.keys(obj).forEach(key => {
              if (obj[key] === true || false) {
                // If the value is a boolean, add it to existingObj
                existingObj[key] = obj[key];
              } else {
                // If the value is not a boolean, update existingObj with the value from obj
                existingObj[key] = obj[key] || existingObj[key];
                // If existingObj doesn't have a value for this key, assign an empty string as the value
              }
            });

          }
        });
      });

      //Checks if the last syncs fields has the same date across the products. 
      seArray.forEach(device => {
        const syncS = device.last_syncS.slice(0, 10);
        const syncI = device.last_syncI.slice(0, 10);
        const syncU = device.last_syncU.slice(0, 10);
        device.last_sync_compare = syncS === syncI && syncI === syncU && syncS === syncU ? 'OK' : 'NOT';
        const now = new Date();
        device.timeField = now.toISOString();
      });

      //Logs the merged data set 
      console.log(seArray);

      //Sends data to Elasticsearch
      await createOrUpdateIndex(seArray, tenantIdentifier);

    } catch (err) {
      console.error(err);
    }
  }
};

//Run it immediatly after lauch 
processAPIs();

// prcessAPIs everyday at 21:00 
const job = new cron.CronJob('0 21 * * *', processAPIs, null, true, 'Europe/Oslo'); 