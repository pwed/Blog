import { Stack, Construct, StackProps, RemovalPolicy } from '@aws-cdk/core';
import { BucketDeployment, Source } from '@aws-cdk/aws-s3-deployment';
import { Bucket, BucketEncryption } from '@aws-cdk/aws-s3';
import { Distribution } from '@aws-cdk/aws-cloudfront';
import { S3Origin } from '@aws-cdk/aws-cloudfront-origins';
import * as path from 'path';
import { spawn } from 'child_process';
import { exit } from 'process';

export class BlogStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const hugo = spawn('hugo', {
      cwd: path.join(__dirname, '..', 'blog')
    })

    hugo.on('exit', (code) => {
      if (code != 0) {
        exit(1);
      }
    })

    const blogBucket = new Bucket(this, 'BlogBucket', {
      removalPolicy: RemovalPolicy.DESTROY,
      versioned: true,
      encryption: BucketEncryption.S3_MANAGED,
      // websiteIndexDocument: 'index.html',
      // publicReadAccess: true,
      autoDeleteObjects: true,
    })

    // const distribution = new Distribution(this, 'Distribution', {
    //   defaultBehavior: { origin: new S3Origin(blogBucket) },
    // });

    const blogDeployment = new BucketDeployment(this, 'BlogDeployment', {
      sources: [Source.asset(path.join(__dirname, '..', 'blog', 'public'))],
      destinationBucket: blogBucket,
      // distribution,
      // distributionPaths: ['/'],
    })
  }
}
