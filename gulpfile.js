/**
 * Packages
 */

// Base packages
const gulp         = require('gulp');
const fs           = require('fs');
const path         = require('path');
const Loggy        = require('./utils/Loggy');
const crypto       = require('crypto');
const { exec, execFile } = require('child_process');

// Gulp helper packages
const notify       = require('gulp-notify');
const cache        = require('gulp-cached');
const gulpif       = require('gulp-if');
const rename       = require('gulp-rename');
const map          = require('map-stream');

// SCSS packages
const scss         = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps   = require('gulp-sourcemaps');

// JavaScript packages
const rollup       = require('rollup').rollup;
const babel        = require('@rollup/plugin-babel').babel;
const resolve      = require('rollup-plugin-node-resolve');
const commonjs     = require('rollup-plugin-commonjs');
const terser       = require('rollup-plugin-terser').terser;
const builtins     = require('rollup-plugin-node-builtins');

// Image packages
const sharp        = require('sharp');
const pngquant     = require('pngquant-bin');
const mozjpeg      = require('mozjpeg');

// Development server packages
const phpConnect   = require('gulp-connect-php');
const browserSync  = require('browser-sync').create();


/**
 * Load the gulp config.
 */
const configLocation = path.resolve('./config.json');
const package        = require('./package.json');

if (!fs.existsSync(configLocation)) {
  console.error(Loggy.red`[WordPress Dev Server]: No config file found in project folder (${configLocation})`);
  process.exit(5);
}

const config = require(configLocation);
config.buildOptions.project.source = path.resolve(config.buildOptions.project.source);
config.buildOptions.project.destination = path.resolve(config.buildOptions.project.destination);
config.buildOptions.project.name = config.buildOptions.project.name || 'Unnamed project';

// Log project title
console.log(Loggy.white`${config.buildOptions.project.name}`);

let ENVIRONMENT = 'development';
let rollupCache;
const generatedValues = {};

/**
 * Set the destination if building.
 *
 * @param {function} done
 */
 function setBuildEnvironment(done) {
  config.buildOptions.project.destination = config.buildOptions.project.distribution;

  done();
}

/**
 * Set the environment variable.
 *
 * @param {function} done
 */
function setProductionEnvironment(done) {
  ENVIRONMENT = 'production';

  done();
}

/**
 * Create a gulpified BrowserSync reload.
 *
 * @param {function} done
 */
function reload(done) {
  browserSync.reload();
  done();
}

/**
 * Create resolved source paths from config.
 *
 * @param {string|array} location
 * @param {string} prefix
 */
function createSource(location, prefix) {
  if (typeof location === 'string') {
    return path.join(
      prefix || config.buildOptions.project.source,
      location
    );
  } else if (location instanceof Array) {
    return location.map(src => {
      let not = '';

      if (src.indexOf('!') === 0) {
        not = '!';
        src = src.substr(1);
      }

      return not + path.join(
        prefix || config.buildOptions.project.source,
        src
      );
    });
  }

  console.error(Loggy.red`[${config.buildOptions.project.name}] Could not create source for: ${location}`);

  return false;
}

/**
 * Create concatenated source paths from config.
 *
 * @param {string|array} location
 * @param {string} prefix
 */
function concatSource(location, prefix) {
  if (typeof location === 'string') {
    let not = '';

    if (location.indexOf('!') === 0) {
      not = '!';
      location = location.substr(1);
    }

    return `${not}${prefix || config.buildOptions.project.source}/${location}`;

  } else if (location instanceof Array) {
    return location.map(src => {
      let not = '';

      if (src.indexOf('!') === 0) {
        not = '!';
        src = src.substr(1);
      }

      return `${not}${prefix || config.buildOptions.project.source}/${src}`;
    });
  }

  console.error(Loggy.red`[${config.buildOptions.project.name}] Could not join source for: ${location}`);

  return false;
}

/**
 * Clean the destination folder.
 */
function cleanTask(done) {
  fs.unlink(config.buildOptions.project.destination, () => {
    console.info(Loggy.blue`[${config.buildOptions.project.name}]: Done cleaning destination folder: ${config.buildOptions.project.destination}/`);

    done();
  });
}

/**
 * Compile CSS to SCSS and compress.
 */
function scssTask() {
  console.info(Loggy.blue`[${config.buildOptions.project.name}]: Compiling CSS...`);

  return gulp.src(
    createSource(config.buildOptions.scss.source),
    { base: createSource(config.buildOptions.scss.base), allowEmpty: true })
  .pipe(gulpif(ENVIRONMENT === 'development', sourcemaps.init()))
  .pipe(scss({ outputStyle: 'compressed' }))
    .on('error', notify.onError('SCSS compile error: <%= error.message %>'))
  .pipe(autoprefixer({ overrideBrowserslist: config.buildOptions.scss.browserList }))
  .pipe(gulpif(ENVIRONMENT === 'development', sourcemaps.write('.')))
  .pipe(gulp.dest(createSource(config.buildOptions.scss.destination, config.buildOptions.project.destination)))
  .pipe(browserSync.stream());
}

