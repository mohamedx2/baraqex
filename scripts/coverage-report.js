#!/usr/bin/env node

/**
 * Coverage Report Generator
 * Analyzes test coverage and generates detailed reports
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COVERAGE_DIR = path.join(__dirname, '../coverage');
const LCOV_FILE = path.join(COVERAGE_DIR, 'lcov.info');

function parseLcovFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error('❌ Coverage file not found. Run "npm run test:coverage" first.');
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const files = {};
  let currentFile = null;

  for (const line of lines) {
    if (line.startsWith('SF:')) {
      currentFile = line.substring(3);
      files[currentFile] = {
        lines: { found: 0, hit: 0 },
        functions: { found: 0, hit: 0 },
        branches: { found: 0, hit: 0 }
      };
    } else if (currentFile && line.startsWith('LF:')) {
      files[currentFile].lines.found = parseInt(line.substring(3));
    } else if (currentFile && line.startsWith('LH:')) {
      files[currentFile].lines.hit = parseInt(line.substring(3));
    } else if (currentFile && line.startsWith('FNF:')) {
      files[currentFile].functions.found = parseInt(line.substring(4));
    } else if (currentFile && line.startsWith('FNH:')) {
      files[currentFile].functions.hit = parseInt(line.substring(4));
    } else if (currentFile && line.startsWith('BRF:')) {
      files[currentFile].branches.found = parseInt(line.substring(4));
    } else if (currentFile && line.startsWith('BRH:')) {
      files[currentFile].branches.hit = parseInt(line.substring(4));
    }
  }

  return files;
}

function calculateCoverage(metric) {
  if (metric.found === 0) return 100;
  return Math.round((metric.hit / metric.found) * 100);
}

function getColorCode(coverage) {
  if (coverage >= 90) return '\x1b[32m'; // Green
  if (coverage >= 70) return '\x1b[33m'; // Yellow
  if (coverage >= 50) return '\x1b[31m'; // Red
  return '\x1b[41m'; // Red background
}

function resetColor() {
  return '\x1b[0m';
}

function formatPercentage(num) {
  return `${num.toString().padStart(3)}%`;
}

function generateReport() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         📊 TEST COVERAGE REPORT                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const files = parseLcovFile(LCOV_FILE);

  let totalLines = { found: 0, hit: 0 };
  let totalFunctions = { found: 0, hit: 0 };
  let totalBranches = { found: 0, hit: 0 };

  const sortedFiles = Object.entries(files).sort(([a], [b]) => a.localeCompare(b));

  console.log('┌─────────────────────────────────────┬──────┬───────┬──────┬────────┐');
  console.log('│ File                                │ Line │ Branch│ Func │ Overall│');
  console.log('├─────────────────────────────────────┼──────┼───────┼──────┼────────┤');

  for (const [file, metrics] of sortedFiles) {
    const shortFile = file.replace(process.cwd(), '').substring(1);
    const lineCov = calculateCoverage(metrics.lines);
    const branchCov = calculateCoverage(metrics.branches);
    const funcCov = calculateCoverage(metrics.functions);
    const overall = Math.round((lineCov + branchCov + funcCov) / 3);

    const lineColor = getColorCode(lineCov);
    const branchColor = getColorCode(branchCov);
    const funcColor = getColorCode(funcCov);
    const overallColor = getColorCode(overall);

    const fileName = shortFile.length > 35 ? '...' + shortFile.substring(shortFile.length - 32) : shortFile;

    console.log(
      `│ ${fileName.padEnd(35)} │ ${lineColor}${formatPercentage(lineCov)}${resetColor()} │ ${branchColor}${formatPercentage(branchCov)}${resetColor()} │ ${funcColor}${formatPercentage(funcCov)}${resetColor()} │ ${overallColor}${formatPercentage(overall)}${resetColor()} │`
    );

    totalLines.found += metrics.lines.found;
    totalLines.hit += metrics.lines.hit;
    totalFunctions.found += metrics.functions.found;
    totalFunctions.hit += metrics.functions.hit;
    totalBranches.found += metrics.branches.found;
    totalBranches.hit += metrics.branches.hit;
  }

  const totalLineCov = calculateCoverage(totalLines);
  const totalBranchCov = calculateCoverage(totalBranches);
  const totalFuncCov = calculateCoverage(totalFunctions);
  const totalOverall = Math.round((totalLineCov + totalBranchCov + totalFuncCov) / 3);

  const lineColor = getColorCode(totalLineCov);
  const branchColor = getColorCode(totalBranchCov);
  const funcColor = getColorCode(totalFuncCov);
  const overallColor = getColorCode(totalOverall);

  console.log('├─────────────────────────────────────┼──────┼───────┼──────┼────────┤');
  console.log(
    `│ ${'TOTAL'.padEnd(35)} │ ${lineColor}${formatPercentage(totalLineCov)}${resetColor()} │ ${branchColor}${formatPercentage(totalBranchCov)}${resetColor()} │ ${funcColor}${formatPercentage(totalFuncCov)}${resetColor()} │ ${overallColor}${formatPercentage(totalOverall)}${resetColor()} │`
  );
  console.log('└─────────────────────────────────────┴──────┴───────┴──────┴────────┘');

  console.log('\n📈 Coverage Summary:');
  console.log(`   Lines:    ${totalLines.hit}/${totalLines.found} (${totalLineCov}%)`);
  console.log(`   Branches: ${totalBranches.hit}/${totalBranches.found} (${totalBranchCov}%)`);
  console.log(`   Functions: ${totalFunctions.hit}/${totalFunctions.found} (${totalFuncCov}%)`);
  console.log(`   Overall:  ${totalOverall}%\n`);

  if (fs.existsSync(path.join(COVERAGE_DIR, 'lcov-report', 'index.html'))) {
    console.log(`📂 Detailed report available at: coverage/lcov-report/index.html\n`);
  }

  // Return overall coverage for CI/CD
  return totalOverall;
}

const coverage = generateReport();
process.exit(coverage < 50 ? 1 : 0);
