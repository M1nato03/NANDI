import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const dist = path.join(process.cwd(), 'dist-e2e');
const distB = path.join(process.cwd(), 'dist-e2e-b');

// If distB exists, just copy it over to dist-e2e
if (fs.existsSync(distB)) {
  execSync(`rm -rf ${dist}/*`);
  execSync(`cp -r ${distB}/* ${dist}/`);
} else {
  // First time: rebuild with a different version, save to distB, then copy to dist
  const pkgPath = path.join(process.cwd(), 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const oldVersion = pkg.version;
  pkg.version = '0.2.0';
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  
  try {
    execSync('npx vite build --outDir dist-e2e-b', { env: { ...process.env, VITE_E2E: '1' } });
  } finally {
    pkg.version = oldVersion;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  }
  
  execSync(`rm -rf ${dist}/*`);
  execSync(`cp -r ${distB}/* ${dist}/`);
}