/**
 * Compile ES6 to ES5, minify and bundle script file.
 */
function jsTask() {
  console.info(Loggy.blue`[${config.buildOptions.project.name}]: Compiling JS...`);

  const bundleFile = createSource(config.buildOptions.javascript.destination, config.buildOptions.project.destination);

  const terse = () => (ENVIRONMENT !== 'development') ? terser() : null;
  const babelify = () => (ENVIRONMENT !== 'development') ? babel({
    babelHelpers: 'bundled',
    exclude: [/core-js/],
    presets: [
      ["@babel/preset-env", {
        modules: false,
        spec: true,
        forceAllTransforms: true,
        targets: "IE 11, > 0.25%, not dead",
        corejs: "3.0.0",
        useBuiltIns: 'usage'
      }]
    ]
  }) : null;

  return rollup({
    input: createSource(config.buildOptions.javascript.source),
    inlineDynamicImports: true,
    cache: rollupCache,
    treeshake: true,
    plugins: [
      commonjs(),
      resolve({
        preferBuiltins: false
      }),
      babelify(),
      builtins(),
      terse()
    ]
  })
  .then(bundle => {
    rollupCache = bundle.cache;

    return bundle.write({
      file: bundleFile,
      format: 'iife',
      sourcemap: (ENVIRONMENT === 'development')
    });
  })
  .catch(error => {
    console.log(error);
    notify.onError('JS compile error: <%= error.message %>')
  });
}

/**
 * Process all images.
 */
function imageAssetsTask(done) {
  console.info(Loggy.blue`[${config.buildOptions.project.name}]: Processing images...`);

  if (ENVIRONMENT === 'development') {
    // If we're in dev mode, just move the images instead of optimizing them
    return gulp.src(concatSource(config.buildOptions.images.source), {
      base: config.buildOptions.project.source,
      allowEmpty: true
    })
    .pipe(cache('assets-images', { optimizeMemory: true }))
    .pipe(gulp.dest(config.buildOptions.project.destination))

    &&

    gulp.src(concatSource(config.buildOptions.images.source), {
      base: config.buildOptions.project.source,
      allowEmpty: true
    })
    .pipe(rename({ extname: '.webp' }))
    .pipe(gulp.dest(config.buildOptions.project.destination));
  }

  return gulp.src(concatSource(config.buildOptions.images.source), {
    base: config.buildOptions.project.source,
    allowEmpty: true
  })
  .pipe(cache('assets-images-optimize', { optimizeMemory: true }))
  .pipe(map(
    async (file, cb) => {
      const relativePath = path.dirname(file.path.replace(path.resolve(config.buildOptions.project.source), ''));
      let fileExt = path.extname(file.path);
      const fileNameNoExt = path.basename(file.path, fileExt);
      fileExt = fileExt.substr(1);

      // Make directory if it doesn't exist
      fs.mkdirSync(path.resolve(path.join(config.buildOptions.project.destination, relativePath)), { recursive: true });

      // Always make webp version
      const types = {
        webp: 'webp'
      };

      // Check which other version type to create
      if (fileExt === 'jpeg' || fileExt === 'jpg') {
        types.jpeg = 'jpg';
      } else if (fileExt === 'png') {
        types.png = 'png';
      }

      // For each type, create a new file
      const promises = Object.entries(types).map((entry) => new Promise(resolve => {
        const fileName = `${fileNameNoExt}.${entry[1]}`;
        const outputFilePath = path.resolve(path.join(config.buildOptions.project.destination, relativePath, fileName));

        if (entry[0] === 'png') {
          execFile(pngquant, [
              '--quality', `${config.buildOptions.images.png.quality[0]}-${config.buildOptions.images.png.quality[1]}`,
              '--speed', 8,
              '--verbose',
              '-o', outputFilePath,
              file.path
            ],
            (err, stdout, stderr) => {
              if (err) {
                console.log(err, stdout, stderr);
              }
              resolve();
            }
          );
        } else if (entry[0] === 'jpeg') {
          execFile(mozjpeg, [
              '-quality', config.buildOptions.images.jpeg.quality,
              '-outfile', outputFilePath,
              file.path
            ],
            () => {
              resolve();
            }
          );
        } else {
          sharp(file.contents)
          [entry[0]](config.buildOptions.images[entry[0]])
          .toFile(outputFilePath, () => {
            resolve();
          });
        }
      }));

      await Promise.all(promises);

      cb(null);
    }
  ));
}

