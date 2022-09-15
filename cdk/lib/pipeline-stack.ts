import { Construct } from 'constructs';
import {
    Stack,
    StackProps,
    pipelines,
    aws_sns as sns,
    Environment,
    aws_codebuild,
} from 'aws-cdk-lib';
import { BlogDeploy } from './pipeline-stage';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { PipelineNotificationEvents } from 'aws-cdk-lib/aws-codepipeline';
import { Account } from './constant';

export class BlogPipelineStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const pipeline = new pipelines.CodePipeline(this, 'Pipeline', {
            pipelineName: 'BlogPipeline',
            publishAssetsInParallel: false,
            crossAccountKeys: true,
            synthCodeBuildDefaults: {
                buildEnvironment: {
                    computeType: aws_codebuild.ComputeType.SMALL,
                    buildImage:
                        aws_codebuild.LinuxArmBuildImage
                            .AMAZON_LINUX_2_STANDARD_2_0,
                },
            },
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
                    'yum install -y curl wget tar gzip',
                    'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash',
                    'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm install --lts',
                    'wget https://github.com/gohugoio/hugo/releases/download/v0.101.0/hugo_0.101.0_Linux-ARM64.tar.gz -O hugo.tar.gz && tar -xf hugo.tar.gz && cp hugo /bin/',
                ],
                commands: ['cd cdk', 'npm ci', 'npx cdk synth'],
                primaryOutputDirectory: 'cdk/cdk.out',
            }),
            dockerEnabledForSelfMutation: true,
            dockerEnabledForSynth: true,
        });

        const deploymentEnv: Environment = {
            account: Account.WORKLOAD,
            region: 'us-east-1',
        };

        pipeline.addStage(
            new BlogDeploy(this, 'BlogDevDeploy', {
                env: deploymentEnv,
                zoneDomain: 'pwed.me',
                blogDomain: 'dev.pwed.me',
                apiDomain: 'api.dev.pwed.me',
                draft: true,
            }),
        );
        pipeline.addStage(
            new BlogDeploy(this, 'BlogProdDeploy', {
                env: deploymentEnv,
                blogDomain: 'pwed.me',
                zoneDomain: 'pwed.me',
                apiDomain: 'api.pwed.me',
            }),
        );
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
