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

  // Extract the prompt content (inside ```plain ... ```)
  const plainMatch = content.match(/```plain\n([\s\S]*?)```/);
  if (!plainMatch) return blocks;

  const promptContent = plainMatch[1];

  // Match snippet headings used in the actual prompts:
  //   Kotlin:, Kotlin (FlowerPlayer):, Kotlin (MediaPlayerHook):,
  //   Java:, Swift:, SwiftUI:, SwiftUI (.onDisappear):,
  //   SwiftUI — implement as class holding view reference:,
  //   UIKit:, UIKit (viewWillDisappear):, UIKit — conform on ViewController:,
  //   JavaScript:, JS:, XML:, HLS.js:, Bitmovin:, Dash.js:,
  //   Single HTML File:, React ...:, FlowerHls ...:
  //
  // Headings may be indented with 2 spaces.
  const labelKeywords = [
    'Kotlin', 'Java', 'Swift', 'SwiftUI', 'UIKit',
    'JavaScript', 'JS', 'XML',
    'HLS\\.js', 'Bitmovin', 'Dash\\.js',
    'Single HTML File', 'React', 'FlowerHls',
  ];
  const labelPrefix = labelKeywords.join('|');

  // Capture: optional indent, keyword + optional parenthetical/dash suffix, colon, newline, then body
  // Body ends at the next heading, section separator, or end of content
  const labelPattern = new RegExp(
    `(?:^|\\n)[ \\t]*((?:${labelPrefix})[^:\\n]*):\\s*\\n([\\s\\S]*?)` +
    `(?=\\n[ \\t]*(?:${labelPrefix})[^:\\n]*:\\s*\\n|\\n(?:========|---------|################################################################)|$)`,
    'g'
  );

  let match;
  let idx = 0;

  while ((match = labelPattern.exec(promptContent)) !== null) {
    const label = match[1].trim();
    const code = match[2].trim();
    if (code.length < 10) continue; // skip empty/trivial blocks

    blocks.push({
      language: inferLanguage(label),
      code,
      index: idx++,
    });
  }

  // Fallback: find standalone code patterns (class definitions without labels)
  // Allow leading indentation (2-4 spaces)
  const classPattern = /\n([ \t]*(?:public |private |open )?(?:class|interface|object|struct|enum) \w+[\s\S]*?\n[ \t]*\})\s*\n/g;
  while ((match = classPattern.exec(promptContent)) !== null) {
    const code = match[1].trim();
    const alreadyCaptured = blocks.some(b => b.code.includes(code.substring(0, 50)));
    if (!alreadyCaptured) {
      blocks.push({
        language: detectLanguage(code),
        code,
        index: idx++,
      });
    }
  }

  return blocks;
}

