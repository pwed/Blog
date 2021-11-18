import { Construct } from "constructs";
import { Stack, StackProps, pipelines } from "aws-cdk-lib";

export class BlogPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new pipelines.CodePipeline(this, "Pipeline", {
      pipelineName: "BlogPipeline",
      synth: new pipelines.ShellStep("Synth", {
        input: pipelines.CodePipelineSource.connection('pwed/Blog', 'master', {connectionArn: 'arn:aws:codestar-connections:us-east-1:967803995830:connection/762f8358-181b-4602-8ec0-92982a01386f'}),
        commands: [
            "apt update && apt install -y hugo",
            "npm ci",
            "npm run build",
            "npx cdk synth"
        ],
      }),
    });

    // const build = pipeline.addStage({
    //     stageName: 'Build'
    // })
  }
}
