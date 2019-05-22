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
  plugins: [
    'karma-*',
    {'reporter:jasmine-seed': ['type', JasmineSeedReporter]},
  ],
  reporters: [
    'progress',
    'jasmine-seed',
  ],
  restartOnFileChange: true,
});

// Helpers
function JasmineSeedReporter(baseReporterDecorator) {
  baseReporterDecorator(this);

  this.onBrowserComplete = (browser, result) => {
    const seed = result.order && result.order.random && result.order.seed;
    if (seed) this.write(`${browser}: Randomized with seed ${seed}.\n`);
  };

  this.onRunComplete = () => undefined;
}
