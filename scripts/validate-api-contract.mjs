#!/usr/bin/env node

/**
 * API Contract Validation
 *
 * Extracts class/method references from prompt files and validates them
 * against the API contract (api-contract.json).
 *
 * Catches: renamed/removed classes, wrong method names, wrong package paths.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const DOCS_DIR = join(import.meta.dirname, '..', 'docs');
const contract = JSON.parse(readFileSync(join(import.meta.dirname, 'api-contract.json'), 'utf-8'));

let errors = 0;
let warnings = 0;
let checks = 0;

function error(msg) { console.error(`  ERROR: ${msg}`); errors++; }
function warn(msg) { console.warn(`  WARN:  ${msg}`); warnings++; }
function ok(msg) { checks++; }

// ─── Helpers ───

function getAllContractClasses(platformKey) {
  const platform = contract[platformKey];
  if (!platform) return new Set();
  return new Set(Object.keys(platform));
}

function getAllContractMethods(platformKey) {
  const platform = contract[platformKey];
  if (!platform) return {};
  const result = {};
  for (const [className, info] of Object.entries(platform)) {
    const methods = (info.methods || []).map(m => m.replace(/\(.*\)/, ''));
    result[className] = new Set(methods);
  }
  return result;
}

function getContractPackages(platformKey) {
  const platform = contract[platformKey];
  if (!platform) return {};
  const result = {};
  for (const [className, info] of Object.entries(platform)) {
    if (info.package) {
      result[className] = info.package;
    }
  }
  return result;
}

// ─── Extract references from prompt ───

function extractClassRefs(content) {
  // Match known SDK class names
  const allClasses = new Set();
  for (const platformKey of Object.keys(contract)) {
    if (META_KEYS.has(platformKey)) continue;
    for (const cls of Object.keys(contract[platformKey])) {
      allClasses.add(cls);
    }
  }

  const found = new Set();
  for (const cls of allClasses) {
    const pattern = new RegExp(`\\b${cls}\\b`, 'g');
    let match;
    while ((match = pattern.exec(content)) !== null) {
      // Skip negation context
      const lineStart = content.lastIndexOf('\n', match.index) + 1;
      const lineEnd = content.indexOf('\n', match.index);
      const line = content.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
      if (/\b(not|NOT|does NOT|Do NOT|never|NEVER)\b/.test(line)) continue;
      found.add(cls);
      break;
    }
  }
  return found;
}

function extractImportPaths(content) {
  // Match Java/Kotlin imports: import tv.anypoint...
  const imports = [];
  const pattern = /import\s+(tv\.anypoint[\w.]+)/g;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

function extractMethodCalls(content, className) {
  const methods = new Set();

  // Direct class calls: ClassName.method(
  // Skip negation context: lines containing "not ClassName.method" or "NOT require ClassName.method"
  const staticPattern = new RegExp(`${className}\\.(\\w+)\\(`, 'g');
  let match;
  while ((match = staticPattern.exec(content)) !== null) {
    // Check if match is in a negation context
    const lineStart = content.lastIndexOf('\n', match.index) + 1;
    const lineEnd = content.indexOf('\n', match.index);
    const line = content.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
    if (/\b(not|NOT|does NOT|Do NOT|never|NEVER)\b/.test(line)) continue;
    methods.add(match[1]);
  }

  return methods;
}

// ─── Validate each platform ───

// Skip metadata keys in contract JSON
const META_KEYS = new Set(['$schema', '_description', '_lastVerified']);

const platformPrompts = {
  'linear-tv': [
    join(DOCS_DIR, 'linear-tv/prompts/integrated-prompt.md'),
    join(DOCS_DIR, 'linear-tv/prompts/step-1-project-setup.md'),
    join(DOCS_DIR, 'linear-tv/prompts/step-2-ad-ui-and-player.md'),
    join(DOCS_DIR, 'linear-tv/prompts/step-3-ad-integration.md'),
    join(DOCS_DIR, 'linear-tv/prompts/step-4-cleanup.md'),
  ],
  'ott-android': [
    join(DOCS_DIR, 'ott-fast/prompts/android/integrated-prompt.md'),
    join(DOCS_DIR, 'ott-fast/prompts/android/step-1-project-setup.md'),
    join(DOCS_DIR, 'ott-fast/prompts/android/step-2-ad-ui-and-player.md'),
    join(DOCS_DIR, 'ott-fast/prompts/android/step-3-ad-integration.md'),
    join(DOCS_DIR, 'ott-fast/prompts/android/step-4-cleanup.md'),
  ],
  'ott-ios': [
    join(DOCS_DIR, 'ott-fast/prompts/ios/integrated-prompt.md'),
    join(DOCS_DIR, 'ott-fast/prompts/ios/step-1-project-setup.md'),
    join(DOCS_DIR, 'ott-fast/prompts/ios/step-2-ad-ui-and-player.md'),
    join(DOCS_DIR, 'ott-fast/prompts/ios/step-3-ad-integration.md'),
    join(DOCS_DIR, 'ott-fast/prompts/ios/step-4-cleanup.md'),
  ],
  'ott-html5': [
    join(DOCS_DIR, 'ott-fast/prompts/html5/integrated-prompt.md'),
    join(DOCS_DIR, 'ott-fast/prompts/html5/step-1-project-setup.md'),
    join(DOCS_DIR, 'ott-fast/prompts/html5/step-2-ad-ui-and-player.md'),
    join(DOCS_DIR, 'ott-fast/prompts/html5/step-3-ad-integration.md'),
    join(DOCS_DIR, 'ott-fast/prompts/html5/step-4-cleanup.md'),
  ],
};

// Filter contract to only platform keys
const platformKeys = Object.keys(contract).filter(k => !META_KEYS.has(k));

for (const [platformKey, promptFiles] of Object.entries(platformPrompts)) {
  console.log(`\n=== ${platformKey} ===\n`);

  const contractClasses = getAllContractClasses(platformKey);
  const contractMethods = getAllContractMethods(platformKey);
  const contractPackages = getContractPackages(platformKey);

  // Merge all prompt content for this platform
  let allContent = '';
  for (const f of promptFiles) {
    if (existsSync(f)) {
      allContent += readFileSync(f, 'utf-8') + '\n';
    } else {
      error(`Expected prompt file not found: ${f}`);
    }
  }

  // 1. Check import paths match contract packages
  const imports = extractImportPaths(allContent);
  for (const importPath of imports) {
    // Extract class name from import path
    const parts = importPath.split('.');
    const importedClass = parts[parts.length - 1];
    const importedPackage = parts.slice(0, -1).join('.');

    if (contractPackages[importedClass]) {
      const expectedPackage = contractPackages[importedClass];
      // For nested interfaces, the import might include parent class
      if (importedPackage !== expectedPackage && !importedPath(importedPackage, expectedPackage)) {
        error(`Import path mismatch for ${importedClass}: prompt has "${importPath}", contract expects "${expectedPackage}.${importedClass}"`);
      } else {
        ok(`Import ${importedClass}`);
      }
    }
  }

  // 2. Check that class references in prompts exist in contract
  const referencedClasses = extractClassRefs(allContent);
  for (const cls of referencedClasses) {
    if (!contractClasses.has(cls)) {
      let leakedFrom = null;
      for (const otherPlatform of Object.keys(contract)) {
        if (META_KEYS.has(otherPlatform)) continue;
        if (otherPlatform !== platformKey && contract[otherPlatform][cls]) {
          leakedFrom = otherPlatform;
          break;
        }
      }
      if (leakedFrom) {
        error(`Class "${cls}" referenced in ${platformKey} prompts but belongs to ${leakedFrom} contract (cross-platform leakage)`);
      } else {
        warn(`Class "${cls}" referenced in ${platformKey} prompts but not in any API contract`);
      }
    } else {
      ok(`Class ${cls}`);
    }
  }

  // 3. Check static method calls against contract
  for (const cls of contractClasses) {
    const promptMethods = extractMethodCalls(allContent, cls);
    const contractMethodSet = contractMethods[cls] || new Set();

    for (const method of promptMethods) {
      if (!contractMethodSet.has(method)) {
        // Check if it's a constructor or common method
        if (['toString', 'hashCode', 'equals', 'values', 'valueOf'].includes(method)) continue;
        error(`${cls}.${method}() called in prompt but NOT in API contract`);
      } else {
        ok(`${cls}.${method}()`);
      }
    }
  }

  // 4. Check enum values for TvEvent
  if (contract[platformKey]?.TvEvent?.values) {
    const expectedValues = contract[platformKey].TvEvent.values;
    for (const val of expectedValues) {
      if (allContent.includes(`TvEvent.${val}`)) {
        ok(`TvEvent.${val}`);
      }
    }
    // Check for TvEvent values in prompt that aren't in contract
    const tvEventPattern = /TvEvent\.([A-Z_]+)/g;
    let match;
    while ((match = tvEventPattern.exec(allContent)) !== null) {
      if (!expectedValues.includes(match[1])) {
        error(`TvEvent.${match[1]} used in prompt but NOT in API contract`);
      }
    }
  }

  console.log(`  Checked ${checks} items`);
  checks = 0;
}

// Helper: check if import path is compatible
function importedPath(actual, expected) {
  // Handle nested class imports (e.g., AnypointAdsManager.AdsManagerListener)
  // Only match if one is a prefix of the other (with dot separator)
  return actual === expected || 
         actual.startsWith(expected + '.') || 
         expected.startsWith(actual + '.');
}

// ─── Summary ───

console.log(`\n=== Summary ===`);
console.log(`Errors: ${errors}, Warnings: ${warnings}`);
process.exit(errors > 0 ? 1 : 0);
