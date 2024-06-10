/**
 * Usage:
 * ```sh
 * node scripts/run-lighthouse.mjs <url> <min-scores> [<log-file>]
 * ```
 *
 * Runs audits against the specified URL on specific categories (accessibility, best practices, performance, SEO). It
 * fails, if the score in any category is below the score specified in `<min-scores>`. (Only runs audits for the
 * specified categories.)
 *
 * `<min-scores>` is either a number (in which case it is interpreted as `all:<min-score>`) or a list of comma-separated
 * strings of the form `key:value`, where `key` is one of `accessibility`, `best-practices`, `performance`, `seo` or
 * `all` and `value` is a number (between 0 and 100).
 *
 * Examples:
 * - `95` _(Same as `all:95`.)_
 * - `all:95` _(Run audits for all categories and require a score of 95 or higher.)_
 * - `all:95,seo:100` _(Same as `all:95`, except that a score of 100 is required for the `seo` category.)_
 * - `performance:90` _(Only run audits for the `performance` category and require a score of 90 or higher.)_
 *
 * If `<log-file>` is defined, the full results will be logged there.
 *
 * (Skips some audits that are not applicable or are known to fail.)
 */

// Imports
import {argv, env, exit} from 'node:process';

import {launch as launchChrome} from 'chrome-launcher';
import lighthouse from 'lighthouse';
import {OutputMode as LhReportOutputMode, write as writeLhReport} from 'lighthouse/cli/printer.js';
import logger from 'lighthouse-logger';
import puppeteer from 'puppeteer';


// Constants
/** @type {import('chrome-launcher').Options} */
const CHROME_LAUNCH_OPTS = {
  chromeFlags: ['--headless', '--use-fake-ui-for-media-stream'],
  chromePath: puppeteer.executablePath(),
};
/** @type {import('lighthouse').Flags} */
const LIGHTHOUSE_FLAGS = {logLevel: env.CI ? 'error' : 'info'};
const VIEWER_URL = 'https://googlechrome.github.io/lighthouse/viewer';
const AUDIT_CATEGORIES = [
  'accessibility',
  'best-practices',
  'performance',
  'seo',
];
const SKIPPED_AUDITS = [
  'errors-in-console',  // An error is expected, due to torch not being found/accessible.
];

// Run
_main(argv.slice(2));

// Helpers
async function _main(args) {
  const {url, minScores, logFile} = parseInput(args);
  /** @type {import('lighthouse').Flags} */
  const lhFlags = {...LIGHTHOUSE_FLAGS};
  /** @type {import('lighthouse').Config} */
  const lhConfig = {
    extends: 'lighthouse:default',
    settings: {
      onlyCategories: Object.keys(minScores),
    },
  };

  console.info(`Running web-app audits for '${url}'...`);
  console.info(`  Audit categories: ${lhConfig.settings?.onlyCategories?.join(', ')}`);

  // Skip some audits that are not applicable or are known to fail.
  skipAudits(lhConfig, SKIPPED_AUDITS);

  logger.setLevel(lhFlags.logLevel ?? 'info');

  try {
    const startTime = Date.now();
    const results = await launchChromeAndRunLighthouse(url, lhFlags, lhConfig);
    const success = await processResults(results, logFile, minScores);
    console.info(`\n(Completed in ${((Date.now() - startTime) / 1000).toFixed(1)}s.)`);

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
  const chrome = await launchChrome(CHROME_LAUNCH_OPTS);
  flags.port = chrome.port;

  try {
    return await lighthouse(url, flags, config);
  } finally {
    await chrome.kill();
  }
}

function onError(err) {
  console.error(err);
  console.error('\n');
  exit(1);
}

function parseInput(args) {
  const [url, minScoresRaw, logFile] = args;

  if (!url) {
    onError('Invalid arguments: <url> not specified.');
  } else if (!minScoresRaw) {
    onError('Invalid arguments: <min-scores> not specified.');
  }

  const minScores = parseMinScores(minScoresRaw || '');
  const unknownCategories = Object.keys(minScores).filter(cat => !AUDIT_CATEGORIES.includes(cat));
  const allValuesValid = Object.values(minScores).every(x => (0 <= x) && (x <= 1));

  if (unknownCategories.length > 0) {
    onError(`Invalid arguments: <min-scores> contains unknown category(-ies): ${unknownCategories.join(', ')}`);
  } else if (!allValuesValid) {
    onError(`Invalid arguments: <min-scores> has non-numeric or out-of-range values: ${minScoresRaw}`);
  }

  return {logFile, minScores, url};
}

function parseMinScores(raw) {
  if (/^\d+$/.test(raw)) {
    raw = `all:${raw}`;
  }

  const minScores = raw.
    split(',').
    map(x => x.split(':')).
    reduce((aggr, [key, val]) => (aggr[key] = Number(val) / 100, aggr), {});

  if (Object.hasOwn(minScores, 'all')) {
    AUDIT_CATEGORIES.forEach(cat => Object.hasOwn(minScores, cat) || (minScores[cat] = minScores.all));
    delete minScores.all;
  }

  return minScores;
}

async function processResults(results, logFile, minScores) {
  const lhVersion = results.lhr.lighthouseVersion;
  const categories = results.lhr.categories;
  const report = results.report;

  if (logFile) {
    console.log(`\nSaving results in '${logFile}'...`);
    console.log(`  LightHouse viewer: ${VIEWER_URL}`);

    await writeLhReport(report, LhReportOutputMode.json, logFile);
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

function skipAudits(config, skippedAudits) {
  if (skippedAudits.length === 0) {
    return;
  }

  console.info(`  Skipping audits: ${skippedAudits.join(', ')}`);
  const settings = config.settings || (config.settings = {});
  settings.skipAudits = skippedAudits;
}
