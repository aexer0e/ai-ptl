const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

// Parse version argument
const versionArg = process.argv[2];
if (!versionArg) {
    console.error("Error: Version argument required (format: N.N.N)");
    console.error("Usage: node scripts/build-mcaddon.cjs 1.0.0");
    process.exit(1);
}

const versionMatch = versionArg.match(/^(\d+)\.(\d+)\.(\d+)$/);
if (!versionMatch) {
    console.error("Error: Invalid version format. Expected N.N.N (e.g., 1.0.0)");
    process.exit(1);
}

const version = [
    parseInt(versionMatch[1]),
    parseInt(versionMatch[2]),
    parseInt(versionMatch[3]),
];

console.log(`Building version ${version.join(".")}...`);

// Run dash build
console.log("Running dash production build...");
try {
    execSync("dash -m production build exit", {
        stdio: "inherit",
        cwd: path.resolve(__dirname, ".."),
    });
} catch (error) {
    console.error("Build failed:", error.message);
    process.exit(1);
}

// Paths
const distPath = path.resolve(__dirname, "..", "builds", "dist");
const bpPath = path.join(distPath, "ns_ptl BP");
const rpPath = path.join(distPath, "ns_ptl RP");
const outputPath = path.resolve(__dirname, "..", "builds");
const addonName = `ns_ptl_${version.join(".")}.mcaddon`;
const addonPath = path.join(outputPath, addonName);

// Update version in manifest files
function updateManifestVersion(manifestPath, version) {
    if (!fs.existsSync(manifestPath)) {
        console.warn(`Warning: Manifest not found at ${manifestPath}`);
        return;
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

    // Update header version
    if (manifest.header) {
        manifest.header.version = version;
    }

    // Update all module versions
    if (manifest.modules) {
        manifest.modules.forEach((module) => {
            module.version = version;
        });
    }

    // Update dependency versions (for RP referencing BP)
    if (manifest.dependencies) {
        manifest.dependencies.forEach((dep) => {
            // Only update version for local pack dependencies (not Minecraft APIs)
            if (!dep.module_name) {
                dep.version = version;
            }
        });
    }

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 4));
    console.log(`Updated version in ${manifestPath}`);
}

// Update both manifests
updateManifestVersion(path.join(bpPath, "manifest.json"), version);
updateManifestVersion(path.join(rpPath, "manifest.json"), version);

// Create .mcaddon (zip file)
console.log(`Creating ${addonName}...`);

const output = fs.createWriteStream(addonPath);
const archive = archiver("zip", { zlib: { level: 9 } });

output.on("close", () => {
    console.log(`Created ${addonName} (${(archive.pointer() / 1024).toFixed(2)} KB)`);
    console.log(`Output: ${addonPath}`);
});

archive.on("error", (err) => {
    throw err;
});

archive.pipe(output);

// Add BP and RP folders to the archive
archive.directory(bpPath, "ns_ptl BP");
archive.directory(rpPath, "ns_ptl RP");

archive.finalize();
