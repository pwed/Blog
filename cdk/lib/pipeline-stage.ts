import { Stack, Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BlogProps, BlogStack } from './blog-stack';

interface BlogStageProps extends StageProps, BlogProps {}

export class BlogDeploy extends Stage {
    stack: Stack;
    constructor(scope: Construct, id: string, props: BlogStageProps) {
        super(scope, id, props);

        this.stack = new BlogStack(this, 'BlogStack', props);
    }
}
