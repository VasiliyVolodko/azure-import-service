import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { BlobSASPermissions, BlobSASSignatureValues, BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters } from "@azure/storage-blob";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const { name } = req.query

    if(!name) {
        context.res = {
            status: 400,
            body: "no file name was provided"
        };
        return;
    }

    const containerName = process.env.STORAGE_UPLOAD_CONTAINER
    const storageConnectionString = process.env.AzureWebJobsStorage
    const blobServiceClient = BlobServiceClient.fromConnectionString(storageConnectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName)

    const sasOptions: BlobSASSignatureValues = {
        containerName: containerName,
        blobName: name,
        permissions: BlobSASPermissions.parse("w"),
        startsOn: new Date(),
        expiresOn: new Date(new Date().valueOf() + 3600 * 1000)
    };

    const sharedKeyCredential = blobServiceClient.credential as StorageSharedKeyCredential

    const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCredential).toString();

    context.res = {
        body: {
            url: `${containerClient.getBlockBlobClient(name).url}?${sasToken}`
        }
    };

};

export default httpTrigger;