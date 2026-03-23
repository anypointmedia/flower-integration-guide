#!/usr/bin/env node

/**
 * Parameterized Branch Testing
 *
 * Fills prompt templates with each parameter combination from test-matrix.json,
 * sends to local Claude Code CLI (claude -p), and validates the output
 * contains expected patterns and does not contain forbidden patterns.
 *
 * Usage:
 *   node scripts/run-branch-tests.mjs [--dry-run] [--platform linear-tv]
 *
 * Options:
 *   --dry-run     Show test matrix without calling LLM
 *   --platform X  Run only one platform (linear-tv, ott-android, etc.)
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { execFile } from 'child_process';

const ROOT = join(import.meta.dirname, '..');
const matrix = JSON.parse(readFileSync(join(import.meta.dirname, 'test-matrix.json'), 'utf-8'));

// ─── CLI args ───

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const platformIdx = args.indexOf('--platform');
const platformFilter = platformIdx !== -1 && args[platformIdx + 1] && !args[platformIdx + 1].startsWith('--')
  ? args[platformIdx + 1]
  : null;

if (platformIdx !== -1 && !platformFilter) {
  console.error('Error: --platform requires a value');
  process.exit(1);
}

// ─── Helpers ───

function fillTemplate(template, params) {
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

function extractPromptContent(mdContent) {
  const match = mdContent.match(/```plain\n([\s\S]*?)```/);
  return match ? match[1] : mdContent;
}

async function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const child = execFile('claude', ['-p', '--output-format', 'text'], {
      maxBuffer: 1024 * 1024,
      timeout: 120_000,
    }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(`claude CLI error: ${err.message}\n${stderr}`));
      } else {
        resolve(stdout);
      }
    });
    child.stdin.write(prompt);
    child.stdin.end();
  });
}

function validateOutput(output, combo) {
  const results = { pass: [], fail: [] };

  for (const pattern of combo.expect) {
    if (output.includes(pattern)) {
      results.pass.push(`EXPECT: "${pattern}"`);
    } else {
      results.fail.push(`MISSING: "${pattern}" — expected but not found`);
    }
  }

  // Extract code blocks from LLM output for forbidden pattern checks
  // This avoids false positives from explanation text like "Do NOT use X"
  const codeBlocks = [];
  const codeBlockRegex = /```[\s\S]*?```/g;
  let cbMatch;
  while ((cbMatch = codeBlockRegex.exec(output)) !== null) {
    codeBlocks.push(cbMatch[0]);
  }
  const codeOnly = codeBlocks.length > 0 ? codeBlocks.join('\n') : output;

  for (const pattern of combo.forbid) {
    if (codeOnly.includes(pattern)) {
      results.fail.push(`FORBIDDEN: "${pattern}" — should not appear in generated code`);
    } else {
      results.pass.push(`FORBID: "${pattern}" (correctly absent from code)`);
    }
  }

  return results;
}

// ─── Main ───

async function main() {
  let totalPass = 0;
  let totalFail = 0;
  let totalCombos = 0;

  const platforms = platformFilter
    ? { [platformFilter]: matrix[platformFilter] }
    : Object.fromEntries(Object.entries(matrix).filter(([k]) => k !== '$description'));

  for (const [platformKey, config] of Object.entries(platforms)) {
    if (!config || !config.combinations) continue;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ${platformKey} (${config.combinations.length} combinations)`);
    console.log(`${'='.repeat(60)}`);

    const templatePath = join(ROOT, config.template);
    const rawTemplate = readFileSync(templatePath, 'utf-8');
    const promptTemplate = extractPromptContent(rawTemplate);

    for (const combo of config.combinations) {
      totalCombos++;
      const allParams = { ...config.defaults, ...combo.params };
      const filledPrompt = fillTemplate(promptTemplate, allParams);

      console.log(`\n--- ${combo.name} ---`);
      console.log(`  Params: ${JSON.stringify(combo.params)}`);
      console.log(`  Expect: ${combo.expect.length} patterns, Forbid: ${combo.forbid.length} patterns`);

      if (dryRun) {
        const unfilled = filledPrompt.match(/\{\{[A-Z_]+\}\}/g);
        if (unfilled) {
          console.log(`  WARNING: Unfilled placeholders: ${[...new Set(unfilled)].join(', ')}`);
        } else {
          console.log(`  OK: All placeholders filled`);
        }
        continue;
      }

      try {
        console.log(`  Calling claude CLI...`);
        const output = await callClaude(filledPrompt);
        console.log(`  Response: ${output.length} chars`);

        const results = validateOutput(output, combo);
        totalPass += results.pass.length;
        totalFail += results.fail.length;

        if (results.fail.length > 0) {
          console.log(`  FAIL (${results.fail.length} issues):`);
          for (const f of results.fail) {
            console.log(`    ✗ ${f}`);
          }
        } else {
          console.log(`  PASS (${results.pass.length}/${results.pass.length} checks)`);
        }
      } catch (err) {
        console.error(`  ERROR: ${err.message}`);
        totalFail++;
      }
    }
  }

  // ─── Summary ───

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  SUMMARY`);
  console.log(`${'='.repeat(60)}`);
  console.log(`  Combinations: ${totalCombos}`);

  if (dryRun) {
    console.log(`  Mode: dry-run (no LLM calls)`);
  } else {
    console.log(`  Mode: local (claude CLI)`);
    console.log(`  Pass: ${totalPass}, Fail: ${totalFail}`);
    process.exit(totalFail > 0 ? 1 : 0);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