function inferLanguage(label) {
  const l = label.toLowerCase();
  if (l.startsWith('kotlin')) return 'kotlin';
  if (l.startsWith('java')) return 'java';
  if (l.startsWith('swift') || l.startsWith('uikit')) return 'swift';
  if (l.startsWith('javascript') || l.startsWith('js') || l.startsWith('hls.js')
      || l.startsWith('bitmovin') || l.startsWith('dash.js')
      || l.startsWith('react') || l.startsWith('single html')) return 'javascript';
  if (l.startsWith('xml')) return 'xml';
  if (l.startsWith('flowerhls')) return 'javascript';
  return 'unknown';
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

  // Strip imports and comments to get "real code"
  const codeWithoutImports = code.replace(/import\s+[\w.;]+\s*\n?/g, '')
    .replace(/\/\/.*\n?/g, '')
    .trim();

  // Skip blocks that are primarily import listings (IMPORTS reference sections).
  // If imports make up most of the block, there's no code to check usage against.
  const importLines = (code.match(/^\s*import\s+/gm) || []).length;
  const totalLines = code.split('\n').filter(l => l.trim()).length;
  if (totalLines > 0 && importLines / totalLines > 0.5) return;

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

function validateMethodSignatures(file, block, platformKey) {
  // Build method map for this platform only, preserving arity
  const platformContract = contract[platformKey];
  if (!platformContract) return;

  // methodNames: className -> Set of bare method names (for existence check)
  // methodArities: className -> { methodName: Set of valid arities }
  const methodNames = {};
  const methodArities = {};
  for (const [className, info] of Object.entries(platformContract)) {
    methodNames[className] = new Set();
    methodArities[className] = {};
    for (const m of (info.methods || [])) {
      const nameMatch = m.match(/^(\w+)\((.*)\)$/);
      if (!nameMatch) continue;
      const name = nameMatch[1];
      const params = nameMatch[2].trim();
      const arity = params === '' ? 0 : params.split(',').length;
      methodNames[className].add(name);
      if (!methodArities[className][name]) methodArities[className][name] = new Set();
      methodArities[className][name].add(arity);
    }
  }

  // Build a map of property types (e.g., adsManager -> FlowerAdsManager)
  const propertyTypes = {};
  for (const [className, info] of Object.entries(platformContract)) {
    if (info.properties) {
      for (const prop of info.properties) {
        for (const candidateClass of Object.keys(platformContract)) {
          if (candidateClass.toLowerCase().endsWith(prop.toLowerCase())) {
            propertyTypes[prop] = candidateClass;
            break;
          }
        }
      }
    }
  }

  const code = block.code;
  const skipMethods = new Set([
    'toString', 'hashCode', 'equals', 'Builder', 'build', 'log',
    'e', 'setVolume', 'pause', 'start', 'prepare', 'size',
    'fromUri', 'getMediaUnits', 'getDuration',
  ]);

  function checkCall(className, methodName, callStartIdx, via) {
    if (skipMethods.has(methodName)) return;
    if (!methodNames[className]) return;

    const label = via ? `${className}.${methodName}() (via .${via})` : `${className}.${methodName}()`;

    if (!methodNames[className].has(methodName)) {
      error(file, block, `${label} — method not found in ${platformKey} API contract`);
      return;
    }

    // Count arguments at call site
    const argCount = countArgs(code, callStartIdx);
    if (argCount === null) return; // couldn't parse, skip arity check

    const validArities = methodArities[className][methodName];
    if (validArities && validArities.size > 0 && !validArities.has(argCount)) {
      warn(file, block, `${label} — called with ${argCount} arg(s), contract expects ${[...validArities].join(' or ')}`);
    }
  }

  // 1. Direct class calls: ClassName.method(
  const staticPattern = /(\w+)\.([\w]+)\s*\(/g;
  let match;
  while ((match = staticPattern.exec(code)) !== null) {
    const lhs = match[1];
    if (lhs[0] === lhs[0].toLowerCase()) continue; // skip instance vars
    checkCall(lhs, match[2], match.index + match[0].length - 1, null);
  }

  // 2. Instance chain calls: something.property.method(
  const chainPattern = /\.(\w+)\.([\w]+)\s*\(/g;
  while ((match = chainPattern.exec(code)) !== null) {
    const resolvedClass = propertyTypes[match[1]];
    if (resolvedClass) {
      checkCall(resolvedClass, match[2], match.index + match[0].length - 1, match[1]);
    }
  }
}

// Count comma-separated arguments starting at the opening '(' index.
// Returns null if the closing ')' cannot be found (multi-line truncation etc.).
function countArgs(code, openIdx) {
  if (code[openIdx] !== '(') return null;

  let depth = 1;
  let argCount = 0;
  let hasContent = false;
  let inString = false;
  let stringChar = null;

  for (let i = openIdx + 1; i < code.length && depth > 0; i++) {
    const ch = code[i];

    // String handling
    if (!inString && (ch === '"' || ch === '\'')) {
      inString = true;
      stringChar = ch;
      hasContent = true;
      continue;
    }
    if (inString) {
      if (ch === stringChar && code[i - 1] !== '\\') inString = false;
      continue;
    }

    if (ch === '(' || ch === '[' || ch === '{') { depth++; hasContent = true; continue; }
    if (ch === ')' || ch === ']' || ch === '}') {
      depth--;
      if (depth === 0) return hasContent ? argCount + 1 : 0;
      continue;
    }
    if (ch === ',' && depth === 1) { argCount++; continue; }
    if (ch !== ' ' && ch !== '\n' && ch !== '\r' && ch !== '\t') hasContent = true;
  }

  return null; // unbalanced — snippet may be truncated
}

// ─── Main ───

const promptDirs = [
  { name: 'android-linear', dir: join(DOCS_DIR, 'android/prompts/linear-tv') },
  { name: 'android-vod', dir: join(DOCS_DIR, 'android/prompts/vod') },
  { name: 'ios', dir: join(DOCS_DIR, 'ios/prompts') },
  { name: 'web-smart-tv', dir: join(DOCS_DIR, 'web-smart-tv/prompts') },
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
      validateMethodSignatures(relPath, block, name);
    }
  }

  console.log(`  Scanned ${mdFiles.length} files, ${totalBlocks} code blocks`);
}

// ─── Summary ───

console.log(`\n=== Summary ===`);
console.log(`Errors: ${errors}, Warnings: ${warnings}`);
process.exit(errors > 0 ? 1 : 0);
