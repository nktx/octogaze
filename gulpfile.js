'use strict';

// Plugins
var gulp = require('gulp'),
		del = require('del'),
		watch = require('gulp-watch');

var rename = require('gulp-rename');
var sass = require('gulp-sass');

// Styles
gulp.task('styles', function() {
	return gulp.src(['app/styles/**/*.scss'])
		.pipe(sass().on('error', sass.logError))
		.pipe(rename({suffix: '.min'}))
		.pipe(gulp.dest('public/css/'));
}); 

// Scripts
gulp.task('scripts', function() {
	return gulp.src(['app/scripts/**/*.js'])
		.pipe(gulp.dest('public/js/'));
});

// Copy static assets
gulp.task('assets', function() {
	return gulp.src(['app/assets/**'])
		.pipe(gulp.dest('public/assets/'));
});

// Clean task
gulp.task('clean', function() {
	return del(['public/css', 'public/js', 'public/assets']);
});

// Default task
gulp.task('default', ['clean'], function() {  
	gulp.start('styles', 'scripts', 'assets');
});

// Watch task
gulp.task('watch', function() {
  gulp.watch('app/styles/**/*.scss', ['styles']);
  gulp.watch('app/scripts/**/*.js', ['scripts']);
});