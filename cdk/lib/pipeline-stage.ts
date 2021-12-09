import { Stage, StageProps } from "aws-cdk-lib";
import { SECRETS_MANAGER_PARSE_OWNED_SECRET_NAME } from "aws-cdk-lib/cx-api";
import { Construct } from "constructs";
import { BlogStack } from "./blog-stack";

export class BlogPipelineProdDeploy extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    new BlogStack(this, "BlogStack", {
      env: { account: "967803995830", region: "us-east-1" },
      blogDomain: 'blog.pwed.me',
      zoneDomain: 'pwed.me',
      apiDomain: 'api.pwed.me',
    });
  }
}

export class BlogPipelineDevDeploy extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    new BlogStack(this, "BlogStack", {
      env: { account: "967803995830", region: "us-east-1" },
      blogDomain: 'dev.blog.pwed.me',
      zoneDomain: 'pwed.me',
      apiDomain: 'api.dev.pwed.me',
    });
  }
}
