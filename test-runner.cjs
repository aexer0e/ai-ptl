/* eslint-disable */
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// CONFIGURATION
const CONTAINER_NAME = 'mc-gametest-runner';
const IDLE_TIMEOUT_MS = 10000; // Wait 10s for logs to settle
const BUILD_OUTPUT = './builds/dist/ns_ptl BP';

// Beta API dependencies required for GameTest
const BETA_DEPENDENCIES = [
    { "module_name": "@minecraft/server", "version": "2.5.0-beta" },
    { "module_name": "@minecraft/server-ui", "version": "2.1.0-beta" },
    { "module_name": "@minecraft/server-gametest", "version": "1.0.0-beta" }
];

/**
 * Patches the built manifest.json to use beta APIs required for GameTest
 */
function patchManifestForTesting() {
    const manifestPath = path.join(BUILD_OUTPUT, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Keep only the RP dependency (UUID-based), replace module dependencies with beta versions
    manifest.dependencies = manifest.dependencies.filter(dep => dep.uuid);
    manifest.dependencies.push(...BETA_DEPENDENCIES);
    
    // Change entry point to TestMain.js which includes GameTests
    const scriptModule = manifest.modules.find(m => m.type === 'script');
    if (scriptModule) {
        scriptModule.entry = 'scripts/TestMain.js';
    }
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 4));
    console.log("📝 Patched manifest with beta APIs for GameTest");
}

async function run() {
    // Always compile first
    console.log("🔨 Compiling with bridge...");
    execSync('dash -m production build exit', { stdio: 'inherit' });

    // Patch the built manifest for testing (adds beta APIs + gametest)
    patchManifestForTesting();

    // Stop any existing container and start fresh
    console.log("🐢 Starting server...");
    execSync('docker compose down', { stdio: 'inherit' });
    execSync('docker compose up -d', { stdio: 'inherit' });
    await waitForServerReady();

    console.log("🧪 Triggering GameTests...");
    runTestsAndWatch();
}

async function waitForServerReady() {
    console.log("⏳ Waiting for server to be ready...");
    return new Promise((resolve) => {
        // Small delay to ensure container log streaming is established
        setTimeout(() => {
            const logs = spawn('docker', ['logs', '-f', '--tail', '0', CONTAINER_NAME]);
            const onData = (data) => {
                const line = data.toString();
                if (line.includes('Server started')) {
                    console.log("✓ Server started, waiting for scripts to initialize...");
                    logs.kill();
                    setTimeout(resolve, 3000);
                }
            };
            logs.stdout.on('data', onData);
            logs.stderr.on('data', onData);
        }, 1000);
    });
}

function runTestsAndWatch() {
    let passCount = 0;
    let failCount = 0;
    let idleTimer = null;
    let testsStarted = false;
    let finished = false;

    const logs = spawn('docker', ['logs', '-f', '--tail', '0', CONTAINER_NAME]);

    const doFinish = () => {
        if (finished) return;
        finished = true;
        clearTimeout(idleTimer);
        clearTimeout(maxTimeout);
        logs.kill();
        
        console.log(`\n📊 SUMMARY: ${passCount} Passed, ${failCount} Failed`);
        console.log("🧹 Cleaning up...");
        execSync('docker compose down', { stdio: 'inherit' });
        
        if (failCount > 0 || passCount === 0) process.exit(1);
        process.exit(0);
    };

    logs.on('close', () => {
        // Log process closed unexpectedly
    });

    const handleLogLine = (line) => {
        // Detect when tests start running
        if (line.includes('Running') && line.includes('tests with tag')) {
            testsStarted = true;
        }

        // Only manage idle timer after tests have started
        if (testsStarted) {
            clearTimeout(idleTimer);
            idleTimer = setTimeout(doFinish, IDLE_TIMEOUT_MS);
        }

        if (line.includes('onTestPassed:')) {
            process.stdout.write(`✅ ${extractTestName(line)}\n`);
            passCount++;
        } 
        else if (line.includes('onTestFailed:')) {
            process.stdout.write(`❌ ${extractTestName(line)}\n`);
            const errorMsg = line.split(' - ')[1] || '';
            console.error(`   └─ ${errorMsg.trim()}`);
            failCount++;
        }
        else if (line.includes('[Scripting]')) {
            if (line.includes('WARN]')) {
                const msg = line.replace(/.*\[Scripting\]\s*/, '').trim();
                console.warn(`⚠️  ${msg}`);
            } else if (line.includes('ERROR]')) {
                const msg = line.replace(/.*\[Scripting\]\s*/, '').trim();
                console.error(`🔴 ${msg}`);
            } else if (line.includes('INFO]')) {
                const msg = line.replace(/.*\[Scripting\]\s*/, '').trim();
                console.log(`📝 ${msg}`);
            }
        }
    };

    logs.stdout.on('data', (data) => handleLogLine(data.toString()));
    logs.stderr.on('data', (data) => handleLogLine(data.toString()));

    // Set a maximum timeout in case tests never start (30 seconds)
    const maxTimeout = setTimeout(() => {
        if (!testsStarted) {
            console.error("🔴 Tests did not start within 30 seconds");
            doFinish();
        }
    }, 30000);

    sendCommand('gametest runset ns_ptl');
}

function sendCommand(cmd) {
    return new Promise((resolve) => {
        const p = spawn('docker', ['compose', 'exec', '-T', 'mc', 'send-command', cmd]);
        p.on('close', resolve);
    });
}

function extractTestName(line) {
    const match = line.match(/onTest(?:Passed|Failed): ([^\s-]+)/);
    return match ? match[1] : 'Unknown';
}

run();