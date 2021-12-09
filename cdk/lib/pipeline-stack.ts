import { Construct } from "constructs";
import { Stack, StackProps, pipelines, aws_sns as sns } from "aws-cdk-lib";
import { BlogDeploy } from "./pipeline-stage";
import {
    DetailType,
    NotificationRule,
} from "aws-cdk-lib/aws-codestarnotifications";
import { EmailSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { PipelineNotificationEvents } from "aws-cdk-lib/aws-codepipeline";

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

        pipeline.addStage(
            new BlogDeploy(this, "BlogDevDeployDev", {
                env: props?.env,
                zoneDomain: "pwed.me",
                blogDomain: "dev.pwed.me",
                apiDomain: "api.dev.pwed.me",
            })
        );
        const prodDeploy = new BlogDeploy(this, "BlogPipelineProdDeploy", {
            env: props?.env,
            blogDomain: "pwed.me",
            zoneDomain: "pwed.me",
            apiDomain: "api.pwed.me",
        });
        pipeline.addStage(prodDeploy, {
            stackSteps: [
                {
                    stack: prodDeploy.stack,
                    changeSet: [
                        new pipelines.ManualApprovalStep("ChangeSet Approval", {
                            comment: "Check Dev and check change request",
                        }),
                    ],
                },
            ],
        });
        const topic = new sns.Topic(this, "PipelineTopic");
        pipeline.buildPipeline();
        pipeline.pipeline.notifyOn("PipelineNotifications", topic, {
            events: [
                PipelineNotificationEvents.MANUAL_APPROVAL_NEEDED,
                PipelineNotificationEvents.PIPELINE_EXECUTION_STARTED,
                PipelineNotificationEvents.PIPELINE_EXECUTION_SUCCEEDED,
                PipelineNotificationEvents.PIPELINE_EXECUTION_FAILED,
            ],
        });

        topic.addSubscription(
            new EmailSubscription(
                "freddiestoddart000+aws-blog-pipeline@gmail.com"
            )
        );
    }
}
