/**
 * Randomize UUIDs in manifest files
 * 
 * This script generates new UUIDs for all pack identifiers in BP and RP manifests.
 * The RP header UUID is referenced in BP dependencies, so it's updated in both places.
 * 
 * Usage: node scripts/randomize-uuids.cjs
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function generateUUID() {
    return crypto.randomUUID();
}

function readJsonc(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    // Remove comments for parsing (simple approach - removes // comments)
    const jsonContent = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    return JSON.parse(jsonContent);
}

function writeJsonc(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
}

function main() {
    const projectRoot = path.resolve(__dirname, '..');
    const bpManifestPath = path.join(projectRoot, 'BP', 'manifest.json');
    const rpManifestPath = path.join(projectRoot, 'RP', 'manifest.json');

    // Read manifests
    const bpManifest = readJsonc(bpManifestPath);
    const rpManifest = readJsonc(rpManifestPath);

    // Generate new UUIDs
    const newUUIDs = {
        bpHeader: generateUUID(),
        bpDataModule: generateUUID(),
        bpScriptModule: generateUUID(),
        rpHeader: generateUUID(),
        rpResourcesModule: generateUUID(),
    };

    console.log('Generated new UUIDs:');
    console.log('  BP Header:', newUUIDs.bpHeader);
    console.log('  BP Data Module:', newUUIDs.bpDataModule);
    console.log('  BP Script Module:', newUUIDs.bpScriptModule);
    console.log('  RP Header:', newUUIDs.rpHeader);
    console.log('  RP Resources Module:', newUUIDs.rpResourcesModule);

    // Update BP manifest
    bpManifest.header.uuid = newUUIDs.bpHeader;
    bpManifest.modules[0].uuid = newUUIDs.bpDataModule;
    bpManifest.modules[1].uuid = newUUIDs.bpScriptModule;
    
    // Update RP dependency in BP manifest
    for (const dep of bpManifest.dependencies) {
        if (dep.uuid && !dep.module_name) {
            dep.uuid = newUUIDs.rpHeader;
        }
    }

    // Update RP manifest
    rpManifest.header.uuid = newUUIDs.rpHeader;
    rpManifest.modules[0].uuid = newUUIDs.rpResourcesModule;

    // Write updated manifests
    writeJsonc(bpManifestPath, bpManifest);
    writeJsonc(rpManifestPath, rpManifest);

    console.log('\n✅ Manifests updated successfully!');
    console.log('   - BP/manifest.json');
    console.log('   - RP/manifest.json');
}

main();
