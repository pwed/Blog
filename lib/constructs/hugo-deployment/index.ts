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
    bucketName?: string;
    distribution: Distribution;
}
export class HugoDeployment extends Construct {
    constructor(scope: Construct, id: string, props: HugoDeploymentProps) {
        super(scope, id);
        const hugoDistFullPath = path.join(props.hugoPath, props.hugoDistPath);
        execSync(
            `cd ${props.hugoPath} && rm -rf ${props.hugoDistPath} && hugo`
        );

        let invalidations: string[] = [];
        if (props.bucketName)
            invalidations = compareBucketToLocal(
                props.bucketName!,
                hugoDistFullPath
            );

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

function compareBucketToLocal(bucket: string, localFolder: string): string[] {
    const oldHashesJSON = execSync(
        `aws s3 cp s3://${bucket}/.hashes.json -`
    ).toString();
    const oldHashes: Map<string, string> = new Map(
        Object.entries(JSON.parse(oldHashesJSON))
    );

    const newHashes = getHashes("**", localFolder);
    writeFileSync(
        `${localFolder}/.hashes.json`,
        JSON.stringify(Object.fromEntries(newHashes))
    );

    return getInvalidations(oldHashes, newHashes);
}
