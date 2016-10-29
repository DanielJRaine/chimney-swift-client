// source: http://fuzzytolerance.info/blog/2015/07/30/my-default-gulpfilejs/
// I am working on a new template for the apps I commonly craft these days, and right now it’s looking like this.

// Material Design Lite for the UI framework. Pros: no external JS dependencies (not even jQuery), fast, pretty, don’t have to worry about IE9 because it isn’t supported. Cons: IE9 isn’t supported.
// Leaflet for the mapping. Duh.
// Underscore for JSON handling and templates. Lodash is great, but I don’t use the extra features, it’s 7x the size, and I am too lazy to make a custom build to shrink it.
// Browserify for modular development and dependency management.
// Favor npm over bower for dependencies when possible. Makes Browserify and testing easier.
// A unit test framework. I haven’t put a finger on that yet. Maybe tape.
// The first step is automating things with Gulp. I usually write my gulpfile.js as a project goes along and by the time I’m done it’s a steaming mess. Here is my new default template.

// This should cover 90% of my needs for most projects. Tossing in Babel or React is a matter of adding Browserify transforms, and if Browserify gets slow adding Watchify into the mix isn’t hard. Live reload, CSS, JavaScript, and images are all handled. Source maps are created for CSS and JavaScript, and running gulp build --type production minifies the CSS and uglifies the JavaScript.

// My plan is to build out the template, dogfood it with a new GeoPortal release, and then put all of it on Github. Stay tuned.

// Tobin Bradley

// postcss and cssnext have both been merged on npm, so I tried npm installing postcss-cssnext and replacing all instances of either with postcssCssnext.
// Will be monitoring to see if anything breaks.

var postcssCssnext = require("postcss-cssnext"),
    gulp = require("gulp"),
    sourcemaps = require("gulp-sourcemaps"),
    gutil = require('gulp-util'),
    imagemin = require('gulp-imagemin'),
    browserSync = require('browser-sync'),
    replace = require('gulp-replace'),
    browserify = require('browserify'),
    rename = require('gulp-rename'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    uglify = require('gulp-uglify');

// main controller tasks
// add "--type production" to compress CSs and uglify JS
gulp.task('default', ['watch', 'browser-sync']);
gulp.task('build', ['css', 'js', 'replace', 'imagemin']);

// Live reload server
gulp.task('browser-sync', function() {
    browserSync(['./public/**/*'], {
        server: {
            baseDir: "./public"
        }
    });
});

// watch tasks
gulp.task('watch', function () {
    gulp.watch(['./app/*.html'], ['replace']);
    gulp.watch(['./app/css/**/*.css'], ['css']);
    gulp.watch('./app/js/**/*.js', ['js']);
    gulp.watch('./app/img/**/*', ['imagemin']);
});

// process HTML with cache busting
gulp.task('replace', function() {
    return gulp.src('app/*.html')
        .pipe(replace("&#123;&#123;cachebuster&#125;&#125;", Math.floor((Math.random() * 100000) + 1)))
        .pipe(gulp.dest('public/'));
});

// JavaScript
gulp.task('js', function () {
  var b = browserify({
    entries: ['./app/js/app.js'],
    debug: true
  });
  return b.bundle()
    .pipe(source('./app/js/app.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(gutil.env.type === 'production' ? uglify() : gutil.noop())
    .pipe(rename({ dirname: '' }))
    .on('error', gutil.log)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./public/js/'));
});

// CSS
gulp.task("css", function() {
    var processors = [
        postcssCssnext({
            'browers': ['last 2 version'],
            'customProperties': true,
            'colorFunction': true,
            'customSelectors': true,
            'compress': gutil.env.type === 'production' ? true : false
        })
    ];
    return gulp.src('./app/css/main.css')
        .pipe(sourcemaps.init())
        .pipe(postcssCssnext(processors))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./public/css'));
});

// image minification
gulp.task('imagemin', function() {
    return gulp.src('app/img/*')
        .pipe(imagemin({
            optimizationLevel: 5,
            svgoPlugins: [{removeViewBox: false}]
        }))
        .pipe(gulp.dest('public/img'));
});