
/**
 * Remove empty lines added by include plugin
 */
/**
 * add new compiler
 */
/*
 * SETTINGS
 */
/**
* Join view components
* @param {String} options.targetFile - name of the target file
 */
var Coffeescript, CsOptions, Ejs, Fs, GulpCoffeescript, GulpErrHandler, Path, Rename, RmEmptyLines, Through2, _addTask, _addTaskPara, _addTaskWatchers, createElement, gulp, include, isProd, joinViewComponents, joinViewComponentsDefaultOptions, settings, uglify, watch;

gulp = require('gulp');

// gutil			= require 'gulp-util'
// minify		= require 'gulp-minify'
include = require("gulp-include");

uglify = require('gulp-terser');

Rename = require("gulp-rename");

GulpCoffeescript = require('gulp-coffeescript');

Coffeescript = require('coffeescript');

Ejs = require("gulp-ejs");

GulpErrHandler = require('gulp-error-handle');

// Babel			= require 'gulp-babel'
Through2 = require('through2');

// Vinyl			= require 'vinyl'
Path = require('path');

Fs = require('fs');

isProd = true;

settings = {
  /**
   * App params
   */
  isProd: true,
  // Info
  appName: 'GridFw',
  author: 'Coredigix.com',
  authorEmail: 'hello@coredigix.com',
  copyright: (new Date()).getFullYear(),
  
  // Content
  DEFAULT_ENCODING: 'utf8'
};

// coffeescript filter options
CsOptions = {
  bare: false,
  header: false,
  sourceMap: false,
  sourceRoot: false
};

// components join
/*
 * get HTML element (will be serialized and saved as Components._)
 */
createElement = function() {
  var dv;
  dv = document.createElement('div');
  return function(fxName, args, repeat) {
    var frag, fx, html, nodes;
    fx = this[fxName];
    if (!fx) {
      throw `Unknown component: ${fxName}`;
    }
    html = Array.isArray(args) ? args.map(fx).join('') : fx(args);
    if (repeat) {
      html = html.repeat(repeat);
    }
    dv.innerHTML = html;
    nodes = dv.childNodes;
    frag = document.createDocumentFragment();
    while (nodes.length) {
      frag.appendChild(nodes[0]);
    }
    return frag;
  };
};

joinViewComponentsDefaultOptions = {
  targetFile: 'components.js',
  template: 'window.Template' // default var name
};

joinViewComponents = function(options) {
  var collect, concatAll, cwd, data, targetFile, templateFx;
  data = Object.create(null);
  cwd = null;
  // options
  if (options == null) {
    options = Object.create(null);
  }
  targetFile = options.targetFile || joinViewComponentsDefaultOptions.targetFile;
  templateFx = options.template || joinViewComponentsDefaultOptions.template;
  // collect data
  collect = function(file, enc, cb) {
    var content, e, err, fileName;
    if (!file.isBuffer()) {
      return cb(null);
    }
    // process
    err = null;
    try {
      fileName = file.basename;
      // normalise fileName
      fileName = fileName.toLowerCase().replace(/^[\s_-]+|[\s_-]+$/g, '').replace(/[_-\s]+(\w)/g, function(_, w) {
        return w.toUpperCase();
      });
      if (!fileName.endsWith('.js')) {
        throw new Error(`Expected JS file: ${file.path}\n-------\n${file.contents.toString('utf8')}`);
      }
      content = file.contents.toString('utf8');
      // data[fileName.slice(0, -3)] = "(function(){#{content.replace(/module.exports\s*=/, 'return ')}})()"
      data[fileName.slice(0, -3)] = content.replace(/^function\s+template/, 'function').replace(/module.exports=\s*template$/, '');
      // base dir
      cwd = file._cwd;
    } catch (error) {
      e = error;
      err = e;
    }
    cb(err);
  };
  
  // send to pipe
  concatAll = function(cb) {
    var e, err, jn, k, v;
    err = null;
    try {
      // join data
      jn = [];
      for (k in data) {
        v = data[k];
        jn.push(`${k}:${v}`);
      }
      // add creator
      jn.push(`_:(${createElement.toString()})()`);
      // push as file
      this.push(new Vinyl({
        cwd: cwd,
        path: targetFile,
        contents: Buffer.from(`${templateFx}={${jn.join(',')}};`)
      }));
    } catch (error) {
      e = error;
      err = e;
    }
    return cb(err);
  };
  
  // return
  return Through2.obj(collect, concatAll);
};

RmEmptyLines = function() {
  return Through2.obj(function(file, enc, cb) {
    var e, err;
    if (!file.isBuffer()) {
      return cb(null);
    }
    err = null;
    try {
      file.contents = Buffer.from(file.contents.toString('utf8').replace(/^[\n\r]+$/gm, ''));
    } catch (error) {
      e = error;
      err = e;
    }
    return cb(err, file);
  });
};

_addTaskWatchers = [];

_addTaskPara = [];

_addTask = function(watchPath, cb) {
  _addTaskPara.push(cb);
  _addTaskWatchers.push(watchPath, cb);
};

/**

 * Compile server files

 */
_addTask('assets/**/*.coffee', function() {
  return gulp.src(['assets/**/[!_]*.coffee'], {
    nodir: true
  }).pipe(GulpErrHandler()).pipe(include({
    hardFail: true
  // .pipe gulp.dest 'tmp/app/'
  })).pipe(RmEmptyLines()).pipe(Ejs(settings)).pipe(GulpCoffeescript({
    bare: true
  // if is prod
  })).pipe(uglify({
    module: true,
    compress: {
      toplevel: true,
      module: true,
      keep_infinity: true,
      warnings: true
    }
  })).pipe(gulp.dest('build/'));
});

// ###*

//  * Copy static libs

// ###

// _addTask 'assets/lib/**/*', ->

// 	gulp.src 'assets/lib/**/*', nodir: true

// 		.pipe GulpErrHandler()

// 		.pipe gulp.dest 'build/lib/'
/** COMPILE TEST FILES */
_addTask('tests/**/*.coffee', function() {
  return gulp.src(['tests/**/[!_]*.coffee'], {
    nodir: true
  }).pipe(GulpErrHandler()).pipe(include({
    hardFail: true
  // .pipe gulp.dest 'tmp/app/'
  })).pipe(RmEmptyLines()).pipe(Ejs(settings)).pipe(GulpCoffeescript({
    bare: true
  })).pipe(gulp.dest('build/tests/'));
});

// watch files
watch = function(cb) {
  var i, len;
  if (!isProd) {
    i = 0;
    len = _addTaskWatchers.length;
    while (i < len) {
      gulp.watch(_addTaskWatchers[i++], _addTaskWatchers[i++]);
    }
  }
  cb();
};

// default task
gulp.task('default', gulp.series(gulp.parallel.apply(gulp, _addTaskPara), watch));
