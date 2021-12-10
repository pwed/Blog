#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BlogPipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();
new BlogPipelineStack(app, 'BlogPipelineStack', {
    env: { account: '967803995830', region: 'us-east-1' },
});
