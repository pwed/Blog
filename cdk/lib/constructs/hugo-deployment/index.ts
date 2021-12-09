import { createHash } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import { sync as globSync } from "glob";
import * as yaml from 'yaml';
import { chdir, cwd } from "process";
import { execSync } from "child_process";
import { Construct } from "constructs";
import {
    aws_s3 as s3,
    aws_cloudfront as cf,
    aws_s3_deployment as s3deployment
} from 'aws-cdk-lib';
import path = require("path");

export interface HugoDeploymentProps {
    hugoPath: string;
    hugoDistPath: string;
    bucket: s3.Bucket;
    distributionDomain: string,
    hashFile: string;
    distribution: cf.Distribution;
    apiDomain: string;
}

export class HugoDeployment extends Construct {
    constructor(scope: Construct, id: string, props: HugoDeploymentProps) {
        super(scope, id);
        const hugoDistFullPath = path.join(props.hugoPath, props.hugoDistPath);
        updateHugoConfig(path.join(props.hugoPath, 'config.yaml'), { blogDomain: props.distributionDomain, apiDomain: props.apiDomain })
        execSync(
            `cd ${props.hugoPath} && rm -rf ${props.hugoDistPath} && hugo --minify`
        );

        let invalidations: string[] = [`/${props.hashFile}`];
        invalidations.push(...compareRemoteToLocal(
            props.distributionDomain,
            props.hashFile,
            hugoDistFullPath
        ))

        console.log('Invalidations:\n', invalidations)

        new s3deployment.BucketDeployment(this, "HugoDeployment", {
            sources: [s3deployment.Source.asset(hugoDistFullPath)],
            destinationBucket: props.bucket,
            distribution: props.distribution,
            distributionPaths: invalidations,
        });
    }
}

export function updateHugoConfig(configFile: string, config: {blogDomain: string, apiDomain: string}) {
    console.log('Updating config file', configFile)
    const configYaml = yaml.parse(readFileSync(configFile, 'utf8'));
    configYaml.baseurl = `https://${config.blogDomain}/`;
    configYaml.params.api = config.apiDomain;
    writeFileSync(configFile, yaml.stringify(configYaml));
}

function getHashes(glob: string, dir: string): Map<string, string> {
    let fh: Map<string, string> = new Map();
    let gs = globSync(glob, { cwd: dir, nodir: true });
    const pwd = cwd();
    chdir(dir);
    gs.forEach(function (file: string) {
        const fileBuffer = readFileSync(file, {});
        const hashSum = createHash("sha256");
        hashSum.update(fileBuffer);
        const hex = hashSum.digest("hex");
        fh.set(file, hex);
    });
    chdir(pwd);
    return fh;
}

function getInvalidations(
    oldHashes: Map<string, string>,
    newHashes: Map<string, string>
): string[] {
    let invalidations: string[] = [];
    oldHashes.forEach(function (v, k) {
        if (newHashes.get(k) !== v) {
            invalidations.push(`/${k}`);
        }
    });
    return invalidations;
}

function compareRemoteToLocal(domain: string, hashFile: string, localFolder: string): string[] {
    let oldHashesJSON: string
    const newHashes = getHashes("**", localFolder);
    writeFileSync(
        path.join(localFolder, hashFile),
        JSON.stringify(Object.fromEntries(newHashes))
    );
    try {
        oldHashesJSON = execSync(
            `curl https://${domain}/${hashFile}`
        ).toString();
    } catch (e) {
        console.log('error getting file from web', e)
        return ['/*']
    }
    const oldHashes: Map<string, string> = new Map(
        Object.entries(JSON.parse(oldHashesJSON!))
    );
    return getInvalidations(oldHashes, newHashes);
}