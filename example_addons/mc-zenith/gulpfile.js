import core from "@actions/core";
import { deleteSync } from "del";
import dotenv from "dotenv";
import fs from "fs";
import * as gulp from "gulp";
import gulpFilter from "gulp-filter";
import gulpGit from "gulp-git";
import unzip from "gulp-unzip";
import gulpZip from "gulp-zip";
import yargs from "yargs";
import LangParser from "./tools/build/lang-parser.js";
import LevelDatEditor from "./tools/build/level-dat-editor.js";

/* global process, console */

// Configurable Variables
const distPath = 'builds/dist';
const buildPath = 'build';

// Parse command-line arguments
const argv = yargs(process.argv.slice(2)).argv;
const train = argv.train || "Internal";
const productCodeName = argv.codename || "unknown";
const productReleaseName = argv['release-name'] || "unknown";
const internalBuildNumber = argv['internal-build-number'] !== undefined ? argv['internal-build-number'] : "unknown";
const packageForSubmission = argv['package-for-submission'] || false;

// Load environment variables from .env file
dotenv.config();
const runID = process.env.RUN_ID || "dev";
const runNumber = process.env.RUN_NUMBER || "dev";
const commitSHA = process.env.COMMIT_SHA || await getCommitSha();
const version_tag = process.env.VERSION_TAG || "dev";

// Global Scope Variables
const compilerPackName = getPackagedPackName();
const mappedTrainName = mapTrainName(train);
let productName = getProductName();
let packVersion;
let version;

console.log(`runID: ${runID}, runNumber: ${runNumber}, commitSHA: ${commitSHA}`);
console.log(`Train: ${train}, Mapped Train Name: ${mappedTrainName}, World: ${argv.world}, Codename: ${productCodeName}, Release Name: ${productReleaseName}, Internal Build Number: ${internalBuildNumber}`);
console.log(`Packaging for submission: ${packageForSubmission}`);

function readJsonFile(filePath) {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
}

function writeJsonFile(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function getPackagedPackName() {
    const compilerConfig = readJsonFile('.bridge/compiler/writeForPackaging.json');
    const rewriteForPackagingEntry = compilerConfig.plugins.find(item => Array.isArray(item) && item[0] === 'rewriteForPackaging');
    if (!rewriteForPackagingEntry) {
        throw new Error("rewriteForPackaging plugin not found in compiler config.");
    }
    return rewriteForPackagingEntry[1].packName;
}

function mapTrainName(train) {
    const trainMap = {
        "Release Candidate": "rc",
        "Content Complete": "cc",
        "Alpha": "alpha",
        "First Playable": "fp",
        "First Explorable": "fe",
        "Internal": "internal"
    };
    return trainMap[train] || train.toLowerCase();
}

function getProductName() {
    if (mappedTrainName === "rc"){
        return productReleaseName;
    }
    else {
        return productCodeName;
    }
}

async function getCommitSha() {
    try {
        const hash = await new Promise((resolve, reject) => {
            gulpGit.revParse({ args: 'HEAD' }, (err, hash) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(hash.trim());
                }
            });
        });
        return hash;
    } catch (err) {
        return "unknown";
    }
}

gulp.task("clean-build", async () => {
    console.log("Cleaning build directory...");
    return deleteSync([`${buildPath}/`]);
});

gulp.task("versionConstructor", async() => {
    const bpManifest = readJsonFile(`${distPath}/behavior_packs/${compilerPackName}/manifest.json`);
    packVersion = bpManifest.header.version.join(".");
    console.log(`Behavior Pack Version: ${packVersion}`);

    if (train === "Internal") {
        version = `v${packVersion}-${mappedTrainName}.${internalBuildNumber}+sha.${commitSHA.substring(0, 6)}`;
        console.log(`Version: ${version}`);
        return;
    }
    if(train === "Content Complete"){
        console.log("Content Complete train detected. Using version tag for versioning.");
        version = `${version_tag}+sha.${commitSHA.substring(0, 6)}`;
        console.log(`Version: ${version}`);
        return;
    }

    version = `v${packVersion}-${mappedTrainName}+sha.${commitSHA.substring(0, 6)}`;
    console.log(`Version: ${version}`);
    return;
})

gulp.task("copy-rp", () => {
    console.log("Copying resource packs...");
    return gulp.src(`${distPath}/resource_packs/**/*`, {encoding: false}).pipe(gulp.dest(`${buildPath}/resource_packs`, {encoding: false}));
})

