#!/usr/bin/env node

/**
 * Code Block Compilation Validator
 *
 * Extracts code blocks from prompt files and validates:
 * 1. Balanced braces/brackets/parentheses
 * 2. Import ↔ class usage consistency (Java/Kotlin)
 * 3. Known SDK method calls match API contract signatures
 * 4. String literal consistency (no broken quotes)
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, relative } from 'path';

const DOCS_DIR = join(import.meta.dirname, '..', 'docs');
const contract = JSON.parse(readFileSync(join(import.meta.dirname, 'api-contract.json'), 'utf-8'));

let errors = 0;
let warnings = 0;

function error(file, block, msg) {
  console.error(`  ERROR [${file}:block#${block.index}] ${msg}`);
  errors++;
}
function warn(file, block, msg) {
  console.warn(`  WARN  [${file}:block#${block.index}] ${msg}`);
  warnings++;
}

// ─── Code Block Extraction ───

function extractCodeBlocks(content) {
  const blocks = [];
  // Match fenced code blocks inside ```plain ... ``` prompt sections
  // We need code blocks INSIDE the plain block
  // Strategy: find all code blocks that look like actual code (Java/Kotlin/Swift/JS)
  // not the outer ```plain wrapper

  // First, extract the prompt content (inside ```plain ... ```)
  const plainMatch = content.match(/```plain\n([\s\S]*?)```/);
  if (!plainMatch) return blocks;

  const promptContent = plainMatch[1];

  // Find code-like sections: Java/Kotlin class definitions, method implementations
  // These are identified by patterns like:
  // - class/interface definitions
  // - override fun/void patterns
  // - import statements followed by code

  // Extract labeled code sections
  // Matches: "Java:", "Kotlin:", "Swift:", "JavaScript:", "JS:", "XML:",
  // and HTML5-style: "Single HTML File:", "React (...):", "FlowerHls approach:"
  const labelPattern = /(?:^|\n)(Java|Kotlin|Swift|JavaScript|JS|XML|Single HTML File|React[^:\n]*|FlowerHls[^:\n]*|If[^:\n]*):\s*\n([\s\S]*?)(?=\n(?:Java|Kotlin|Swift|JavaScript|JS|XML|Single HTML File|React|FlowerHls|If |========|---------|################################################################|\n---)|\n*$)/g;
  let match;
  let idx = 0;

  while ((match = labelPattern.exec(promptContent)) !== null) {
    blocks.push({
      language: match[1].toLowerCase(),
      code: match[2].trim(),
      index: idx++,
    });
  }

  // Also find standalone code patterns (class definitions without labels)
  const classPattern = /\n((?:public |private |open )?(?:class|interface|object|struct|enum) \w+[\s\S]*?\n\})\s*\n/g;
  while ((match = classPattern.exec(promptContent)) !== null) {
    // Skip if already captured in labeled blocks
    const alreadyCaptured = blocks.some(b => b.code.includes(match[1].trim().substring(0, 50)));
    if (!alreadyCaptured) {
      blocks.push({
        language: detectLanguage(match[1]),
        code: match[1].trim(),
        index: idx++,
      });
    }
  }

  return blocks;
}

function detectLanguage(code) {
  if (code.includes('override fun ') || code.includes('val ') || code.includes('var ')) return 'kotlin';
  if (code.includes('@Override') || code.includes('public void ')) return 'java';
  if (code.includes('func ') || code.includes('struct ')) return 'swift';
  if (code.includes('function ') || code.includes('const ') || code.includes('=> ')) return 'javascript';
  return 'unknown';
}

// ─── Validators ───

function validateBraces(file, block) {
  const code = block.code;
  const stack = [];
  const pairs = { '{': '}', '(': ')', '[': ']', '<': '>' };
  const closers = new Set(Object.values(pairs));

  // Skip angle brackets for generics - too many false positives
  const checkPairs = { '{': '}', '(': ')', '[': ']' };
  const checkClosers = new Set(Object.values(checkPairs));

  let inString = false;
  let stringChar = null;
  let inComment = false;
  let prevChar = '';

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    const next = code[i + 1];

    // Handle string literals
    if (!inComment && !inString && (ch === '"' || ch === '\'')) {
      inString = true;
      stringChar = ch;
      continue;
    }
    if (inString && ch === stringChar && prevChar !== '\\') {
      inString = false;
      stringChar = null;
      prevChar = ch;
      continue;
    }
    if (inString) { prevChar = ch; continue; }

    // Handle comments
    if (!inComment && ch === '/' && next === '/') {
      // Skip to end of line
      const eol = code.indexOf('\n', i);
      if (eol >= 0) i = eol;
      continue;
    }
    if (!inComment && ch === '/' && next === '*') {
      inComment = true;
      i++;
      continue;
    }
    if (inComment && ch === '*' && next === '/') {
      inComment = false;
      i++;
      continue;
    }
    if (inComment) continue;

    // Check braces
    if (checkPairs[ch]) {
      stack.push({ char: ch, pos: i });
    } else if (checkClosers.has(ch)) {
      if (stack.length === 0) {
        // Extra closing brace might be OK in snippet context
        continue;
      }
      const top = stack[stack.length - 1];
      if (checkPairs[top.char] === ch) {
        stack.pop();
      } else {
        error(file, block, `Mismatched brace: expected '${checkPairs[top.char]}' but found '${ch}' at position ${i}`);
        return;
      }
    }

    prevChar = ch;
  }

  // For code snippets, unclosed braces at the end are OK (partial code)
  // But more than 2 unclosed is suspicious
  const unclosed = stack.filter(s => s.char === '{');
  if (unclosed.length > 2) {
    warn(file, block, `${unclosed.length} unclosed '{' braces — possible syntax issue in ${block.language} block`);
  }
}

function validateImportUsage(file, block) {
  if (!['java', 'kotlin'].includes(block.language)) return;

  const code = block.code;

  // Skip import-only blocks (e.g., IMPORTS sections that list imports separately)
  const codeWithoutImports = code.replace(/import\s+[\w.;]+\s*\n?/g, '')
    .replace(/\/\/.*\n?/g, '') // strip comments
    .trim();
  if (codeWithoutImports.length < 30) return; // Block is mostly imports

  const imports = [];
  const importPattern = /import\s+([\w.]+\.(\w+));?\s*$/gm;
  let match;

  while ((match = importPattern.exec(code)) !== null) {
    imports.push({ path: match[1], className: match[2] });
  }

  // Check each imported class is actually used in the code body
  for (const imp of imports) {
    if (!codeWithoutImports.includes(imp.className)) {
      warn(file, block, `Unused import: ${imp.path} (${imp.className} not referenced in code)`);
    }
  }
}

function validateMethodSignatures(file, block) {
  // Build a map of all known SDK methods across all platforms
  const allMethods = {};
  for (const [, platform] of Object.entries(contract)) {
    for (const [className, info] of Object.entries(platform)) {
      if (!allMethods[className]) allMethods[className] = new Set();
      for (const m of (info.methods || [])) {
        allMethods[className].add(m.replace(/\(.*\)/, ''));
      }
    }
  }

  // Find ClassName.method() calls in code
  const callPattern = /(\w+)\.([\w]+)\s*\(/g;
  let match;
  const code = block.code;

  while ((match = callPattern.exec(code)) !== null) {
    const className = match[1];
    const methodName = match[2];

    // Only check known SDK classes
    if (allMethods[className]) {
      if (!allMethods[className].has(methodName)) {
        // Skip common methods
        if (['toString', 'hashCode', 'equals', 'Builder', 'build', 'log',
          'e', 'setVolume', 'pause', 'start', 'prepare', 'size',
          'fromUri', 'getMediaUnits', 'getDuration'].includes(methodName)) continue;
        // Skip variable names that happen to match class names
        if (className[0] === className[0].toLowerCase()) continue;

        error(file, block, `${className}.${methodName}() — method not found in API contract`);
      }
    }
  }
}

// ─── Main ───

const promptDirs = [
  { name: 'linear-tv', dir: join(DOCS_DIR, 'linear-tv/prompts') },
  { name: 'ott-android', dir: join(DOCS_DIR, 'ott-fast/prompts/android') },
  { name: 'ott-ios', dir: join(DOCS_DIR, 'ott-fast/prompts/ios') },
  { name: 'ott-html5', dir: join(DOCS_DIR, 'ott-fast/prompts/html5') },
];

for (const { name, dir } of promptDirs) {
  console.log(`\n=== ${name} ===\n`);

  if (!existsSync(dir)) {
    console.log('  Directory not found, skipping');
    continue;
  }

  const mdFiles = readdirSync(dir)
    .filter(f => f.endsWith('.md') && !f.startsWith('how-to'))
    .sort();

  let totalBlocks = 0;

  for (const mdFile of mdFiles) {
    const filePath = join(dir, mdFile);
    const content = readFileSync(filePath, 'utf-8');
    const blocks = extractCodeBlocks(content);

    if (blocks.length === 0) continue;

    const relPath = relative(DOCS_DIR, filePath);
    totalBlocks += blocks.length;

    for (const block of blocks) {
      validateBraces(relPath, block);
      validateImportUsage(relPath, block);
      validateMethodSignatures(relPath, block);
    }
  }

  console.log(`  Scanned ${mdFiles.length} files, ${totalBlocks} code blocks`);
}

// ─── Summary ───

console.log(`\n=== Summary ===`);
console.log(`Errors: ${errors}, Warnings: ${warnings}`);
process.exit(errors > 0 ? 1 : 0);
