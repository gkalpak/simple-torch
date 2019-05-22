// Karma configuration file.
// More info: https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = config => config.set({
  basePath: 'out/',
  browsers: ['ChromeHeadless'],
  files: [
    {pattern: '**/*.js.map', included: false, watched: false},
    {pattern: 'assets/**', included: false},
    {pattern: 'app/**/*.js', included: false},
    {pattern: 'test/unit/**/*.js', type: 'module'},
  ],
  frameworks: ['jasmine'],
  reporters: ['progress'],
  restartOnFileChange: true,
});