gulp.task("copy-bp", () => {
    console.log("Copying behavior packs...");
    return gulp.src(`${distPath}/behavior_packs/**/*`, {encoding: false}).pipe(gulp.dest(`${buildPath}/behavior_packs`, {encoding: false}));
})

gulp.task("build-versioning-lang", async() => {
    const RPLangParser = new LangParser(`${buildPath}/resource_packs/${compilerPackName}/texts/en_US.lang`);
    const BPLangParser = new LangParser(`${buildPath}/behavior_packs/${compilerPackName}/texts/en_US.lang`);

    RPLangParser.setValueByKey("pack.name", `${productName} RP - ${version}`);
    RPLangParser.setValueByKey("pack.description", `Resource Pack for ${productName} - ${version}`);
    RPLangParser.setValueByKey("build.version", `${productName}_${version}`);
    RPLangParser.setValueByKey("build.id", runID);
    RPLangParser.setValueByKey("build.commitSHA", commitSHA);
    RPLangParser.writeToFile();

    BPLangParser.setValueByKey("pack.name", `${productName} BP - ${version}`);
    BPLangParser.setValueByKey("pack.description", `Behavior Pack for ${productName} - ${version}`);
    BPLangParser.writeToFile();
    return;
})

gulp.task("build-versioning-world", async() => {
    const levelName = packageForSubmission ? productName : `${productName}_${version}`;
    const levelNameFilePath = `${buildPath}/levelname.txt`;
    //const sanitizedVersion = version.split('+')[0]; // This will remove the + and anything after it
    const levelDat = new LevelDatEditor(`${buildPath}/level.dat`);
    levelDat.setValue("LevelName", levelName);
    levelDat.writeToFile();
    await fs.writeFileSync(levelNameFilePath, levelName);
    return;
 });

 gulp.task("copy-world", async () => {
    const worldToCopy = argv.world;
    if (!worldToCopy) {
        throw new Error("No world specified. Please specify a world to copy with --world <world_name>");
    }
    console.log(`Copying world ${worldToCopy}...`);
    await new Promise((resolve, reject) => {
        gulp.src(`worlds/${worldToCopy}/**/*`, { encoding: false })
            .pipe(gulp.dest(`${buildPath}`, { encoding: false }))
            .on('end', resolve)
            .on('error', reject);
    });

    if (packageForSubmission) {
        console.log("Applying default world_icon.jpeg");
        await new Promise((resolve, reject) => {
            gulp.src('.packaging_assets/Content/world_template/world_icon.jpeg', { encoding: false })
                .pipe(gulp.dest(`${buildPath}`, { encoding: false }))
                .on('end', resolve)
                .on('error', reject);
        });
    }
    return;
});

gulp.task("sanitize-manifests", async() => {
    if(!packageForSubmission) return;
    console.log("Sanitizing manifests...");
    const bpManifestPath = `${buildPath}/behavior_packs/${compilerPackName}/manifest.json`;
    const rpManifestPath = `${buildPath}/resource_packs/${compilerPackName}/manifest.json`;
    const bpManifest = readJsonFile(bpManifestPath);
    const rpManifest = readJsonFile(rpManifestPath);
    if (bpManifest.metadata && bpManifest.metadata.generated_with) {
        delete bpManifest.metadata.generated_with;
    }
    if (rpManifest.metadata && rpManifest.metadata.generated_with) {
        delete rpManifest.metadata.generated_with;
    }
    writeJsonFile(bpManifestPath, bpManifest);
    writeJsonFile(rpManifestPath, rpManifest);
})

gulp.task('create-mcworld', async () => {
    console.log("Creating .mcworld file...");
    const filter = gulpFilter(['**', '!build/output/**'], { restore: true });
    return gulp.src("build/**/*", { base: "build", encoding: false })
        .pipe(filter)
        .pipe(gulpZip(`${productName}_${version}.mcworld`))
        .pipe(gulp.dest("build/output"), { encoding: false });
});

gulp.task('create-mcaddon', async () => {
    console.log("Creating .mcaddon file...");
    const filter = gulpFilter(['**', '!build/output/**'], { restore: true });
    return gulp.src("build/**/*", { base: "build", encoding: false })
        .pipe(filter)
        .pipe(gulpZip(`${productName}_${version}.mcaddon`))
        .pipe(gulp.dest("build/output"), { encoding: false });
});

