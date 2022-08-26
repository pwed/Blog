#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Account } from '../lib/constant';
import { BlogPipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();
new BlogPipelineStack(app, 'BlogPipelineStack', {
    env: { account: Account.DEVOPS, region: 'us-east-1' },
});
