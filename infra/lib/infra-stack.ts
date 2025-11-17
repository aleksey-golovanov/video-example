import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";

import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as path from "node:path";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // buckets

    const uploadBucket = new s3.Bucket(this, "UploadBucket", {
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

    const hlsBucket = new s3.Bucket(this, "HlsBucket", {
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

    // roles

    const mediaConvertRole = new iam.Role(this, "MediaConvertRole", {
      assumedBy: new iam.ServicePrincipal("mediaconvert.amazonaws.com"),
    });

    // lambdas

    const signedUrlFunction = new lambda.Function(this, "SignedUrlFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "signed-url-upload.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "lambda")),
      environment: {
        UPLOAD_BUCKET: uploadBucket.bucketName,
      },
    });

    const processTrigger = new lambda.Function(this, "ProcessTrigger", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "process-trigger.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "lambda")),
      timeout: cdk.Duration.seconds(30),
      environment: {
        HLS_BUCKET: hlsBucket.bucketName,
        MEDIA_CONVERT_ROLE: mediaConvertRole.roleArn,
      },
    });

    // events

    uploadBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(processTrigger),
      { prefix: "uploads/" }
    );

    // permissions

    uploadBucket.grantPut(signedUrlFunction);
    uploadBucket.grantRead(processTrigger);
    uploadBucket.grantRead(mediaConvertRole);
    hlsBucket.grantReadWrite(processTrigger);
    hlsBucket.grantReadWrite(mediaConvertRole);

    processTrigger.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "mediaconvert:CreateJob",
          "mediaconvert:GetJob",
          "mediaconvert:ListJobs",
          "mediaconvert:DescribeEndpoints",
        ],
        resources: ["*"],
      })
    );

    processTrigger.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["iam:PassRole"],
        resources: [mediaConvertRole.roleArn],
      })
    );

    // api gateway

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

    // cloudfront distribution

    const distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(hlsBucket),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // US/Canada/Europe
    });

    // output

    new cdk.CfnOutput(this, "UploadBucketName", {
      value: uploadBucket.bucketName,
    });

    new cdk.CfnOutput(this, "HlsBucketName", {
      value: hlsBucket.bucketName,
    });

    new cdk.CfnOutput(this, "DistributionDomain", {
      value: distribution.distributionDomainName,
    });
  }
}