/**
 * Inline external SVG into HTML.
 *
 * @param {*} file
 * @param {function} cb
 */
function inlineSvgHTML(file, cb) {
  return async (file, cb) => {
    const urlPattern = /<img\s?(.+)?\ssrc="inline:([^"]+\/.+svg)"([^>]+)?>/gmi;
    let fileContents = file.contents.toString('utf8');
    let urlMatch, svgPath, svgContents, svgAttributes;

    // Loop through all occurrences of the URL-pattern
    while ((urlMatch = urlPattern.exec(fileContents)) !== null) {
      svgAttributes = (urlMatch[1] || '');
      svgPath = (urlMatch[2] || '');
      svgAttributes += (urlMatch[3] || '');

      // Attempt to read the SVG file
      if (fs.existsSync(path.join(config.buildOptions.project.source, svgPath))) {
        svgContents = fs.readFileSync(
          path.join(config.buildOptions.project.source, svgPath)
        ).toString('utf8');

        svgContents = svgContents.replace(/<svg\s(.+?)>/, `<svg $1 ${svgAttributes}>`);

        // Replace the matched string with the data URI
        fileContents = fileContents.slice(0, urlMatch.index)
          + svgContents.trim().replace(/(\r\n|\n|\r)/gm, '')
          + fileContents.slice((urlMatch.index + urlMatch[0].length));

        urlPattern.lastIndex = (urlMatch.index + 1);
      } else {
        console.log(Loggy.red`[${config.buildOptions.project.name}]: Inline SVG in HTML: File: ${path.join(config.buildOptions.project.source, svgPath)} does not exist`);
      }
    }

    file.contents = Buffer.from(fileContents);
    return cb(null, file);
  }
}

/**
 * Move all default assets.
 */
function otherAssetsTask(done) {
  if (config.buildOptions.otherAssets.source.length === 0) {
    done();
    return;
  }

  console.info(Loggy.blue`[${config.buildOptions.project.name}]: Moving other assets...`);

  return gulp.src(createSource(config.buildOptions.otherAssets.source), {
    base: config.buildOptions.project.source,
    allowEmpty: true
  })
  .pipe(cache('assets-default', { optimizeMemory: true }))
  .pipe(gulp.dest(config.buildOptions.project.destination));
}

/**
 * Move HTML files to destination while inlining SVG files.
 */
function htmlTask() {
  console.info(Loggy.blue`[${config.buildOptions.project.name}]: Parsing HTML...`);

  return gulp.src(concatSource([
    config.buildOptions.pages.source,
    config.buildOptions.partials.source,
    config.buildOptions.includes.source,
  ]), {
    base: createSource(config.buildOptions.pages.base)
  })
  .pipe(map(inlineSvgHTML()))
  .pipe(map(replaceVariables()))
  // .pipe(htmlmin({ collapseWhitespace: true }))
  .pipe(gulp.dest(config.buildOptions.project.destination));
}

/**
 * Replace variables in HTML.
 *
 * @param {*} file
 * @param {function} cb
 */
function replaceVariables(file, cb) {
  function checksum(str, algorithm, encoding) {
    return crypto
      .createHash(algorithm || 'md5')
      .update(str, 'utf8')
      .digest(encoding || 'hex')
  }

  return (file, cb) => {
    let fileContents = file.contents.toString('utf8');

    const jsFile = createSource(config.buildOptions.javascript.destination, config.buildOptions.project.destination);
    const cssFile = createSource(config.buildOptions.scss.destination + 'style.css', config.buildOptions.project.destination);

    if (fs.existsSync(jsFile)) {
      fs.readFileSync(createSource(config.buildOptions.javascript.destination, config.buildOptions.project.destination), function(err, data) {
        generatedValues.jsFile = `${checksum(data)}.js`;
      });
    }

    if (fs.existsSync(cssFile)) {
      fs.readFileSync(cssFile, function(err, data) {
        generatedValues.cssFile = `${checksum(data)}.css`;
      });
    }

    fileContents = fileContents.replace(/%__JS_FILE__%/g, generatedValues.jsFile);
    fileContents = fileContents.replace(/%__CSS_FILE__%/g, generatedValues.cssFile);

    file.contents = Buffer.from(fileContents);
    return cb(null, file);
  }
}

