import {strict} from 'node:assert';
import {afterEach, beforeEach, describe, it} from 'node:test';

import {Browser, HTTPResponse, launch, Page} from 'puppeteer';

import {default as pkg} from '../../../package.json' with {type: 'json'};
import {IEnv} from '../../app/js/shared/constants.js';


describe('Simple Torch app', () => {
  const appOrigin = 'http://localhost:4002';
  let browser: Browser;
  let page: Page;
  let pageLogs: string[];
  let pageErrors: string[];

  beforeEach(async () => {
    browser = await launch();
    page = await browser.newPage();

    pageLogs = [];
    pageErrors = [];

    page.
      on('console', msg => pageLogs.push(`[${msg.type().toUpperCase()}] ${msg.text()}`)).
      on('pageerror', err => pageErrors.push(err.message)).
      on('requestfailed', req => pageErrors.push(`${req.failure()?.errorText ?? 'UNKNOWN FAILURE'} - ${req.url()}`));

    await page.goto(`${appOrigin}/`, {waitUntil: 'networkidle0'});
  });

  afterEach(async () => {
    await page.close();
    await browser.close();

    strict.deepEqual(pageErrors, [], 'Unexpected errors in the console.');
  });

  it('should have the correct `window.ENV`', async () => {
    const {sha, ...restEnv} = await page.evaluate('window.ENV') as IEnv;

    strict.match(sha, /^[a-f0-9]{40}$/, 'Unexpected SHA.');
    strict.deepEqual(restEnv, {
      production: true,
      repoUrl: 'https://github.com/gkalpak/simple-torch',
      version: pkg.version,
    }, 'Unexpected `ENV` properties or values.');
  });

  it('should have an active SeriviceWorker', async () => {
    await page.evaluate('navigator.serviceWorker.ready');
    const swUrl = await page.evaluate('navigator.serviceWorker.controller?.scriptURL');

    strict.equal(swUrl, `${appOrigin}/sw.js`, 'Unexpected ServiceWorker URL.');
  });

  it('should not produce unexpected logs', async () => {
    await page.evaluate('navigator.serviceWorker.ready');

    strict.deepEqual(pageLogs, [
      '[INFO] [ServiceWorker] Registering...',
      '[INFO] [ServiceWorker] Registered successfully.',
    ], 'Unexpected logs in the console.');
  });

  it('should have the whole page controlled by the ServiceWorker', async () => {
    const scope = await page.evaluate('navigator.serviceWorker.ready.then(reg => reg.scope)');

    strict.equal(scope, `${appOrigin}/`, 'Unexpected ServiceWorker scope.');
  });

  it('should have all requests handled by the ServiceWorker', async () => {
    await page.evaluate('navigator.serviceWorker.ready');

    const responses: HTTPResponse[] = [];
    page.on('response', res => responses.push(res));

    await page.reload({waitUntil: 'networkidle0'});

    strict.ok(responses.length > 0, 'No responses captured.');
    strict.deepEqual(responses.filter(x => !x.fromCache()), [], 'Some requests not served from the cache.');
    strict.deepEqual(
        responses.filter(x => !x.fromServiceWorker()), [], 'Some requests not handled by the ServiceWorker.');
  });
});
