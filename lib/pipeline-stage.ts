import { Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { BlogStack } from './blog-stack';


export class BlogPipelineStage extends Stage {
    constructor(scope: Construct, id: string, props?: StageProps) {
        super(scope, id, props);

        new BlogStack(this, 'BlogStack')
    }
}