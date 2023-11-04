const express = require('express');
const upload = require('express-fileupload');
const uuid4 = require('uuid4');
const app = express();
const cors = require("cors");
require('dotenv').config()

const { 
    S3,
    S3Client,
    PutObjectCommand,
    CreateBucketCommand,
    DeleteObjectCommand,
    DeleteBucketCommand,
    paginateListObjectsV2,
    GetObjectCommand,
} = require("@aws-sdk/client-s3");


const { DynamoDB } = require("@aws-sdk/client-dynamodb");

app.use(express.json());
app.use(upload());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.set('view engine', 'hbs');

app.use(express.static('public'))

const s3Client = new S3Client({ apiVersion: '2006-03-01', region: 'us-east-1' });
var s3 = new S3({apiVersion: '2006-03-01', region: 'us-east-1'});
var dynamodb = new DynamoDB({ apiVersion: '2012-08-10', region: 'us-east-1' });

app.post('/upload-file', async (req, res) => {
    const s3FileName = uuid4() + '.dat';
    const userFileName = req.files.file.name;
    const downloadId = uuid4();
    const command = new PutObjectCommand({
        Bucket: "p4j63ily4k-file-bucket",
        Key: s3FileName,
        Body: req.files.file.data,
    });
    try {
        const response = await s3Client.send(command);
    } catch (err) {
        res.send(err);
        console.error(err);
    }
    const params = {
        Item: {
            "id": {
                S: downloadId
            },
            "s3FileName": {
                S: s3FileName
            },
            "mimetype": {
                S: req.files.file.mimetype
            },
            "userFileName":
                { S: userFileName },
            "createdAt": {
                S: Date.now().toString()
            }
        },
        ReturnConsumedCapacity: "TOTAL",
        TableName: "file-data"
    };
    try {
        await dynamodb.putItem(params)
        res.render('qrcode', {
            downloadUrl: `http://localhost:3000/download/${downloadId}`
        })
    } catch (err) {
        console.error(err)
    }
});

app.get('/download/:downloadId', async (req, res) => {
    const downloadId = req.params.downloadId
    var params = {
        Key: {
            "id": {
                S: downloadId
            }
        },
        TableName: "file-data"
    }
    const fileData = await dynamodb.getItem(params);
    var s3Params = { Bucket: 'p4j63ily4k-file-bucket', Key: fileData.Item.s3FileName.S };
    res.setHeader('Content-type', fileData.Item.mimetype.S);
    res.setHeader('Content-disposition', 'attachment; filename=' + fileData.Item.userFileName.S);
    const response = await s3.getObject(s3Params);
    response.Body.pipe(res);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});