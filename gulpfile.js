const { src, dest, watch, series, parallel } = require('gulp');

// Ensure gulp-webp uses system cwebp with JPEG support (Homebrew installs)
const fs = require('fs');
if (!process.env.CWEBP_BIN || !process.env.CWEBP_BINARY) {
  const candidates = [
    '/opt/homebrew/bin/cwebp',
    '/usr/local/bin/cwebp'
  ];
  const found = candidates.find(p => {
    try { return fs.existsSync(p); } catch { return false; }
  });
  if (found) {
    process.env.CWEBP_BIN = found;
    process.env.CWEBP_BINARY = found;
  }
}

const scss = require('gulp-sass')(require('sass'));
const browserSync = require('browser-sync').create();
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const autoprefixer = require('gulp-autoprefixer');
const clean = require('gulp-clean');
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const avif = require('gulp-avif');
const newer = require('gulp-newer');
const plumber = require('gulp-plumber');
const ttf2woff2 = require('gulp-ttf2woff2');
const include = require('gulp-include');
const svgstore = require('gulp-svgstore');

function sprites() {
  return src('app/images/sprite/*.svg')
    .pipe(svgstore())
    .pipe(dest('app/images'))
}

function pages() {
  return src('app/pages/*.html')
    .pipe(include({
      includePaths: 'app/components'
    }))
    .pipe(dest('app'))
    .pipe(browserSync.stream())
}

function fonts() {
  return src('app/fonts/*.ttf')
    .pipe(ttf2woff2())
    .pipe(dest('app/fonts'))
}


function images() {
  return src(['app/images/src/*.*', '!app/images/src/*.svg'])
    .pipe(plumber())
    .pipe(newer('app/images'))
    .pipe(avif({ quality: 50 }))

    .pipe(src('app/images/src/*.*'))
    .pipe(newer('app/images'))
    // Temporarily disable webp conversion to avoid cwebp JPEG support issue
    // .pipe(webp())

    .pipe(src('app/images/src/*.*'))
    .pipe(newer('app/images'))
    .pipe(imagemin())

    .pipe(dest('app/images'))
}


function styles() {
  return src('app/scss/style.scss')
    .pipe(scss({ outputStyle: 'compressed' }))
    .pipe(autoprefixer({
      overrideBrowserslist: ['last 10 versions'],
      cascade: false
    }))
    .pipe(concat('style.min.css'))
    .pipe(dest('app/css'))
    .pipe(browserSync.stream());
}

function scripts() {
  return src([
    'node_modules/swiper/swiper-bundle.js',
    'node_modules/nouislider/dist/nouislider.js',
    'app/js/main.js'
  ])
    .pipe(concat('main.min.js'))
    .pipe(uglify())
    .pipe(dest('app/js'))
    .pipe(browserSync.stream())
}

function watching() {
  browserSync.init({
    server: {
      baseDir: 'app/'
    }
  });
  watch(['app/scss/*.scss'], styles)
  watch(['app/images/src'], images)
  watch(['app/images/sprite'], sprites)
  watch(['app/pages/*', 'app/components/*'], pages)
  watch(['app/js/main.js'], scripts)
  watch(['app/*.html']).on('change', browserSync.reload)
}

function cleanDist() {
  return src('dist')
    .pipe(clean())
}

function building() {
  return src([
    'app/*.html',
    'app/js/main.min.js',
    'app/css/style.min.css',
    'app/images/*.*',
    'app/fonts/*.woff2'
  ], { base: 'app' })
    .pipe(dest('dist'))
}


exports.styles = styles;
exports.watching = watching;
exports.scripts = scripts;
exports.images = images;
exports.fonts = fonts;
exports.sprites = sprites;
exports.pages = pages;
exports.cleanDist = cleanDist;
exports.building = building;

exports.build = series(cleanDist, building);
exports.default = parallel(styles, images, sprites, scripts, pages, watching);