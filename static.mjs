#!/usr/bin/env node

import { cp, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const siteDir = path.dirname(fileURLToPath(import.meta.url));
const templateDir = path.join(siteDir, 'templates');
const outputDir = path.join(siteDir, 'rendered');
const templatePath = path.join(templateDir, 'site.template.html');

const staticFiles = [
  'manifest.json',
  'sw.js'
];

const staticTemplateFiles = [
  'awmpc_privacy.html',
  'awmpc_refunds.html',
  'awmpc_tocau.html',
  'bible.html',
  'donation_thank_you.html'
];

const staticDirectories = ['resources'];

const pages = [
  ['mi_home', 'index.html', 'Homepage', 'wmpc_s_home.html'],
  ['mi_mission', 'mission.html', 'Mission', 'wmpc_s_mission_cn.html'],
  ['mi_sermons', 'sermons.html', 'Sermons', 'wmpc_s_sermons.html'],
  ['mi_testimony', 'testimony.html', 'Testimony', 'wmpc_s_testimonies.html'],
  ['mi_request', 'request.html', 'Prayers', 'wmpc_s_prayerrequest.html'],
  ['mi_reply', 'prayerreply.html', 'Prayer Reply', 'wmpc_s_prayerreply.html'],
  ['mi_24hrhop', '24hrhop.html', 'Church', 'wmpc_s_24hrhop.html'],
  ['mi_support', 'support.html', 'Donations', 'wmpc_s_ministrysupport.html'],
  ['mi_media', 'media.html', 'Media', 'wmpc_s_media.html'],
  ['mi_letters', 'letters.html', 'Letters', 'wmpc_s_letters.html'],
  ['mi_canaan_record', 'canaan_record.html', 'Canaan', 'canaan_chapel_record.html'],
  ['mi_prayer', 'prayer.html', 'Prayer', 'wmpc_s_focus_prayer_week_04_09v2.html'],
  ['hymns', 'hymns.html', 'Hymns', 'wmpc_s_hymns.html']
];

const hymnManifestPath = 'documents/hymns/index.json';
const imageExtensionPattern = '(?:png|jpe?g|gif|webp|svg|avif|bmp|ico|tiff?)';
const dataExtensionPattern = '(?:pdf|mp4|mpe?g|wmv|webm|ogg|mov|m4v|m3u8|mp3|wav|json|css|txt)';

function fail(message) {
  throw new Error(message);
}

function getBaseUrl(environmentName, value) {
  value = (value || '').trim();
  if (!value) {
    return '';
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    fail(`${environmentName} must be a valid HTTPS URL.`);
  }

  if (parsed.protocol !== 'https:' || !parsed.hostname || parsed.search || parsed.hash) {
    fail(`${environmentName} must be an HTTPS origin without a query string or fragment.`);
  }

  return value.replace(/\/+$/, '');
}

function rewriteAssetValue(value, assetBaseUrl) {
  const splitAt = value.search(/[?#]/);
  const assetPath = splitAt === -1 ? value : value.slice(0, splitAt);
  const pathSuffix = splitAt === -1 ? '' : value.slice(splitAt);
  let normalizedPath = assetPath
    .replace(/^(?:https?:)?\/\/(?:www\.)?awmpc\.org\//i, '')
    .replace(/^\.\//, '')
    .replace(/^\/+/, '');
  normalizedPath = normalizedPath.replace(/^(?:resources\/)?(?:images|documents)\//i, '');
  return `${assetBaseUrl}/${normalizedPath}${pathSuffix}`;
}

function rewriteAssetReferences(html, { imageBaseUrl, dataBaseUrl }) {
  const rewrite = (source, assetBaseUrl, attributes, extensionPattern) => {
    if (!assetBaseUrl) {
      return source;
    }

    const pattern = new RegExp(
      `(\\b(?:${attributes})\\s*=\\s*["'])` +
      `([^"']+\\.${extensionPattern}(?:[?#][^"']*)?)` +
      `(["'])`,
      'gi'
    );

    return source.replace(pattern, (match, prefix, value, suffix) => {
      if (
        /^(?:https?:|\/\/|data:|blob:|#|mailto:|javascript:)/i.test(value) &&
        !/^(?:https?:)?\/\/(?:www\.)?awmpc\.org\//i.test(value)
      ) {
        return match;
      }

      return `${prefix}${rewriteAssetValue(value, assetBaseUrl)}${suffix}`;
    });
  };

  html = rewrite(html, imageBaseUrl, 'src|poster|href|longdesc', imageExtensionPattern);
  return rewrite(html, dataBaseUrl, 'src|href|data-manifest-url', dataExtensionPattern);
}

function getAssetBaseUrls() {
  return {
    imageBaseUrl: getBaseUrl(
      'AWMPC_IMAGE_BASE_URL',
      process.env.AWMPC_IMAGE_BASE_URL || process.env.AWMPC_ASSET_BASE_URL
    ),
    dataBaseUrl: getBaseUrl('AWMPC_DATA_BASE_URL', process.env.AWMPC_DATA_BASE_URL)
  };
}

function renderTemplate(template, pageName, pageContent, assetBaseUrls) {
  if (!template.includes('{{PAGE_NAME}}') || !template.includes('{{PAGE_CONTENT}}')) {
    fail('site.template.html is missing a required page placeholder.');
  }

  let html = template.replace('{{PAGE_NAME}}', pageName);
  html = html.replace('{{PAGE_CONTENT}}', pageContent);

  return rewriteAssetReferences(html, assetBaseUrls);
}

async function main() {
  const assetBaseUrls = getAssetBaseUrls();
  const template = await readFile(templatePath, 'utf8');
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'awmpc-static-node-'));
  const tempOutputDir = path.join(tempDir, 'rendered');
  await mkdir(tempOutputDir, { recursive: true });

  try {
    const renderedPages = [];
    for (const [, outputName, pageName, sourceName] of pages) {
      const sourcePath = path.join(templateDir, sourceName);
      const pageContent = await readFile(sourcePath, 'utf8');
      const html = renderTemplate(template, pageName, pageContent, assetBaseUrls);

      if (!html.trim() || html.includes('{{PAGE_') || !html.includes('<footer class="site-footer">')) {
        fail(`${outputName} did not produce a complete static document.`);
      }

      const tempPath = path.join(tempOutputDir, outputName);
      await writeFile(tempPath, html, 'utf8');
      renderedPages.push([tempPath, outputName, pageName]);
    }

    for (const fileName of staticFiles) {
      const outputPath = path.join(tempOutputDir, fileName);
      await mkdir(path.dirname(outputPath), { recursive: true });
      await cp(path.join(siteDir, fileName), outputPath);
    }

    if (!assetBaseUrls.dataBaseUrl) {
      const outputPath = path.join(tempOutputDir, hymnManifestPath);
      await mkdir(path.dirname(outputPath), { recursive: true });
      await cp(path.join(siteDir, hymnManifestPath), outputPath);
    }

    for (const fileName of staticTemplateFiles) {
      await cp(path.join(templateDir, fileName), path.join(tempOutputDir, fileName));
    }

    for (const directoryName of staticDirectories) {
      await cp(
        path.join(siteDir, directoryName),
        path.join(tempOutputDir, directoryName),
        { recursive: true }
      );
    }

    await rm(outputDir, { recursive: true, force: true });
    await rename(tempOutputDir, outputDir);

    for (const [, outputName, pageName] of renderedPages) {
      console.log(`Rendered ${outputName} from ${pageName}`);
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
