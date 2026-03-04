const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const binRoot = path.join(root, 'bin');
const binaryNames = ['remoteit', 'connectd', 'demuxer', 'muxer'];
const executableExt = {
  darwin: '',
  linux: '',
  win32: '.exe',
};
const requiredArchsByPlatform = {
  darwin: ['x64', 'arm64'],
  linux: ['x64'],
  win32: ['x64'],
};

function existsNonEmpty(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return stat.isFile() && stat.size > 0;
  } catch {
    return false;
  }
}

function requiredSetsForPlatform(platform) {
  const archs = requiredArchsByPlatform[platform] || [];
  const ext = executableExt[platform] || '';
  const files = binaryNames.map((name) => `${name}${ext}`);
  return archs.map((arch) => [arch, files]);
}

const sets = requiredSetsForPlatform(process.platform);
if (sets.length === 0) {
  console.log(`[verify-binaries] No checks defined for platform '${process.platform}', skipping.`);
  process.exit(0);
}

const missing = [];
for (const [arch, files] of sets) {
  for (const file of files) {
    const fullPath = path.join(binRoot, arch, file);
    if (!existsNonEmpty(fullPath)) {
      missing.push(fullPath);
    }
  }
}

if (missing.length > 0) {
  console.error('[verify-binaries] Missing required bundled binaries:');
  for (const entry of missing) {
    console.error(`  - ${entry}`);
  }
  console.error('[verify-binaries] Run `npm run install-binaries` in electron/ and retry.');
  process.exit(1);
}

console.log('[verify-binaries] OK');
