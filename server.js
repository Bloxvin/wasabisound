const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand, CreatePresignedUrlCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const {Readable} = require('stream');

const bucket_name = "APITest"
const HOST = "192.168.6.17";
const folder_name = "images"

const app = express();

const storage = multer.memoryStorage(); // Store file in memory
const upload = multer({ storage: storage }).single('image'); // Name of the input field

const s3Client = new S3Client({
  region: 'ap-southeast-1', // Region, adjust as needed
  endpoint: 'https://s3.ap-southeast-1.wasabisys.com', // Wasabi endpoint
  credentials: {
    accessKeyId: 'ATYUVBHYFCRSUDN7RCOJ', // Your Wasabi access key
    secretAccessKey: 'a0rCrsqR9VdMKRejpoM8SwF8wiZ4Hmfj1NUn6tmz', // Your Wasabi secret key
  },
});


app.get('/', (req, res) => {
    res.sendFile(
      path.join(__dirname, 'public', 'index.html')
  );
});

app.post('/upload', async (req, res) => {

  console.log(req.file); // Log the file object
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    if (!req.file) {
      return res.status(400).send('No file selected!');
    }

    const providedFilename = req.body.filename;
    const params = {
      Bucket: bucket_name, // Your Wasabi bucket name
      Key: `${folder_name}/${providedFilename}`, // File name in S3
      Body: req.file.buffer,
    };

    try {
      const command = new PutObjectCommand(params);
      const data = await s3Client.send(command);
      res.send(`File uploaded successfully at https://${bucket_name}}.s3.wasabisys.com/${params.Key}`);
    } catch (s3Err) {
      return res.status(500).send(s3Err.message);
    }
  });
});


// List images in the bucket
app.get('/images', async (req, res) => {
    const params = {
      Bucket: bucket_name,
      Prefix: 'images/',
    };
  
    try {
      const command = new ListObjectsV2Command(params);
      const data = await s3Client.send(command);
      
      const imageKeys = (data.Contents || []).map(item => item.Key);
      res.json(imageKeys);
    } catch (err) {
      return res.status(500).send(err.message);
    }
  });

  // Generate a pre-signed URL for accessing an image
app.get('/image-url', async (req, res) => {
    const { key } = req.query;

    console.log(key);
  
    if (!key) {
      return res.status(400).send('Key is required');
    }
  
    const params = {
      Bucket: bucket_name,
      Key: `${folder_name}}/${key}`,
      Expires: 60 * 5, // URL expiration time in seconds
    };
  
    try {
      const command = new CreatePresignedUrlCommand(params);
      const url = await s3Client.send(command);
      res.json({ url });
    } catch (err) {
      return res.status(500).send(err.message);
    }
  });

// Handle the download
app.get('/download', async (req, res) => {
    const { key } = req.query; // Get the file key from query params
  
    const params = {
      Bucket: bucket_name, // Your Wasabi bucket name
      Key: `${folder_name}}/${key}`, // File key to download
    };

    console.log(path.basename(key))
  
    try {
      const command = new GetObjectCommand(params);
      const { Body } = await s3Client.send(command);
  
      // Stream the file to the response
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(key)}"`);
      Body.pipe(res);
    } catch (s3Err) {
      return res.status(500).send(s3Err.message);
    }
  });

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
});
