import { getInput, setFailed, summary } from '@actions/core';

async function run() {
  try {
    const codeName = getInput('code_name');
    const packagedVersion = getInput('packaged_version');
    const builtForMC = getInput('built_for_mc');
    const minEngineVersion = getInput('min_engine_version');
    const buildTrain = getInput('build_train');
    const world = getInput('world') || undefined;
    const commitSha = getInput('commit_sha');
    const buildNumberInternal = getInput('build_number_internal');
    const buildID = getInput('build_id');
    const mcWorldURL = getInput('mcworld_url');

    summary.addRaw(`## Build Summary for \`${packagedVersion}\``);
    summary.addEOL();
    if (world) {
    summary.addRaw(`Generated a build of ${codeName} using the world ${world}`);}
    else {
      summary.addRaw(`Generated a build of ${codeName}`);
    }
    summary.addBreak();
    summary.addRaw(`Built for Minecraft ${builtForMC} targetting engine version ${minEngineVersion}`);
    summary.addBreak();
    if(mcWorldURL) summary.addLink("Download the build", mcWorldURL);
    summary.addDetails(`Install Instructions`, ` Download the package then unzip it. Double click the .mcworld / .mcaddon file to install it on your device. (You may need to right click and open with MC Preview)</details>`);
    summary.addSeparator();
    summary.addHeading("Build Meta", 3);
    const listData = [
      `- Commit SHA: \`${commitSha}\``,
      `- Build Id: \`${buildID}\``,
      `- Internal Build Number: ${buildNumberInternal}`,
      `- Build Meta:`,
      `- Inputs: ${buildTrain}`,
      `- Packaged Version: \`${packagedVersion}\``,
      `- World: ${world || 'N/A'}`,
      `- Built For Minecraft: ${builtForMC}`,
      `- Minimum Engine Version: ${minEngineVersion}`
    ];
    listData.forEach(item => summary.addRaw(item));

    await summary.write();
  } catch (error) {
    setFailed(error.message);
  }
}

run();