var DESIGN_MODE=true;                                           // Enables browsersync's auto-refresh while in localhost

var PATHS = {                                                   // Paths to distro folders and locations
    'serverProxy': 'http://localhost:8080',
    'js' : {
        'source': '_js/**/*.js',
        'dest': 'public/lib/js/'
    },
    'css' : {
        'source': '_scss/**/*.scss',
        'dest': 'public/lib/css/'
    },
    'html' : {
        'source': './public/*.html',
        'dest': 'public/'
    },
    'node' : {
        'source': './_js/**/*.js',
        'dest':   './_js/bundle.js',
        'format': 'umd'
    }
};



const   gulp           = require('gulp'),
        // sourcemaps     = require('gulp-sourcemaps'),                                 // Automatically converts ES6 code into CommonJS
        shell          = require('gulp-shell');                                      // Permits gulp to run shell commands
        rollup         = require('gulp-better-rollup'),                              // Allows for tress-shaking and import/export
        resolve        = require('rollup-plugin-node-resolve'),                      // 
        commonjs       = require('rollup-plugin-commonjs'),
        babel          = require('rollup-plugin-babel'),
        sass           = require('gulp-sass')(require('sass'));
        autoprefixer   = require('gulp-autoprefixer'),                               // Applies prefixes for common and popular platforns and browsers (-ms-, -webkit-)
        postcss        = require('gulp-postcss'),                                    // Provides CSS POST-processing
        rucksack       = require('rucksack-css'),                                    // CSS Post-processor rules (responsiveness, hex conversions, certain polyfills)
        sync           = require('browser-sync').create();                           // TODO : Detect and terminate any instances already running?

gulp.task('server', function() {
    if(DESIGN_MODE){
        sync.init({
            server: PATHS.html.dest,
        });
        sync.notify('<b>Server initialized.</b><br>Serving files from <ul><li>HTML: ' + PATHS.html.dest + '</li><li>JS: ' + PATHS.js.dest + '</li><li>CSS: ' + PATHS.css.dest + '</li></ul>Watching for changes...', 5000);

        // Big Brother is watching you...
        sync.watch(PATHS.html.source).on('change', sync.reload);    // BrowserSync is comin' to town!
        sync.watch(PATHS.js.source).on('change', build_js);               // He sees your code a-changin'
        sync.watch(PATHS.js.dest).on('change', sync.reload);        // He knows when changes pass!
        sync.watch(PATHS.css.source).on('change', build_css);             // He can't recover from errors, 
        sync.watch(PATHS.css.dest).on('change', sync.reload);       // So be sure of your syntax!
    }else{
        sync.init({
            // proxy: PATHS.serverProxy,
            proxy: "yourlocal.dev"
        });
    }
});



function build_css(){
    var sassSettings = {
            outputStyle: 'expanded',
            errLogToConsole: true
        };
    var autoprefixerSettings = {
        "overrideBrowserslist": [
            "last 1 version",
            "> 1%",
            "IE 10"
          ]
        };
    var rucksackSettings = {
            responsiveType:    true,    // Def: true
            shorthandPosition: true,    // Def: true
            quantityQueries:   true,    // Def: true
            alias:             true,    // Def: true
            inputPseudo:       true,    // Def: true
            clearFix:          true,    // Def: true
            fontPath:          true,    // Def: true
            hexRGBA:           true,    // Def: true
            easings:           true,    // Def: true
            fallbacks:         false,   // Def: false
            autoprefixer:      false    // Def: false
        };


    return gulp.src(PATHS.css.source)
    .pipe(sass(sassSettings).on('error', sass.logError))
    .pipe(postcss([ rucksack(rucksackSettings) ]))
    .pipe(autoprefixer(autoprefixerSettings))
    .pipe(sync.stream())
    .pipe(gulp.dest(PATHS.css.dest))
    .on('change', sync.reload);
}

function build_js() {
    return gulp.src(PATHS.js.source)
        // .pipe(sourcemaps.init())                            // note that UMD and IIFE format requires `name` but it will be inferred from the source file name `mylibrary.js`
        .pipe(rollup({plugins: [babel(),resolve(),commonjs()]}, 'umd'))          // save sourcemap as separate file (in the same folder)
        // .pipe(sourcemaps.write(''))
        .pipe(gulp.dest(PATHS.js.dest))
        .on('error', onError)
        .on('change', sync.reload);
}


gulp.task('css', function() {
    return build_css();
});


gulp.task('js', function() {
    return build_js();
});

function onError(err) {
    console.log(err);
    this.emit('end');
  }
  

gulp.task('spew', shell.task('clear && lsof -t -i ":8080" -i ":8081" -i ":3000" -i ":3001" -i ":5000" -i ":5001" -i ":1337" | xargs kill'));                                        // Terminates any servers currently running on 8080, 8081, 3000, 3001, 5000, 5001
gulp.task('purge', shell.task("clear && ps -a -o pid,command | grep -E 'localhost\:3000|node|gulp' | grep -v grep | sed 's/ .*//' | xargs kill && gulp spew"));                     // Terminates any servers currently running on 8080, 8081, 3000, 3001, 5000, 5001
gulp.task('cores',   shell.task('node cors.js'));                                                                                                                                   // Launches the CORS bypass proxy
// gulp.task('default', gulp.series(gulp.parallel('cores', 'css', 'js', 'server')));                                                                                           // Fondue...?
// gulp.task('default', gulp.series(gulp.parallel('css', 'js'), gulp.parallel('cores', 'server')));                                                                                           // Fondue...?
gulp.task('default', gulp.series('spew', gulp.parallel('css', 'js'), gulp.parallel('cores', 'server')));                                                                                           // Fondue...?
