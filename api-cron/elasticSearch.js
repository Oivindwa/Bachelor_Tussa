const { Client } = require('@elastic/elasticsearch');

const indexMapping = {
    mappings: {
        properties: {
            device_name: { type: 'text' },
            user_principal_name: { type: 'text' },
            enrollment_date: { type: 'date', ignore_malformed: true },
            last_syncS: { type: 'date', ignore_malformed: true },
            last_syncI: { type: 'date', ignore_malformed: true },
            last_syncU: { type: 'date', ignore_malformed: true },
            last_sync_compare: { type: 'text' },
            device_compliance_status: { type: 'text' },
            versionS: { type: 'text' },
            versionU: { type: 'text' },
            status_active: { type: 'text' },
            operating_system: { type: 'text' },
            manufacturer_model: { type: 'text' },
            connector_version: { type: 'text' },
            is_compromised: { type: 'boolean' },
            timeField: { type: 'date', ignore_malformed: true },
        },
    },
};



//Deletes old index if exist and adds new one 
const createOrUpdateIndex = async (documents, indexName) => {
    try {
        const esClient = await createEsClient();
        await deleteIndexIfExist(indexName, esClient);
        await createIndex(indexName, esClient, documents);

    } catch (error) {
        console.error(`Failed to create or update index ${indexName} -- ERROR  MESSAGE: ${error}`);
    }
};

// Creates the Elasticsearch client 
async function createEsClient() {
    try {
        const esClient = new Client({
            node: 'http://tussa-app_elasticsearch:9200',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        //Cheack for successful creation 
        const pingRes = await pingClient(esClient);

        if (pingRes) {
            return esClient;
        } else {
            console.log("cloud ping created client")
            return false;
        }


    } catch (error) {
        console.error(`Failed to create Elasticsearch client: ${error}`);
        return null;
    }
}

//pings the client 
async function pingClient(client) {
    try {
        const res = await client.ping();
        console.log(`Ping client status: ${res}`);
        return res;
    } catch (error) {
        console.error(`Failed to ping the elasticsearch Client: ${error}`);

    }
}

//Deletes index if exist
async function deleteIndexIfExist(name, client) {
    try {
        const res = await client.indices.exists({ index: name });

        if (res) {
            await client.indices.delete({ index: name });
            console.log(`Deletes index: ${name}`);
        } else {
            console.log("Index exist: ", res);
        }

    } catch (error) {
        console.error(`Failed to cheack if the index exist: ${error}`);

    }
}

//Create index
async function createIndex(name, client, documentet) {
    try {
        await client.indices.create({
            index: name,
            body: indexMapping
        });

        const body = documentet.flatMap(doc => [{ index: { _index: name } }, doc]);
        const bulkResponse = await client.bulk({ refresh: true, body })

        //Errors regarding updating Elasticsearch index 
        //Iterates through the errors of the different items and displays the reason
        bulkResponse.items.forEach(item => {
            if (item.index.error) {
                console.log(`Error for item ${item.index.device_name}: ${item.index.error.reason}`);
            }
        });


        if (bulkResponse.errors) {
            console.log(`Indexing documents failed. -- ERRROR: ${bulkResponse.errors}`);

        } else {
            const count = await client.count({ index: name });
            console.log(`Successfully Indexed: ${count.count} documents to the: ${name} index`);
        }

    } catch (error) {
        console.error(`Failed to create index ${name} -- ERROR MESSAGE: ${error}`);
    }
}

module.exports = { createOrUpdateIndex };

