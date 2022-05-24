import { Construct } from 'constructs';
import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import {
    aws_route53 as route53,
    aws_route53_targets as route53_targets,
    aws_certificatemanager as acm,
    aws_lambda_nodejs as lambda_nodejs,
    aws_apigateway as apigw,
    aws_dynamodb as dynamo,
} from 'aws-cdk-lib';
import * as path from 'path';
import { HugoDeployment } from './constructs/hugo-deployment';

export interface BlogProps extends StackProps {
    zoneDomain: string;
    blogDomain: string;
    apiDomain: string;
    draft?: true;
}

export class BlogStack extends Stack {
    constructor(scope: Construct, id: string, props: BlogProps) {
        super(scope, id, props);

        const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
            domainName: props.zoneDomain,
        });

        new HugoDeployment(this, 'BlogDeployment', {
            hugoPath: '..',
            hugoDistPath: 'public',
            domain: props.blogDomain,
            hostedZone,
            hashFile: '.hashes.json',
            apiDomain: props.apiDomain,
            draft: props.draft,
        });

        const certificate = new acm.Certificate(this, 'Certificate', {
            domainName: props.blogDomain,
            subjectAlternativeNames: [props.apiDomain],
            validation: acm.CertificateValidation.fromDns(hostedZone),
        });

        const dynamoTable = new dynamo.Table(this, 'DynamoTable', {
            partitionKey: { name: 'ID', type: dynamo.AttributeType.STRING },
            billingMode: dynamo.BillingMode.PAY_PER_REQUEST,
        });

        const countHandler = new lambda_nodejs.NodejsFunction(
            this,
            'CountHandler',
            {
                entry: path.join(__dirname, 'lambda', 'count', 'app.ts'),
                handler: 'main',
                environment: {
                    DatabaseTable: dynamoTable.tableName,
                    AccessControlAllowOrigin: `https://${props.blogDomain}`,
                },
            },
        );

        dynamoTable.grantReadWriteData(countHandler);

        const helloHandler = new lambda_nodejs.NodejsFunction(
            this,
            'HelloHandler',
            {
                entry: path.join(__dirname, 'lambda', 'hello', 'index.ts'),
                handler: 'ApiLambda',
            },
        );

        const randomHandler = new lambda_nodejs.NodejsFunction(
            this,
            'RandomHandler',
            {
                entry: path.join(__dirname, 'lambda', 'random', 'index.ts'),
                handler: 'ApiLambda',
                environment: {
                    AccessControlAllowOrigin: `https://${props.blogDomain}`,
                },
            },
        );

        const api = new apigw.RestApi(this, 'API', {
            domainName: {
                domainName: props.apiDomain,
                certificate,
            },
            defaultCorsPreflightOptions: {
                allowOrigins: apigw.Cors.ALL_ORIGINS,
                exposeHeaders: apigw.Cors.DEFAULT_HEADERS,
                allowMethods: apigw.Cors.ALL_METHODS,
            },
            description: 'A fun API for varoius things I am playing with',
        });

        const hello = api.root.addResource('{hello+}', {
            defaultIntegration: new apigw.LambdaIntegration(helloHandler),
        });
        hello.addMethod('GET');

        const random = api.root.addResource('random').addResource('{number}');
        random.addMethod('GET', new apigw.LambdaIntegration(randomHandler), {
            methodResponses: [
                {
                    statusCode: '200',
                },
            ],
        });

        const count = api.root.addResource('count');
        count.addMethod('GET', new apigw.LambdaIntegration(countHandler), {
            methodResponses: [
                {
                    statusCode: '200',
                },
            ],
        });

        const ip = api.root.addResource('ip');
        ip.addMethod(
            'GET',
            new apigw.MockIntegration({
                passthroughBehavior:
                    apigw.PassthroughBehavior.WHEN_NO_TEMPLATES,
                requestTemplates: {
                    'application/json': '{"statusCode": 200}',
                    'text/html': '{"statusCode": 200}',
                },
                integrationResponses: [
                    {
                        statusCode: '200',
                        responseTemplates: {
                            'application/json':
                                '{"ip":"$context.identity.sourceIp"}',
                            'text/html': '$context.identity.sourceIp',
                        },
                    },
                ],
            }),
            {
                methodResponses: [
                    {
                        statusCode: '200',
                    },
                ],
            },
        );

        new apigw.Deployment(this, 'deployment', {
            api,
        }).applyRemovalPolicy(RemovalPolicy.RETAIN);

        new route53.ARecord(this, 'AliasRecordApi', {
            recordName: props.apiDomain,
            zone: hostedZone,
            target: route53.RecordTarget.fromAlias(
                new route53_targets.ApiGateway(api),
            ),
        });
    }
}
