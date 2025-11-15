import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";

import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as path from "node:path";

export class InfraStack extends cdk.Stack {
  public readonly uploadBucket: s3.Bucket;
  public readonly hlsBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.uploadBucket = new s3.Bucket(this, "UploadBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // dev only
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
        },
      ],
    });

    const signedUrlFunction = new lambda.Function(this, "SignedUrlFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "signed-url-upload.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "lambda")),
      environment: {
        UPLOAD_BUCKET: "infrastack-uploadbucketd2c1da78-6hjfcna5pgwv",
      },
    });

    this.hlsBucket = new s3.Bucket(this, "HlsBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
        },
      ],
    });

    this.uploadBucket.grantPut(signedUrlFunction);

    const api = new apigateway.RestApi(this, "SignedUrlApi", {
      restApiName: "Signed URL Service",
      description: "Generates S3 signed URLs",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    const signedUrlIntegration = new apigateway.LambdaIntegration(
      signedUrlFunction
    );
    api.root.addResource("signed-url").addMethod("POST", signedUrlIntegration);

    this.distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.hlsBucket),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // US/Canada/Europe
    });

    const mediaConvertRole = new iam.Role(this, "MediaConvertRole", {
      assumedBy: new iam.ServicePrincipal("mediaconvert.amazonaws.com"),
    });

    this.uploadBucket.grantRead(mediaConvertRole);
    this.hlsBucket.grantReadWrite(mediaConvertRole);

    new cdk.CfnOutput(this, "UploadBucketName", {
      value: this.uploadBucket.bucketName,
    });

    new cdk.CfnOutput(this, "HlsBucketName", {
      value: this.hlsBucket.bucketName,
    });

    new cdk.CfnOutput(this, "DistributionDomain", {
      value: this.distribution.distributionDomainName,
    });
  }
}
