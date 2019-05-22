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
  middleware: ['exitOn404'],
  plugins: [
    'karma-*',
    {'middleware:exitOn404': ['factory', exitOn404MiddlewareFactory]},
    {'reporter:jasmine-seed': ['type', JasmineSeedReporter]},
  ],
  reporters: [
    'progress',
    'jasmine-seed',
  ],
  restartOnFileChange: true,
});

// Helpers
function exitOn404MiddlewareFactory(server) {
  return function exitOn404Middleware(req, res, next) {
    next();

    // Ugly hack to ensure 404 errors don't cause silent failures.
    // (E.g. if the import path is wrong in a spec file, the whole spec suite would be silently skipped.)
    if (res.statusCode === 404) {
      const importee = req.url.replace(/^\/base\//, '');
      const importer = (req.headers.referer || '').
        replace(new RegExp(`^${req.headers.origin || ''}/base/([^?#]*).*$`), '$1');

      server.dieOnError(`Missing file '${importee}' (imported from '${importer}').`);
    }
  };
}

function JasmineSeedReporter(baseReporterDecorator) {
  baseReporterDecorator(this);

  this.onBrowserComplete = (browser, result) => {
    const seed = result.order && result.order.random && result.order.seed;
    if (seed) this.write(`${browser}: Randomized with seed ${seed}.\n`);
  };

  this.onRunComplete = () => undefined;
}
