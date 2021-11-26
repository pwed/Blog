import { Construct } from "constructs";
import { Stack, StackProps, pipelines } from "aws-cdk-lib";
import { BlogPipelineStage } from "./pipeline-stage";

export class BlogPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new pipelines.CodePipeline(this, "Pipeline", {
      pipelineName: "BlogPipeline",
      publishAssetsInParallel: false,

      synth: new pipelines.ShellStep("Synth", {
        input: pipelines.CodePipelineSource.connection("pwed/Blog", "master", {
          connectionArn:
            "arn:aws:codestar-connections:us-east-1:967803995830:connection/762f8358-181b-4602-8ec0-92982a01386f",
        }),
        installCommands: [
          "apt-get update && apt install hugo -y",
          "npm install -g aws-cdk@next",
        ],
        commands: ["npm ci", "npx cdk synth"],
      }),
      dockerEnabledForSelfMutation: true,
      dockerEnabledForSynth: true,
    });

    const deploy = new BlogPipelineStage(this, "Deploy");
    const deployStage = pipeline.addStage(deploy);
  }
}
