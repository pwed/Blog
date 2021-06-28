import { Stack, Construct, StackProps, RemovalPolicy } from '@aws-cdk/core';
import { BucketDeployment, Source } from '@aws-cdk/aws-s3-deployment';
import { Bucket, BucketAccessControl, BucketEncryption } from '@aws-cdk/aws-s3';
import { AllowedMethods, Distribution, OriginAccessIdentity, ViewerProtocolPolicy } from '@aws-cdk/aws-cloudfront';
import { S3Origin } from '@aws-cdk/aws-cloudfront-origins';
import { Certificate, CertificateValidation } from '@aws-cdk/aws-certificatemanager'
import { ARecord, HostedZone, RecordTarget } from '@aws-cdk/aws-route53';
import { CloudFrontTarget } from '@aws-cdk/aws-route53-targets';
import * as path from 'path';

export class BlogStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const blogBucket = new Bucket(this, 'BlogBucket', {
      removalPolicy: RemovalPolicy.DESTROY,
      versioned: true,
      encryption: BucketEncryption.S3_MANAGED,
      accessControl: BucketAccessControl.BUCKET_OWNER_READ,
      autoDeleteObjects: true,
    })

    const hostedZone = HostedZone.fromLookup(this, 'HostedZone', {
      domainName: 'pwed.me'
    });

    const certificate = new Certificate(this, 'Certificate', {
      domainName: 'blog.pwed.me',
      validation: CertificateValidation.fromDns(hostedZone),
    })

    const originAccessIdentity = new OriginAccessIdentity(this, 'OriginAccessIdentity');
    blogBucket.grantRead(originAccessIdentity);

    const distribution = new Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new S3Origin(blogBucket, {
          originAccessIdentity
        }),
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      domainNames: ['blog.pwed.me'],
      certificate,
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: '/404.html'
        }
      ],
      defaultRootObject: 'index.html',
    });

    new ARecord(this, 'AliasRecord', {
      recordName: 'blog.pwed.me',
      zone: hostedZone,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
    });

    new BucketDeployment(this, 'BlogDeployment', {
      sources: [Source.asset(path.join(__dirname, '..', 'blog', 'public'))],
      destinationBucket: blogBucket,
      distribution,
      distributionPaths: ['/'],
    })
  }
}
