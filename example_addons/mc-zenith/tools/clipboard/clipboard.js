import { execSync } from "child_process";
import fs from "fs";
import process from "process";

const CLIPBOARD_FILE = process.cwd() + "/tools/clipboard/clipboard.txt";

function main() {
    if (!fs.existsSync(CLIPBOARD_FILE)) fs.writeFileSync(CLIPBOARD_FILE, "");
    const clipboard = fs.readFileSync(CLIPBOARD_FILE, "utf8");
    const text = clipboard.trim().replace(/\n/g, "");
    execSync(`Set-Clipboard -Value "${text}"`, {"shell":"powershell.exe"});
}

main();