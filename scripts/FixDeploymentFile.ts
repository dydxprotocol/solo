import fs from 'fs';

async function fixDeploymentFile() {
  const path = './node_modules/truffle/build/459.bundled.js';
  let fileContent = fs.readFileSync(path).toString('UTF-8');
  fileContent = fileContent.replace(
    'if (!block) return this.postDeploy(data);',
    'if (!block || !tx) return this.postDeploy(data);',
  );
  fs.writeFileSync(path, fileContent);
}

fixDeploymentFile()
  .catch(e => {
    console.error(e.message);
    process.exit(1);
  })
  .then(() => process.exit(0));
