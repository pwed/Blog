import { Construct } from 'constructs';
import {
    Stack,
    StackProps,
    pipelines,
    aws_sns as sns,
    Environment,
} from 'aws-cdk-lib';
import { BlogDeploy } from './pipeline-stage';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { PipelineNotificationEvents } from 'aws-cdk-lib/aws-codepipeline';

export class BlogPipelineStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const pipeline = new pipelines.CodePipeline(this, 'Pipeline', {
            pipelineName: 'BlogPipeline',
            publishAssetsInParallel: false,
            crossAccountKeys: true,
            synth: new pipelines.ShellStep('Synth', {
                input: pipelines.CodePipelineSource.connection(
                    'pwed/Blog',
                    'master',
                    {
                        connectionArn:
                            'arn:aws:codestar-connections:us-east-1:681601794463:connection/fe38adc3-8f83-44d1-b145-afd9e2706fd1',
                    },
                ),
                installCommands: [
                    'apt-get update && apt-get install -y hugo make curl',
                    'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash',
                    'export NVM_DIR="$HOME/.nvm"',
                    '[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"',
                    'nvm install --lts',
                ],
                commands: ['cd cdk', 'npm ci', 'npx cdk synth'],
                primaryOutputDirectory: 'cdk/cdk.out',
            }),
            dockerEnabledForSelfMutation: true,
            dockerEnabledForSynth: true,
        });

        const deploymentEnv: Environment = {
            account: '806124249357',
            region: 'us-east-1',
        };

        pipeline.addStage(
            new BlogDeploy(this, 'BlogDevDeploy', {
                env: deploymentEnv,
                zoneDomain: 'pwed.me',
                blogDomain: 'dev.pwed.me',
                apiDomain: 'api.dev.pwed.me',
            }),
        );
        const prodDeploy = new BlogDeploy(this, 'BlogProdDeploy', {
            env: deploymentEnv,
            blogDomain: 'pwed.me',
            zoneDomain: 'pwed.me',
            apiDomain: 'api.pwed.me',
        });
        pipeline.addStage(prodDeploy, {
            stackSteps: [
                {
                    stack: prodDeploy.stack,
                    changeSet: [
                        new pipelines.ManualApprovalStep('ChangeSet Approval', {
                            comment: 'Check Dev and check change request',
                        }),
                    ],
                },
            ],
        });
        const topic = new sns.Topic(this, 'PipelineTopic');
        pipeline.buildPipeline();
        pipeline.pipeline.notifyOn('PipelineNotifications', topic, {
            events: [
                PipelineNotificationEvents.MANUAL_APPROVAL_NEEDED,
                PipelineNotificationEvents.PIPELINE_EXECUTION_STARTED,
                PipelineNotificationEvents.PIPELINE_EXECUTION_SUCCEEDED,
                PipelineNotificationEvents.PIPELINE_EXECUTION_FAILED,
            ],
        });

        topic.addSubscription(
            new EmailSubscription(
                'freddiestoddart000+aws-blog-pipeline@gmail.com',
            ),
        );
    }
}
