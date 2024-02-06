import { AzureFunction, Context } from "@azure/functions"
import { ServiceBusClient } from "@azure/service-bus";
import { BlobClient } from "@azure/storage-blob";
import { Readable } from "stream";
const csvParser = require("csv-parser");

const blobTrigger: AzureFunction = async function (context: Context, myBlob: any): Promise<void> {
    const serviceBusConnectionString = process.env.SERVICE_BUS_CONNECTION_STRING;
    const queueName = process.env.QUEUE_NAME;
    const blobConnectionString = process.env.AzureWebJobsStorage;
    const blobContainerName = process.env.STORAGE_UPLOAD_CONTAINER;
    const fileName = `${context.bindingData.name}.csv`;

    const serviceBusClient = new ServiceBusClient(serviceBusConnectionString);
    const sender = serviceBusClient.createSender(queueName);
    const result = [];
    const stream = Readable.from(myBlob);

    const promiseData = new Promise<void>((resolve) =>
    {
        stream.pipe(csvParser())
            .on("data", async (record) => {
                result.push(record)
                context.log(record)
                await sender.sendMessages({ body: JSON.stringify(record) });
            })
            .on('end', () => resolve());
    })

    await promiseData;

    context.bindings.myOutputBlob = JSON.stringify(result)
    try {
        const client = new BlobClient(blobConnectionString, blobContainerName, fileName)
        const res = await client.deleteIfExists();
        context.log(res);
    } catch (e) {
        context.log(e)
    }

};

export default blobTrigger;
