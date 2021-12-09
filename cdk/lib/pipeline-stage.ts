import { Stage, StageProps } from "aws-cdk-lib";
import { SECRETS_MANAGER_PARSE_OWNED_SECRET_NAME } from "aws-cdk-lib/cx-api";
import { Construct } from "constructs";
import { BlogProps, BlogStack } from "./blog-stack";

interface BlogStageProps extends StageProps, BlogProps {}

export class BlogDeploy extends Stage {
  constructor(scope: Construct, id: string, props: BlogStageProps) {
    super(scope, id, props);

    new BlogStack(this, "BlogStack", props);
  }
}
