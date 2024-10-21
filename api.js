const { S3Client, CreateBucketCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, DeleteBucketCommand } = require("@aws-sdk/client-s3");
const { fromIni } = require("@aws-sdk/credential-provider-ini");
const fs = require('fs');

// Connection
// This is how you can use the .aws credentials file to fetch the credentials, set region, and custom endpoint for IAM
const credentials = fromIni({ profile: "default" });
const region = "ap-southeast-1"; // us-east-1 is the default for IAM calls
const endpoint = "https://s3.ap-southeast-1.wasabisys.com";

// Set up the client with the custom endpoint
const s3 = new S3Client({ credentials, region, endpoint });

const createBucket = async (bucket_name) => {
    try {
    const params= {
    Bucket: bucket_name,
    };
    
    const data = await s3.send(new CreateBucketCommand(params));
    console.log("Success, bucket created!", data);
    } catch (err) {
    console.error("Error", err);
    }
};
    
const uploadObject = async (bucket_name, object_key, file_path) => {
    try {
        const fileStream=fs.createReadStream(file_path);
        const params= {
        Bucket: bucket_name,
        Key: object_key,
        Body: fileStream,
        };
        
    // Upload the object
        const data = await s3.send(new PutObjectCommand(params));
        console.log("Success, object uploaded", data);
    } catch (err) {
        console.error("Error", err);
    }
};



// Read the object
const readObject = async (bucket_name, object_key) => {
    try {
    const params= {
    Bucket: bucket_name,
    Key: object_key
    };
    
    const data = await s3.send(new GetObjectCommand(params));
    const body = await streamToString(data.Body);
    
    console.log("Success, object retrieved:", body);
    } catch (err) {
    console.error("Error", err);
    }
    };
    
    // Function to convert a stream to string
    const streamToString = (stream) => {
    return new Promise((resolve, reject) => {
    const chunks= [];
    stream.on('data', (chunk) =>chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () =>resolve(Buffer.concat(chunks).toString('utf8')));
    });
};
  

const deleteObject = async (bucket_name, object_key) => {
    try {
    const params= {
    Bucket: bucket_name,
    Key: object_key
    };
    
    const data = await s3.send(new DeleteObjectCommand(params));
    console.log("Success, object deleted", data);
    } catch (err) {
    console.error("Error", err);
    }
};
    

const deleteBucket = async (bucket_name) => {
    try {
    const params= {
    Bucket: bucket_name,
    };
    
    const data = await s3.send(new DeleteBucketCommand(params));
    console.log("Success, bucket deleted!", data);
    } catch (err) {
    console.error("Error", err);
    }
};
    
createBucket(bucket_name="APITest");
deleteBucket(bucket_name="APITest");

uploadObject(bucket_name="APITest", object_key="test.txt", file_path="test.txt");
deleteObject(bucket_name="APITest", object_key="test.txt");
readObject(bucket_name="APITest", object_key="test.txt");