function checkTask(done) {
  exec("php -v", (error, stdout, stderr) => {
    if (error) {
      console.log(Loggy.red`[${config.buildOptions.project.name}] Fatal error: PHP cannot be started. Make sure PHP is installed!\n${error}`);
      return false;
    }

    if (stderr) {
      console.log(Loggy.red`[${config.buildOptions.project.name}] Fatal error: PHP cannot be started.\n${error}`);
      return false;
    }

    if (stdout.indexOf('PHP') === -1) {
      console.log(Loggy.red`[${config.buildOptions.project.name}] Fatal error: PHP cannot be started.\n${stdout}`);
      return false;
    }

    done();
  });
}

function serveTask(done) {
  const source = config.buildOptions.project.wordpressRoot;
  const phpPort = parseInt(config.dev_server.port) - 1;

  if (!fs.existsSync(source)) {
    return false;
  }

  phpConnect.server({
    base: source,
    port: phpPort,
    keepalive: true
  });

  browserSync.init({
    logPrefix: config.buildOptions.project.name,
    proxy: `http://127.0.0.1:${phpPort}`,
    port: config.dev_server.port,
    snippetOptions: {
      blacklist: 'wp-admin/**',
      ignorePaths: 'wp-admin/**'
    },
    injectChanges: true,
    open: true,
    notify: false,
    online: false
  });

  done();
}

function watchTask() {
  // Images
  gulp.watch(
    concatSource(config.buildOptions.images.source), {
      cwd: config.buildOptions.project.wordpressRoot
    },
    gulp.series(imageAssetsTask, reload));

  // Other assets
  gulp.watch(
    createSource(config.buildOptions.otherAssets.source), {
      cwd: config.buildOptions.project.wordpressRoot
    },
    gulp.series(otherAssetsTask, htmlTask, reload));

  // HTML
  gulp.watch(
    concatSource([
      config.buildOptions.pages.source,
      config.buildOptions.partials.source,
      config.buildOptions.includes.source,
    ]), {
      cwd: config.buildOptions.project.wordpressRoot
    }, gulp.series(htmlTask, reload));

  // SCSS
  gulp.watch(concatSource(config.buildOptions.scss.watch), {
    cwd: config.buildOptions.project.wordpressRoot
  }, scssTask);

  // JS
  gulp.watch(
    concatSource(config.buildOptions.javascript.watch), {
      cwd: config.buildOptions.project.wordpressRoot
    },
      gulp.series(jsTask, reload));
}

/**
 * watch task
 */
gulp.task('dev',
  gulp.series(
    cleanTask,
    otherAssetsTask,
    imageAssetsTask,
    jsTask,
    scssTask,
    htmlTask,
    serveTask,
    watchTask
  )
);

/**
* watch:production task
*/
gulp.task('dev:production',
  gulp.series(
    setProductionEnvironment,
    cleanTask,
    jsTask,
    scssTask,
    otherAssetsTask,
    imageAssetsTask,
    htmlTask,

    gulp.parallel(
      serveTask,
      watchTask
    )
  )
);

/**
* watch:skipImages task
*/
gulp.task('dev:skipImages',
  gulp.series(
    cleanTask,

    gulp.parallel(
      otherAssetsTask,
      jsTask,
      scssTask,
      htmlTask
    ),

    gulp.parallel(
      serveTask,
      watchTask
    )
  )
);

/**
* watch:production:skipImages task
*/
gulp.task('dev:production:skipImages',
  gulp.series(
    setProductionEnvironment,
    cleanTask,

    gulp.parallel(
      otherAssetsTask,
      jsTask,
      htmlTask,
      scssTask
    ),

    gulp.parallel(
      serveTask,
      watchTask
    )
  )
);

/**
* build task
*/
gulp.task('build',
  gulp.series(
    setBuildEnvironment,
    setProductionEnvironment,
    cleanTask,
    otherAssetsTask,
    imageAssetsTask,
    jsTask,
    scssTask,
    htmlTask
  )
);

/**
* build:production task
*/
gulp.task('build:production',
  gulp.series(
    setBuildEnvironment,
    setProductionEnvironment,
    cleanTask,
    jsTask,
    scssTask,
    otherAssetsTask,
    imageAssetsTask,
  )
);

/**
* build:skipImages task
*/
gulp.task('build:skipImages',
  gulp.series(
    setBuildEnvironment,
    setProductionEnvironment,
    cleanTask,
    jsTask,
    scssTask,

    gulp.parallel(
      otherAssetsTask,
      htmlTask
    )
  )
);

/**
* build:production:skipImages task
*/
gulp.task('build:production:skipImages',
  gulp.series(
    setBuildEnvironment,
    setProductionEnvironment,
    cleanTask,
    jsTask,
    scssTask,

    gulp.parallel(
      otherAssetsTask,
      htmlTask
    )
  )
);
