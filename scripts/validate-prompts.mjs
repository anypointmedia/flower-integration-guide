#!/usr/bin/env node

/**
 * Prompt Validation Script
 *
 * 1. Placeholder consistency: same placeholder names across platforms
 * 2. Step ↔ Integrated cross-reference: no missing content
 * 3. Placeholder documentation: all used placeholders are documented in how-to-use
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, relative } from 'path';

const DOCS_DIR = join(import.meta.dirname, '..', 'docs');
let errors = 0;
let warnings = 0;

function error(msg) { console.error(`  ERROR: ${msg}`); errors++; }
function warn(msg) { console.warn(`  WARN:  ${msg}`); warnings++; }

// ─── 1. Placeholder Consistency ───

console.log('\n=== 1. Placeholder Consistency ===\n');

function extractPlaceholders(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const matches = content.match(/\{\{[A-Z_]+\}\}/g) || [];
  return [...new Set(matches)].map(m => m.replace(/\{|\}/g, '')).sort();
}

const platformPrompts = {
  'android-linear': join(DOCS_DIR, 'android/prompts/linear-tv/integrated-prompt.md'),
  'android-vod': join(DOCS_DIR, 'android/prompts/vod/integrated-prompt.md'),
  'ios': join(DOCS_DIR, 'ios/prompts/integrated-prompt.md'),
  'web-smart-tv': join(DOCS_DIR, 'web-smart-tv/prompts/integrated-prompt.md'),
};

const placeholdersByPlatform = {};
for (const [platform, filePath] of Object.entries(platformPrompts)) {
  if (existsSync(filePath)) {
    placeholdersByPlatform[platform] = extractPlaceholders(filePath);
    console.log(`${platform}: ${placeholdersByPlatform[platform].join(', ')}`);
  }
}

// Check non-linear platforms share the same placeholders (minus platform-specific ones)
const ottPlatforms = ['android-vod', 'ios', 'web-smart-tv'];
// Platform-specific placeholders that are NOT expected across all OTT platforms
// SDK_VERSION: iOS uses SPM (version set in Xcode UI), not in code
const platformSpecific = new Set(['UI_FRAMEWORK', 'PLAYER_TYPE', 'SDK_VERSION']);

const ottCommon = ottPlatforms
  .filter(p => placeholdersByPlatform[p])
  .map(p => placeholdersByPlatform[p].filter(ph => !platformSpecific.has(ph)));

for (let i = 1; i < ottCommon.length; i++) {
  const base = ottCommon[0];
  const current = ottCommon[i];
  const missing = base.filter(p => !current.includes(p));
  const extra = current.filter(p => !base.includes(p));

  if (missing.length > 0) {
    error(`${ottPlatforms[i]} missing placeholders vs ${ottPlatforms[0]}: ${missing.join(', ')}`);
  }
  if (extra.length > 0) {
    error(`${ottPlatforms[i]} has extra placeholders vs ${ottPlatforms[0]}: ${extra.join(', ')}`);
  }
}

// ─── 2. Step ↔ Integrated Cross-Reference ───

console.log('\n=== 2. Step ↔ Integrated Cross-Reference ===\n');

function extractApiCalls(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  // Match patterns like ClassName.methodName or ClassName(
  const apiPattern = /(?:Anypoint|Flower|Scte35|TvEvent)\w*\.?\w+\(/g;
  const matches = content.match(apiPattern) || [];
  return [...new Set(matches)].sort();
}

const promptDirs = [
  { name: 'android-linear', dir: join(DOCS_DIR, 'android/prompts/linear-tv') },
  { name: 'android-vod', dir: join(DOCS_DIR, 'android/prompts/vod') },
  { name: 'ios', dir: join(DOCS_DIR, 'ios/prompts') },
  { name: 'web-smart-tv', dir: join(DOCS_DIR, 'web-smart-tv/prompts') },
];

for (const { name, dir } of promptDirs) {
  if (!existsSync(dir)) continue;

  const integratedPath = join(dir, 'integrated-prompt.md');
  if (!existsSync(integratedPath)) continue;

  const stepFiles = readdirSync(dir)
    .filter(f => f.startsWith('step-') && f.endsWith('.md'))
    .sort();

  const integratedApis = extractApiCalls(integratedPath);
  const stepApis = new Set();

  for (const stepFile of stepFiles) {
    for (const api of extractApiCalls(join(dir, stepFile))) {
      stepApis.add(api);
    }
  }

  const inStepsNotIntegrated = [...stepApis].filter(a => !integratedApis.includes(a));
  const inIntegratedNotSteps = integratedApis.filter(a => !stepApis.has(a));

  if (inStepsNotIntegrated.length > 0) {
    warn(`[${name}] API calls in steps but NOT in integrated: ${inStepsNotIntegrated.join(', ')}`);
  }
  if (inIntegratedNotSteps.length > 0) {
    warn(`[${name}] API calls in integrated but NOT in steps: ${inIntegratedNotSteps.join(', ')}`);
  }

  if (inStepsNotIntegrated.length === 0 && inIntegratedNotSteps.length === 0) {
    console.log(`${name}: OK (step ↔ integrated API references match)`);
  }
}

// ─── 3. Placeholder Documentation Check ───

console.log('\n=== 3. Placeholder Documentation ===\n');

const howToUseEntries = [
  { path: join(DOCS_DIR, 'android/prompts/linear-tv/how-to-use-prompts.md'), platforms: ['android-linear'] },
  { path: join(DOCS_DIR, 'android/prompts/vod/how-to-use-prompts.md'), platforms: ['android-vod'] },
  { path: join(DOCS_DIR, 'ios/prompts/how-to-use-prompts.md'), platforms: ['ios'] },
  { path: join(DOCS_DIR, 'web-smart-tv/prompts/how-to-use-prompts.md'), platforms: ['web-smart-tv'] },
];

for (const { path: howToPath, platforms: relevantPlatforms } of howToUseEntries) {
  if (!existsSync(howToPath)) continue;

  const howToContent = readFileSync(howToPath, 'utf-8');
  const rel = relative(DOCS_DIR, howToPath);

  // Find all placeholders documented in how-to-use
  const documentedParams = new Set();
  const paramTablePattern = /`([A-Z_]+)`/g;
  let match;
  while ((match = paramTablePattern.exec(howToContent)) !== null) {
    documentedParams.add(match[1]);
  }

  const allUsedPlaceholders = new Set();
  for (const platform of relevantPlatforms) {
    if (placeholdersByPlatform[platform]) {
      for (const ph of placeholdersByPlatform[platform]) {
        allUsedPlaceholders.add(ph);
      }
    }
  }

  const undocumented = [...allUsedPlaceholders].filter(p => !documentedParams.has(p));
  const unusedDocs = [...documentedParams].filter(p => !allUsedPlaceholders.has(p));

  if (undocumented.length > 0) {
    error(`[${rel}] Used in prompts but NOT documented: ${undocumented.join(', ')}`);
  }
  if (unusedDocs.length > 0) {
    warn(`[${rel}] Documented but NOT used in prompts: ${unusedDocs.join(', ')}`);
  }

  if (undocumented.length === 0 && unusedDocs.length === 0) {
    console.log(`${rel}: OK (all placeholders documented)`);
  }
}

// ─── Summary ───

console.log(`\n=== Summary ===`);
console.log(`Errors: ${errors}, Warnings: ${warnings}`);
process.exit(errors > 0 ? 1 : 0);
