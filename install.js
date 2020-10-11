const Loggy = require('./utils/Loggy');
const { exec } = require('child_process');
const fs = require('fs');

console.log(Loggy.bold`${Loggy.white`Starting WordPress base installation\n`}`);

if (fs.existsSync('./node_modules')) {
  console.log(Loggy.cyan`Packages seem to have already been installed. Skipping "npm install"...\n`);
  installWordPress();

  return;
}

// Install npm packages
let child = exec('npm install');
// child.stdout.setEncoding('utf8');

console.log(Loggy.white`Now installing npm packages. This might take a few minutes...\n`);

// After npm install
child.on('close', (code) => {
  if (code === 0) {
    console.log(Loggy.green`Successfully installed packages!\n`);

    installWordPress();

    return;
  }

  console.log(Loggy.red`"npm install" process exited with code ${code}`);
});

function installWordPress() {
  const https = require('https');
  const decompress = require('decompress');
  const readline = require('readline');
  const yargs = require('yargs');

  const argv = yargs
  .option('no-clean', {
    alias: 'nc',
    description: 'Keep downloaded wordpress.zip file',
    type: 'boolean',
  })
  .help()
  .alias('help', 'h')
  .argv;

  const config = require('./config.json');

  console.log(Loggy.white`Now starting WordPress download\n`);

  const fileName = 'wordpress.zip';
  const destination = config.buildOptions.project.wordpressRoot;

  if (fs.existsSync(destination)) {
    console.log(Loggy.cyan`WordPress seems to have already been installed! (Folder exists: "${destination}")\n`);

    successMessage();

    return;
  }

  if (!fs.existsSync(fileName)) {
    downloadFile();
  } else {
    unzipDownload();
  }

  function downloadFile() {
    const file = fs.createWriteStream(fileName);

    https.get('https://wordpress.org/latest.zip', (response) => {
      const fileSize = parseInt(response.headers['content-length'], 10);
      const sizeMB = (fileSize / 1048576).toFixed(2);
      let progress = 0;

      response.pipe(file);

      response.on('data', (chunk) => {
        progress += chunk.length;

        const progressPercentage = (Math.round(100 * (progress / fileSize))).toString().padStart('3', ' ');

        readline.clearLine(process.stdout, 0)
        readline.cursorTo(process.stdout, 0, null);

        process.stdout.write(
          Loggy.cyan`Downloading latest version of WordPress: ${ progressPercentage }% of ${ sizeMB } MB`
        );
      })

      response.on('end', () => {
        readline.clearLine(process.stdout, 0)
        readline.cursorTo(process.stdout, 0, null);

        console.log(Loggy.green`Latest WordPress zip download complete!\n`);

        unzipDownload();
      });
    });
  }

  function unzipDownload() {
    process.stdout.write(
      Loggy.cyan`Unzipping wordpress.zip to "${destination}"`
    );

    decompress(fileName, destination, { strip: 1 })
    .then(() => {
      readline.clearLine(process.stdout, 0)
      readline.cursorTo(process.stdout, 0, null);

      console.log(Loggy.green`Successfully unzipped all files to "${destination}"!\n`);

      if (!argv['no-clean']) {
        fs.unlinkSync(fileName);
      }

      successMessage();
    })
    .catch(error => {
      readline.clearLine(process.stdout, 0)
      readline.cursorTo(process.stdout, 0, null);

      console.log(Loggy.red`File (${fileName}) seems to have been corrupted. Attempting re-download. (${error})\n`);

      downloadFile();
    });
  }

  function successMessage() {
    console.log(Loggy.green`WordPress base installation complete. 🎉`);
    console.log(Loggy.cyan`Run "npm run dev" to start the development server.`);
    console.log(Loggy.cyan`Happy coding!`);
  }
};
