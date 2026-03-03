const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const bdir = path.resolve(__dirname, '..', 'baselines');
const cdir = path.resolve(__dirname, '..', 'results', 'current');

if (!fs.existsSync(bdir)) {
  console.log('No baselines dir');
  process.exit(0);
}

const files = fs.readdirSync(bdir).filter(f => f.endsWith('.png'));
console.log('Baselines files:', files.length);
files.forEach(f => {
  const bpath = path.join(bdir, f);
  const bh = crypto.createHash('sha256').update(fs.readFileSync(bpath)).digest('hex');
  const cPath = path.join(cdir, f);
  if (fs.existsSync(cPath)) {
    const ch = crypto.createHash('sha256').update(fs.readFileSync(cPath)).digest('hex');
    console.log(`${f}: baseline=${bh} current=${ch} equal=${bh===ch}`);
  } else {
    console.log(`${f}: baseline present, current missing`);
  }
});
