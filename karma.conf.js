// Karma configuration file.
// More info: https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = config => config.set({
  browsers: ['ChromeHeadless'],
  client: {
    jasmine: {
      random: true,
      seed: '',
    },
  },
  files: [
    {pattern: 'out/**/*.js.map', included: false, watched: false},
    {pattern: 'out/assets/**', included: false},
    {pattern: 'out/app/**/*.js', included: false},
    {pattern: 'out/test/unit/test-utils.js', included: false},
    {pattern: 'out/test/unit/patch-env.js'},
    {pattern: 'out/test/unit/**/*.js', type: 'module'},
  ],
  frameworks: ['jasmine'],
  middleware: [
    'dummy-request',
    'exit-on-404',
  ],
  plugins: [
    'karma-*',
    {'middleware:dummy-request': ['factory', dummyRequestMiddlewareFactory]},
    {'middleware:exit-on-404': ['factory', exitOn404MiddlewareFactory]},
    {'reporter:jasmine-seed': ['type', JasmineSeedReporter]},
  ],
  preprocessors: {'out/**/*.js': ['sourcemap']},
  proxies: {'/assets/': '/base/out/assets/'},
  reporters: [
    'progress',
    'jasmine-seed',
  ],
  restartOnFileChange: true,
});

// Helpers
function dummyRequestMiddlewareFactory() {
  return function dummyRequestMiddleware(req, res, next) {
    const match = /^(?:\/base)?(\/dummy\/.+)$/.exec(req.url);

    if (!match) {
      next();
    } else {
      const body = `Dummy content. (URL: ${match[1]})`;
      res.writeHead(200, {
        'Content-Length': body.length,
        'Content-Type': 'text/plain',
      });
      res.end(body);
    }
  };
}

function exitOn404MiddlewareFactory(server) {
  return function exitOn404Middleware(req, res, next) {
    next();

    // Ugly hack mainly to ensure 404 errors don't cause silent failures.
    // (E.g. if the import path is wrong in a spec file, the whole spec suite would be silently skipped.)
    if (res.statusCode === 404) {
      const requestee = req.url.replace(/^(?:\/base)?\//, '');
      const requester = (req.headers.referer || '').
        replace(new RegExp(`^${req.headers.origin || ''}/base/([^?#]*).*$`), '$1');

      server.dieOnError(
        `Missing resource '${requestee}' (requested from '${requester}').\n` +
        `If you want to make a dummy request, start the URL with '/dummy/' (e.g. '/dummy/${requestee}').`);
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
