import { Construct } from "constructs";
import { Stack, StackProps, RemovalPolicy } from "aws-cdk-lib";
import {
  aws_s3_deployment as s3_deployment,
  aws_s3 as s3,
  aws_route53 as route53,
  aws_route53_targets as route53_targets,
  aws_certificatemanager as acm,
  aws_cloudfront as cf,
  aws_cloudfront_origins as cf_origins,
  aws_lambda_nodejs as lambda_nodejs,
  aws_lambda as lambda,
  aws_apigateway as apigw,
  aws_dynamodb as dynamo,
  aws_s3_notifications as s3n,
} from "aws-cdk-lib";
import { execSync } from "child_process";
import * as path from "path";

export class BlogStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const blogBucket = new s3.Bucket(this, "BlogBucket", {
      removalPolicy: RemovalPolicy.DESTROY,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      accessControl: s3.BucketAccessControl.BUCKET_OWNER_READ,
      autoDeleteObjects: true,
    });

    const hostedZone = route53.HostedZone.fromLookup(this, "HostedZone", {
      domainName: "pwed.me",
    });

    const certificate = new acm.Certificate(this, "Certificate", {
      domainName: "blog.pwed.me",
      subjectAlternativeNames: ["api.pwed.me"],
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    const dynamoTable = new dynamo.Table(this, 'DynamoTable', {
      partitionKey: {name:'ID', type: dynamo.AttributeType.STRING},
      billingMode: dynamo.BillingMode.PAY_PER_REQUEST
    });

    const countHandler = new lambda_nodejs.NodejsFunction(this, "CountHandler", {
        entry: path.join(__dirname, "lambda", "count", "app.ts"),
        handler: "main",
        environment: {
          DatabaseTable: dynamoTable.tableName
        }
      });

    dynamoTable.grantReadWriteData(countHandler);

    const helloHandler = new lambda_nodejs.NodejsFunction(
      this,
      "HelloHandler",
      {
        entry: path.join(__dirname, "lambda", "hello", "index.ts"),
        handler: "ApiLambda",
      }
    );

    const randomHandler = new lambda_nodejs.NodejsFunction(this, 'RandomHandler', {
      entry: path.join(__dirname, "lambda", "random", "index.ts"),
      handler: "ApiLambda",
    })

    const api = new apigw.RestApi(this, "API", {
      domainName: {
        domainName: "api.pwed.me",
        certificate,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        exposeHeaders: apigw.Cors.DEFAULT_HEADERS,
        allowMethods: apigw.Cors.ALL_METHODS,
      },
      description: "A fun API for varoius things I am playing with",
    });

    const hello = api.root.addResource("{hello+}", {
      defaultIntegration: new apigw.LambdaIntegration(helloHandler),
    });
    hello.addMethod("GET");

    const random = api.root.addResource("random").addResource('{number}');
    random.addMethod(
      'GET',
      new apigw.LambdaIntegration(randomHandler),
      {
        methodResponses: [
          {
            statusCode: "200"
          }
        ]
      }
    )

    const count = api.root.addResource("count");
    count.addMethod(
      'GET',
      new apigw.LambdaIntegration(countHandler),
      {
        methodResponses: [
          {
            statusCode: "200"
          }
        ]
      }
    )

    const ip = api.root.addResource("ip");
    ip.addMethod(
      "GET",
      new apigw.MockIntegration({
        passthroughBehavior: apigw.PassthroughBehavior.WHEN_NO_TEMPLATES,
        requestTemplates: {
          "application/json": '{"statusCode": 200}',
          "text/html": '{"statusCode": 200}',
        },
        integrationResponses: [
          {
            statusCode: "200",
            responseTemplates: {
              "application/json": '{"ip":"$context.identity.sourceIp"}',
              "text/html": "$context.identity.sourceIp",
            },
          },
        ],
      }),
      {
        methodResponses: [
          {
            statusCode: "200",
          },
        ],
      }
    );

    new apigw.Deployment(this, 'deployment', {
      api,
    }).applyRemovalPolicy(RemovalPolicy.RETAIN);

    const originAccessIdentity = new cf.OriginAccessIdentity(
      this,
      "OriginAccessIdentity"
    );
    blogBucket.grantRead(originAccessIdentity);

    const distribution = new cf.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: new cf_origins.S3Origin(blogBucket, {
          originAccessIdentity,
        }),
        allowedMethods: cf.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      domainNames: ["blog.pwed.me"],
      certificate,
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: "/404.html",
        },
      ],
      defaultRootObject: "index.html",
    });

    new route53.ARecord(this, "AliasRecord", {
      recordName: "blog.pwed.me",
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(
        new route53_targets.CloudFrontTarget(distribution)
      ),
    });

    new route53.ARecord(this, "AliasRecordApi", {
      recordName: "api.pwed.me",
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(
        new route53_targets.ApiGateway(api)
      ),
    });

    execSync(`cd blog && rm -rf public && hugo`);

    new s3_deployment.BucketDeployment(this, "BlogDeployment", {
      sources: [
        s3_deployment.Source.asset(
          path.join(__dirname, "..", "blog", "public")
        ),
      ],
      destinationBucket: blogBucket,
      distribution,
      distributionPaths: ["/*"],
    });

    blogBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(
        new lambda.Function(this, 'object-invalidate', {
          runtime: lambda.Runtime.PYTHON_3_9,
          handler: 'main.handler',
          code: lambda.Code.fromAsset(path.join(__dirname, 'lambda', 'object-invalidate')),
        })
      )
    )
  }
}
