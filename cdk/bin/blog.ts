#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BlogPipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();
new BlogPipelineStack(app, 'BlogPipelineStack', {
    env: { account: '681601794463', region: 'us-east-1' },
});
