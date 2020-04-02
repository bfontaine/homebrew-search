var
    autoprefixer = require("gulp-autoprefixer"),
    babelify     = require("babelify"),
    browserify   = require("browserify"),
    buffer       = require("vinyl-buffer"),
    fs           = require("fs"),
    gulp         = require("gulp"),
    log          = require("fancy-log"),
    minifycss    = require("gulp-minify-css"),
    replace      = require("gulp-replace"),
    sass         = require("gulp-sass"),
    source       = require("vinyl-source-stream"),
    uglify       = require("gulp-uglify")
    ;

gulp.task("css", function() {
  return gulp.src(["src/sass/**/*.scss"])
    .pipe(sass().on("error", sass.logError))
    .pipe(autoprefixer("last 2 versions"))
    .pipe(minifycss())
    .pipe(gulp.dest("build/"))
    ;
});

gulp.task("js", function() {
  var b = browserify({
    entries: "src/jsx/app.jsx",
    transform: [babelify.configure({
      presets: ["env", "react"],
    })]
  });

  return b.bundle()
    .pipe(source("app.js"))
    .pipe(buffer())
    .pipe(uglify())
    .on("error", log)
    .pipe(replace("[[TERMS]]", fs.readFileSync("terms.json")))
    .pipe(gulp.dest("build/"));
});

function watch() {
  gulp.watch("src/sass/*.scss", ["css"]);
}

gulp.task("watch", watch);
gulp.task("default", watch);
