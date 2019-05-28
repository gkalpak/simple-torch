'use strict';

/**
 * Usage:
 * ```sh
 * node scripts/audit-web-app <url> <min-scores> [<log-file>]
 * ```
 *
 * Fails if the score in any category is below the scores specified in `<min-scores>`. `<min-scores>` is either a number
 * (in which case it is interpreted as `default:<min-score>`) or a string of comma-separated values of the form
 * `key:value`, where `key` is one of `accessibility`, `best-practices`, `performance`, `pwa`, `seo` or `default` and
 * `value` is a number (between 0 and 100). If `default` defaults to 100 (the highest score) and all other categories
 * default to the value of `default`. E.g.:
 * - `95`
 * - `default:95`
 * - `default:95,pwa:100`
 * - `performance:90`
 *
 * If `<log-file>` is defined, the full results will be logged there.
 *
 * (Skips HTTPS-related audits, when run for HTTP URL.)
 */

// Imports
const chromeLauncher = require('chrome-launcher');
const lighthouse = require('lighthouse');
const printer = require('lighthouse/lighthouse-cli/printer');
const logger = require('lighthouse-logger');

// Constants
const CHROME_LAUNCH_OPTS = {chromeFlags: ['--headless']};
const LIGHTHOUSE_FLAGS = {logLevel: 'info'};
const VIEWER_URL = 'https://googlechrome.github.io/lighthouse/viewer';
const SKIPPED_HTTPS_AUDITS = [
  'redirects-http',
  'uses-http2',
];

// Run
_main(process.argv.slice(2));

// Helpers
async function _main(args) {
  const {url, minScores, logFile} = parseInput(args);
  const isOnHttp = /^http:/.test(url);
  const config = {extends: 'lighthouse:default'};

  console.info(`Running web-app audits for '${url}'...`);

  // If testing on HTTP, skip HTTPS-specific tests.
  // (Note: Browsers special-case localhost and run ServiceWorker even on HTTP.)
  if (isOnHttp) skipHttpsAudits(config);

  logger.setLevel(LIGHTHOUSE_FLAGS.logLevel);

  try {
    const results = await launchChromeAndRunLighthouse(url, LIGHTHOUSE_FLAGS, config);
    const success = await processResults(results, logFile, minScores);

    if (!success) {
      throw new Error('One or more scores are too low.');
    }
  } catch (err) {
    onError(err);
  }
}

function formatScore(score) {
  return `${(score * 100).toFixed(0).padStart(3)}`;
}

async function launchChromeAndRunLighthouse(url, flags, config) {
  const chrome = await chromeLauncher.launch(CHROME_LAUNCH_OPTS);
  flags.port = chrome.port;

  try {
    return await lighthouse(url, flags, config);
  } finally {
    await chrome.kill();
  }
}

function onError(err) {
  console.error(err);
  process.exit(1);
}

function parseInput(args) {
  const [url, minScoresRaw, logFile] = args;
  const minScores = parseMinScores(minScoresRaw);
  const minScoresValid = Object.values(minScores).every(x => (0 <= x) && (x <= 1));

  if (!url) {
    onError('Invalid arguments: <url> not specified.');
  } else if (!minScoresValid) {
    onError('Invalid arguments: <min-scores> has non-numeric or out-of-range values.');
  }

  return {url, minScores, logFile};
}

function parseMinScores(raw) {
  const knownCategories = ['accessibility', 'best-practices', 'performance', 'pwa', 'seo'];

  if (/^\d+$/.test(raw)) {
    raw = `default:${raw}`;
  }

  const minScores = raw.
    split(',').
    map(x => x.split(':')).
    reduce((aggr, [key, val]) => (aggr[key] = Number(val) / 100, aggr), {default: 1});
  const unknownCategories = Object.
    keys(minScores).
    filter(cat => (cat !== 'default') && !knownCategories.includes(cat));

  if (unknownCategories.length > 0) {
    throw new Error(`Unknown category(-ies): ${unknownCategories.join(', ')}`);
  }

  return knownCategories.reduce((aggr, cat) =>
    (aggr[cat] = minScores.hasOwnProperty(cat) ? minScores[cat] : minScores.default, aggr), {});
}

async function processResults(results, logFile, minScores) {
  const lhVersion = results.lhr.lighthouseVersion;
  const categories = results.lhr.categories;
  const report = results.report;

  if (logFile) {
    console.log(`\nSaving results in '${logFile}'...`);
    console.log(`  LightHouse viewer: ${VIEWER_URL}`);

    await printer.write(report, printer.OutputMode.json, logFile);
  }

  console.info(`\nLighthouse version: ${lhVersion}`);
  console.info('\nAudit results:');

  const maxTitleLen = Math.max(...Object.values(categories).map(({title}) => title.length));
  const success = Object.keys(categories).sort().reduce((aggr, cat) => {
    const {title, score} = categories[cat];
    const paddedTitle = `${title}:`.padEnd(maxTitleLen + 1);
    const minScore = minScores[cat];
    const passed = !isNaN(score) && (score >= minScore);

    console.info(
      `  - ${paddedTitle}  ${formatScore(score)}  (Required: ${formatScore(minScore)})  ${passed ? 'OK' : 'FAILED'}`);

    return aggr && passed;
  }, true);

  return success;
}

function skipHttpsAudits(config) {
  console.info(`Skipping HTTPS-related audits (${SKIPPED_HTTPS_AUDITS.join(', ')})...`);
  const settings = config.settings || (config.settings = {});
  settings.skipAudits = SKIPPED_HTTPS_AUDITS;
}
