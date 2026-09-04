const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const binRoot = path.join(root, 'bin');
const binaryNames = ['remoteit', 'connectd', 'demuxer', 'muxer'];

// Every arch the installer for this platform bundles (see binary-installer.sh and the
// `arch` lists in package.json). Each file must be a real executable: downloads.remote.it
// answers a missing key with its HTML download page and HTTP 200, so the `curl -f` in
// binary-installer.sh cannot tell a binary from a 404 - only the bytes can.
const platforms = {
  darwin: { archs: ['x64', 'arm64'], ext: '', format: 'Mach-O', magic: ['cffaedfe', 'cefaedfe', 'cafebabe'] },
  linux: { archs: ['x64', 'armv7l', 'arm64'], ext: '', format: 'ELF', magic: ['7f454c46'] },
  win32: { archs: ['ia32', 'x64', 'arm64'], ext: '.exe', format: 'PE', magic: ['4d5a'] },
};

const platform = platforms[process.platform];
if (!platform) {
  console.log(`[verify-binaries] No checks defined for platform '${process.platform}', skipping.`);
  process.exit(0);
}

function describe(filePath) {
  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch {
    return 'missing';
  }
  if (!stat.isFile() || stat.size === 0) return 'empty';
  const fd = fs.openSync(filePath, 'r');
  const head = Buffer.alloc(64);
  const read = fs.readSync(fd, head, 0, 64, 0);
  fs.closeSync(fd);
  const hex = head.subarray(0, read).toString('hex');
  if (platform.magic.some((magic) => hex.startsWith(magic))) return null;
  const text = head.subarray(0, read).toString('latin1').trimStart().toLowerCase();
  if (text.startsWith('<!doctype') || text.startsWith('<html')) return 'is an HTML page - the download URL resolved to the download page, not a binary';
  return `is not ${platform.format} (starts with ${hex.slice(0, 8)})`;
}

const problems = [];
for (const arch of platform.archs) {
  for (const name of binaryNames) {
    const filePath = path.join(binRoot, arch, `${name}${platform.ext}`);
    const problem = describe(filePath);
    if (problem) problems.push(`${filePath} ${problem}`);
  }
}

if (problems.length > 0) {
  console.error('[verify-binaries] Bundled binaries are not usable:');
  for (const entry of problems) {
    console.error(`  - ${entry}`);
  }
  console.error('[verify-binaries] Run `npm run install-binaries` in electron/ and retry.');
  process.exit(1);
}

console.log(`[verify-binaries] OK (${platform.archs.join(', ')})`);
