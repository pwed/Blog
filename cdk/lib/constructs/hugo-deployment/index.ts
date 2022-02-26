import { readFileSync, writeFileSync } from 'fs';
import * as yaml from 'yaml';
import { execSync } from 'child_process';
import { Construct } from 'constructs';
import path = require('path');
import { pwed_static_site } from 'pwed-cdk';
import { aws_route53 } from 'aws-cdk-lib';

export interface HugoDeploymentProps {
    hugoPath: string;
    hugoDistPath: string;
    domain: string;
    hostedZone: aws_route53.IHostedZone;
    hashFile: string;
    apiDomain: string;
}

export class HugoDeployment extends Construct {
    constructor(scope: Construct, id: string, props: HugoDeploymentProps) {
        super(scope, id);
        const distpath = path.join(props.hugoDistPath, props.domain);
        const hugoDistFullPath = path.join(props.hugoPath, distpath);
        updateHugoConfig(path.join(props.hugoPath, 'config.yaml'), {
            blogDomain: props.domain,
            apiDomain: props.apiDomain,
        });
        execSync(
            `cd ${props.hugoPath} && rm -rf ${distpath} && hugo --minify --destination ${distpath}`,
        );

        // new pwed_static_site.StaticSite(this, 'HugoSite', {
        //     domain: props.domain,
        //     hostedZone: props.hostedZone,
        //     path: hugoDistFullPath,
        // });
    }
}

export function updateHugoConfig(
    configFile: string,
    config: { blogDomain: string; apiDomain: string },
) {
    const configYaml = yaml.parse(readFileSync(configFile, 'utf8'));
    configYaml.baseurl = `https://${config.blogDomain}/`;
    configYaml.params.api = config.apiDomain;
    writeFileSync(configFile, yaml.stringify(configYaml));
}