gulp.task('create-mctemplate', async () => {
    console.log("Copying world template files...");
    // Copy manifest.json to the root of the build directory
    await new Promise((resolve, reject) => {
        gulp.src('.packaging_assets/Content/world_template/manifest.json', { encoding: false })
            .pipe(gulp.dest('build', { encoding: false }))
            .on('end', resolve)
            .on('error', reject);
    });

    // Copy texts contents to the texts folder within the build directory
    await new Promise((resolve, reject) => {
        gulp.src('.packaging_assets/Content/world_template/texts/**/*', { encoding: false })
            .pipe(gulp.dest('build/texts', { encoding: false }))
            .on('end', resolve)
            .on('error', reject);
    });

    const worldTemplateLangParser = new LangParser(`${buildPath}/texts/en_US.lang`);
    const levelName = packageForSubmission ? productName : `${productName}_${version}`;
    worldTemplateLangParser.setValueByKey("pack.name", levelName);
    worldTemplateLangParser.setValueByKey("pack.description", `${productName} - ${version}`);
    worldTemplateLangParser.writeToFile();
    const filter = gulpFilter(['**', '!build/output/**'], { restore: true });
    console.log("Creating .mctemplate file...");
    return gulp.src("build/**/*", { base: "build", encoding: false })
        .pipe(filter)
        .pipe(gulpZip(`${productName}_${version}.mctemplate`))
        .pipe(gulp.dest("build/output"), { encoding: false });
});

gulp.task("copy-packaging-assets", async () => {
    if (!packageForSubmission) return Promise.resolve("Not building for submission. Skipping packaging assets copy.");
    const packagingAssetsFilter = gulpFilter(['**', '!**/Content/world_template/**'], { restore: true });
    return gulp.src('.packaging_assets/**/*', { encoding: false })
        .pipe(packagingAssetsFilter)
        .pipe(gulp.dest('build/output/submission', { encoding: false }))
});

gulp.task("copy-world-bp-rp", () => {
    if (!packageForSubmission) return Promise.resolve("Not building for submission. Skipping world, bp, rp copy.");
    console.log("Copying world, bp, rp...");
    const outputFilter = gulpFilter(['**', '!build/output/**'], { restore: true });
    
    return gulp.src("build/**/*", { encoding: false })
            .pipe(outputFilter)
            .pipe(gulp.dest('build/output/submission/Content/world_template', { encoding: false }))
});

gulp.task("copy-skinpack", () => {
    if (!packageForSubmission) return Promise.resolve("Not building for submission. Skipping skinpack copy.");
    console.log("Copying Skinpack...");
    return gulp.src("skins/*_skinpack.zip", { encoding: false })
            .pipe(unzip())
            .pipe(gulp.dest('build/output/submission/', { encoding: false }))

});

gulp.task("zip-submission-package", () => {
    if (!packageForSubmission) return Promise.resolve("Not building for submission. Skipping zipping submission package.");
    console.log("Zipping submission package...");
    return gulp.src("build/output/submission/**/*", { encoding: false })
            .pipe(gulpZip(`${productName}_${version}.zip`))
            .pipe(gulp.dest("build/output"), { encoding: false })
});

gulp.task("create-submission-package", gulp.series("copy-packaging-assets", "copy-world-bp-rp", "copy-skinpack", "zip-submission-package"));

gulp.task("actions-output", async () => {
        const configFile = readJsonFile('./config.json')
        const bpManifest = readJsonFile(`${distPath}/behavior_packs/${compilerPackName}/manifest.json`)
        const mcTarget = configFile.gm1Dash.mcTargetBuild.version
        const bpTargetEngine = bpManifest.header.min_engine_version.join(".")
        core.setOutput('PACKAGED_VERSION', `${productName}_${version}`);
        core.setOutput('PACKAGED_VERSION_TAG', version);
        core.setOutput('BUILT_FOR_MC', mcTarget);
        core.setOutput('MIN_ENGINE_VERSION', bpTargetEngine);
});

gulp.task("build", gulp.series("clean-build", gulp.parallel("copy-rp", "copy-bp", "copy-world"), "versionConstructor", "build-versioning-lang", "build-versioning-world", "sanitize-manifests", "create-mcworld", "create-mctemplate", "create-submission-package", "actions-output"));

gulp.task("build", gulp.series("clean-build", gulp.parallel("copy-rp", "copy-bp"), "versionConstructor", "build-versioning-lang",  "sanitize-manifests", "create-mcaddon", "actions-output"));