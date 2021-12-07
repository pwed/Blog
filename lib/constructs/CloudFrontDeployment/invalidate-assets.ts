import { createHash } from "crypto";
import { readFileSync } from "fs";
import { sync as globSync } from "glob";
import { chdir, cwd } from "process";
import { execSync } from "child_process";

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
      invalidations.push(k);
    }
  });
  return invalidations;
}

const oldHashesJSON = execSync('aws s3 cp s3://deploy-blogstack-blogbucket3e358f18-15mfcd732v3d6/.hashes.json -').toString()
const oldHashes: Map<string, string> = new Map(Object.entries(JSON.parse(oldHashesJSON)))

const newHashes = getHashes("**", "./blog/public");
// let jsonObject = Object.fromEntries(publicHashes);
// console.log(JSON.stringify(jsonObject));
// console.log(publicHashes)

console.log(getInvalidations(oldHashes, newHashes))

// console.log(newHashes, oldHashes)
