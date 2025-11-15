const express = require("express");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const app = express();

const client = new S3Client({ region: "us-east-1", signatureVersion: "v4" });

app.get("/generate-presigned-url", async (req, res) => {
  const fileName = "test";

  const command = new PutObjectCommand({
    Bucket: process.env.UPLOAD_BUCKET,
    Key: `uploads/${fileName}`,
    ContentType: "mp4",
  });

  const expiration = 3600;

  try {
    const signedUrl = await getSignedUrl(client, command, {
      signableHeaders: new Set(["content-type"]),
      expiresIn: expiration,
    });
    res.json({ signedUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
