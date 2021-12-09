import { createHash } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import { sync as globSync } from "glob";
import { chdir, cwd } from "process";
import { execSync } from "child_process";
import { Construct } from "constructs";
import { Bucket } from "aws-cdk-lib/lib/aws-s3";
import { Distribution } from "aws-cdk-lib/lib/aws-cloudfront";
import { BucketDeployment, Source } from "aws-cdk-lib/lib/aws-s3-deployment";
import path = require("path");

export interface HugoDeploymentProps {
    hugoPath: string;
    hugoDistPath: string;
    bucket: Bucket;
    distributionDomain: string,
    hashFile: string;
    distribution: Distribution;
}
export class HugoDeployment extends Construct {
    constructor(scope: Construct, id: string, props: HugoDeploymentProps) {
        super(scope, id);
        const hugoDistFullPath = path.join(props.hugoPath, props.hugoDistPath);
        execSync(
            `cd ${props.hugoPath} && rm -rf ${props.hugoDistPath} && hugo --minify`
        );

        let invalidations: string[] = [`/${props.hashFile}`];
        invalidations.push(...compareRemoteToLocal(
            props.distributionDomain,
            props.hashFile,
            hugoDistFullPath
        ))

        console.log(invalidations)

        new BucketDeployment(this, "HugoDeployment", {
            sources: [Source.asset(hugoDistFullPath)],
            destinationBucket: props.bucket,
            distribution: props.distribution,
            distributionPaths: invalidations,
        });
    }
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
        console.log(oldHashesJSON)
    } catch (e) {
        console.log('error getting file from web', e)
        return ['/*']
    }
    const oldHashes: Map<string, string> = new Map(
        Object.entries(JSON.parse(oldHashesJSON!))
    );
    return getInvalidations(oldHashes, newHashes);
}
