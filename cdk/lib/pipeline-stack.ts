import { Construct } from "constructs";
import { Stack, StackProps, pipelines } from "aws-cdk-lib";
import {
    BlogPipelineProdDeploy,
    BlogPipelineDevDeploy,
} from "./pipeline-stage";
import { ManualApprovalStep } from "aws-cdk-lib/pipelines";

export class BlogPipelineStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const pipeline = new pipelines.CodePipeline(this, "Pipeline", {
            pipelineName: "BlogPipeline",
            publishAssetsInParallel: false,

            synth: new pipelines.ShellStep("Synth", {
                input: pipelines.CodePipelineSource.connection(
                    "pwed/Blog",
                    "master",
                    {
                        connectionArn:
                            "arn:aws:codestar-connections:us-east-1:967803995830:connection/762f8358-181b-4602-8ec0-92982a01386f",
                    }
                ),
                installCommands: [
                    "apt-get update && apt install -y hugo make",
                    "npm install -g aws-cdk",
                ],
                commands: ["cd cdk", "npm ci", "npx cdk synth -q"],
                primaryOutputDirectory: "cdk/cdk.out",
            }),
            dockerEnabledForSelfMutation: true,
            dockerEnabledForSynth: true,
        });

        const deployWave = pipeline.addWave("DeployWave");
        const prodDeploy = new BlogPipelineProdDeploy(
            this,
            "BlogPipelineProdDeploy"
        );
        deployWave.addStage(prodDeploy, {
            pre: [new ManualApprovalStep("Deploy to Prod?")],
        });
        deployWave.addStage(
            new BlogPipelineDevDeploy(this, "BlogPipelineDevDeploy")
        );
    }
}