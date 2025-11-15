const express = require("express");
const path = require("path");
const cors = require("cors");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const app = express();

const client = new S3Client({
  region: "us-east-1",
  signatureVersion: "v4",
  forcePathStyle: false,
});

app.get("/generate-presigned-url", async (req, res) => {
  const { fileName, fileType } = req.query;

  const command = new PutObjectCommand({
    Bucket: "infrastack-uploadbucketd2c1da78-6hjfcna5pgwv",
    Key: `uploads/${fileName}`,
    ContentType: fileType,
  });

  const expiration = 3600;

  try {
    const signedUrl = await getSignedUrl(client, command, {
      expiresIn: expiration,
    });
    res.json({ signedUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/index.html"));
});

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
