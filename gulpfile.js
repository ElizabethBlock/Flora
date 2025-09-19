const { src, dest, watch, series, parallel } = require('gulp');

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
const ttf2woff2 = require('gulp-ttf2woff2');
const include = require('gulp-include');
const svgstore = require('gulp-svgstore');

function sprites() {
  return src('docs/images/sprite/*.svg')
    .pipe(svgstore())
    .pipe(dest('docs/images'))
}

function pages() {
  return src('docs/pages/*.html')
    .pipe(include({
      includePaths: 'docs/components'
    }))
    .pipe(dest('docs'))
    .pipe(browserSync.stream())
}

function fonts() {
  return src('docs/fonts/*.ttf')
    .pipe(ttf2woff2())
    .pipe(dest('docs/fonts'))
}


function images() {
  return src(['docs/images/src/*.*', '!docs/images/src/*.svg'])
    .pipe(newer('docs/images'))
    .pipe(avif({ quality: 50 }))

    .pipe(src('docs/images/src/*.*'))
    .pipe(newer('docs/images'))
    .pipe(webp())

    .pipe(src('docs/images/src/*.*'))
    .pipe(newer('docs/images'))
    .pipe(imagemin())

    .pipe(dest('docs/images'))
}


function styles() {
  return src('docs/scss/style.scss')
    .pipe(scss({ outputStyle: 'compressed' }))
    .pipe(autoprefixer({
      overrideBrowserslist: ['last 10 versions'],
      cascade: false
    }))
    .pipe(concat('style.min.css'))
    .pipe(dest('docs/css'))
    .pipe(browserSync.stream());
}

function scripts() {
  return src([
    'node_modules/swiper/swiper-bundle.js',
    'node_modules/nouislider/dist/nouislider.js',
    'docs/js/main.js'
  ])
    .pipe(concat('main.min.js'))
    .pipe(uglify())
    .pipe(dest('docs/js'))
    .pipe(browserSync.stream())
}

function watching() {
  browserSync.init({
    server: {
      baseDir: 'docs/'
    }
  });
  watch(['docs/scss/*.scss'], styles)
  watch(['docs/images/src'], images)
  watch(['docs/images/sprite'], sprites)
  watch(['docs/pages/*', 'docs/components/*'], pages)
  watch(['docs/js/main.js'], scripts)
  watch(['docs/*.html']).on('change', browserSync.reload)
}

function cleanDist() {
  return src('dist')
    .pipe(clean())
}

function building() {
  return src([
    'docs/*.html',
    'docs/js/main.min.js',
    'docs/css/style.min.css',
    'docs/images/*.*',
    'docs/fonts/*.woff2'
  ], { base: 'docs' })
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