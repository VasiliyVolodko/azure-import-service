import { AzureFunction, Context } from "@azure/functions"
import { BlobClient } from "@azure/storage-blob";
import { Readable } from "stream";
const csvParser = require("csv-parser");

const blobTrigger: AzureFunction = async function (context: Context, myBlob: any): Promise<void> {
    const result = []
    const stream = Readable.from(myBlob)
    stream.pipe(csvParser()).on("data", (data) => context.log(data));
    await new Promise<void>((resolve) => {
        stream
            .pipe(csvParser())
            .on("data", async (record) => {
                result.push(record)
                context.log(record)
            })
            .on('end', async () => {
                resolve()
            })
    })
    context.bindings.myOutputBlob = JSON.stringify(result)

    const client = new BlobClient(context.bindingData.uri)
    client.deleteIfExists();
};

export default blobTrigger;
