import { execFileSync } from 'node:child_process';
import { lstat, mkdtemp, rename, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const published = join(root, 'dist');
const staging = await mkdtemp(join(root, '.dist-build-'));

// Node's rename cannot replace a non-empty directory. Exchange the two
// directory names in one filesystem operation so readers always see dist/.
const exchangePaths = `
import ctypes, os, sys

source, destination = map(os.fsencode, sys.argv[1:3])
libc = ctypes.CDLL(None, use_errno=True)
if sys.platform == 'darwin':
    exchange = libc.renamex_np
    exchange.argtypes = [ctypes.c_char_p, ctypes.c_char_p, ctypes.c_uint]
    result = exchange(source, destination, 2)  # RENAME_SWAP
elif sys.platform.startswith('linux'):
    exchange = libc.renameat2
    exchange.argtypes = [ctypes.c_int, ctypes.c_char_p, ctypes.c_int, ctypes.c_char_p, ctypes.c_uint]
    result = exchange(-100, source, -100, destination, 2)  # RENAME_EXCHANGE
else:
    raise SystemExit('Atomic directory exchange requires macOS or Linux')
if result != 0:
    error = ctypes.get_errno()
    raise OSError(error, os.strerror(error))
`;

try {
  execFileSync(process.execPath, [join(root, 'site', 'scripts', 'build.mjs')], {
    cwd: root,
    env: { ...process.env, MALINA_BUILD_OUT: staging },
    stdio: 'inherit'
  });

  let hasPublished = false;
  try {
    await lstat(published);
    hasPublished = true;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  if (hasPublished) {
    execFileSync('python3', ['-c', exchangePaths, staging, published], {
      cwd: root,
      stdio: 'inherit'
    });
  } else {
    await rename(staging, published);
  }
} finally {
  await rm(staging, { recursive: true, force: true });
}
