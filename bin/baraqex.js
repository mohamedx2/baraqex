#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import gradient from 'gradient-string';
import { createSpinner } from 'nanospinner';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import boxen from 'boxen';
import terminalLink from 'terminal-link';
import updateNotifier from 'update-notifier';
import ora from 'ora';
import figlet from 'figlet';

// Convert to ESM-friendly __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

// Check for package updates
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  const notifier = updateNotifier({ pkg, updateCheckInterval: 1000 * 60 * 60 * 24 });
  
  if (notifier.update) {
    const updateMessage = boxen(
      `Update available: ${chalk.dim(notifier.update.current)} → ${chalk.green(notifier.update.latest)}\n` +
      `Run ${chalk.cyan('npm i -g baraqex')} to update`,
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan'
      }
    );
    console.log(updateMessage);
  }
} catch (error) {
  // Silently continue if update check fails
}

// CLI instance
const program = new Command();

// Create beautiful ASCII art banner with gradient colors
const displayBanner = () => {
  const titleText = figlet.textSync('Baraqex', { 
    font: 'Standard',
    horizontalLayout: 'default',
    verticalLayout: 'default' 
  });
  
  console.log('\n' + gradient.pastel.multiline(titleText));
  
  console.log(boxen(
    `${chalk.bold('A powerful full-stack framework with WebAssembly integration')}\n\n` +
    `${chalk.dim('Version:')} ${chalk.cyan(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')).version)}\n` +
    `${chalk.dim('Website:')} ${terminalLink('www.baraqex.tech', 'https://www.baraqex.tech')}`,
    {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: 'round',
      borderColor: 'cyan'
    }
  ));
};

// Version and description
program
  .name('baraqex')
  .description('CLI for Baraqex - A powerful full-stack JavaScript/TypeScript framework with WebAssembly integration')
  .version(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')).version);

// Helper for creating visually consistent sections
const createSection = (title) => {
  console.log('\n' + chalk.bold.cyan(`◆ ${title}`));
  console.log(chalk.cyan('─'.repeat(60)) + '\n');
};

// Helper for checking dependencies with improved feedback
async function checkDependencies() {
  const spinner = ora({
    text: 'Checking environment...',
    spinner: 'dots',
    color: 'cyan'
  }).start();
  
  try {
    // Check Node version
    const nodeVersionOutput = await execAsync('node --version');
    const nodeVersion = nodeVersionOutput.stdout.trim().replace('v', '');