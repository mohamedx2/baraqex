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
    const requiredNodeVersion = '14.0.0';
    
    if (compareVersions(nodeVersion, requiredNodeVersion) < 0) {
      spinner.fail(`Node.js ${requiredNodeVersion}+ required, but found ${nodeVersion}`);
      console.log(chalk.yellow(`Please upgrade Node.js: ${terminalLink('https://nodejs.org', 'https://nodejs.org')}`));
      return false;
    }
    
    // Check npm version
    const npmVersionOutput = await execAsync('npm --version');
    const npmVersion = npmVersionOutput.stdout.trim();
    const requiredNpmVersion = '6.0.0';
    
    if (compareVersions(npmVersion, requiredNpmVersion) < 0) {
      spinner.fail(`npm ${requiredNpmVersion}+ required, but found ${npmVersion}`);
      console.log(chalk.yellow(`Please upgrade npm: ${chalk.cyan('npm install -g npm')}`));
      return false;
    }
    
    // Check for Go (optional, for WASM features)
    try {
      const goVersionOutput = await execAsync('go version');
      const goVersion = goVersionOutput.stdout.match(/go(\d+\.\d+\.\d+)/)?.[1] || 'unknown';
      spinner.succeed(`Environment ready: Node ${chalk.green(nodeVersion)}, npm ${chalk.green(npmVersion)}, Go ${chalk.green(goVersion)}`);
    } catch (error) {
      spinner.succeed(`Environment ready: Node ${chalk.green(nodeVersion)}, npm ${chalk.green(npmVersion)} ${chalk.yellow('(Go not found - WebAssembly features limited)')}`);
    }
    
    return true;
  } catch (error) {
    spinner.fail('Environment check failed');
    console.log(chalk.red('Error: Node.js and npm are required to use this tool.'));
    return false;
  }
}

// Compare versions helper
function compareVersions(a, b) {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);
  
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aVal = aParts[i] || 0;
    const bVal = bParts[i] || 0;
    
    if (aVal > bVal) return 1;
    if (aVal < bVal) return -1;
  }
  
  return 0;
}

// Choose template interactively with improved visualization
async function chooseTemplate() {
  const templatesPath = path.join(__dirname, '..', 'templates');
  
  // Create templates directory if it doesn't exist
  if (!fs.existsSync(templatesPath)) {
    fs.mkdirSync(templatesPath, { recursive: true });
  }
  
  const templates = fs.readdirSync(templatesPath).filter(file =>
    fs.statSync(path.join(templatesPath, file)).isDirectory()
  );
  
  // If no templates exist, create default ones
  if (templates.length === 0) {
    await createDefaultTemplates(templatesPath);
    const newTemplates = fs.readdirSync(templatesPath).filter(file =>
      fs.statSync(path.join(templatesPath, file)).isDirectory()
    );
    templates.push(...newTemplates);
  }
  
  // Emoji indicators for templates
  const templateIcons = {
    'basic-app': '🚀',
    'ssr-template': '🌐',
    'fullstack-app': '⚡',
    'go-wasm-app': '🔄',
  };

  // Detailed descriptions
  const templateDescriptions = {
    'basic-app': 'Single-page application with just the essentials. Perfect for learning the framework or building simple apps.',
    'ssr-template': 'Server-side rendered application with hydration. Optimized for SEO and fast initial load.',
    'fullstack-app': 'Complete solution with API routes, authentication, and database integration ready to go.',
    'go-wasm-app': 'WebAssembly integration with Go for high-performance computing in the browser and Node.js.'
  };
  
  console.log(boxen(
    `${chalk.bold('Available Project Templates')}\n\n` +
    templates.map(template => {
      const icon = templateIcons[template] || '📦';
      const shortDesc = {
        'basic-app': 'Simple client-side application',
        'ssr-template': 'Server-side rendering with hydration',
        'fullstack-app': 'Complete fullstack application with API',
        'go-wasm-app': 'WebAssembly integration with Go'
      }[template] || 'Application template';
      
      return `${icon} ${chalk.cyan(template)}\n   ${chalk.dim(shortDesc)}`;
    }).join('\n\n'),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan'
    }
  ));
  
  const templateChoices = templates.map(template => ({
    name: `${templateIcons[template] || '📦'} ${chalk.bold(template)}`,
    value: template,
    description: templateDescriptions[template] || 'An application template'
  }));
  
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'template',
      message: chalk.green('Select a project template:'),
      choices: templateChoices,
      loop: false,
      pageSize: 10
    },
    {
      type: 'confirm',
      name: 'viewDetails',
      message: 'Would you like to see template details before proceeding?',
      default: false
    }
  ]);
  
  if (answers.viewDetails) {
    const detailedDescription = {
      'basic-app': [
        `${chalk.bold('Basic App Template')} ${templateIcons['basic-app']}`,
        '',
        `${chalk.dim('A lightweight client-side application template.')}`,
        '',
        `${chalk.yellow('Features:')}`,
        '• Modern JSX components without dependencies',
        '• Built-in state management with hooks',
        '• Component-based architecture',
        '• Zero-config development setup',
        '',
        `${chalk.yellow('Best for:')}`,
        '• Simple web applications',
        '• Learning the framework',
        '• Quick prototyping',
      ],
      'ssr-template': [
        `${chalk.bold('SSR Template')} ${templateIcons['ssr-template']}`,
        '',
        `${chalk.dim('Server-side rendering with client hydration.')}`,
        '',
        `${chalk.yellow('Features:')}`,
        '• SEO-friendly rendered HTML',
        '• Fast initial page load',
        '• Smooth client-side transitions',
        '• Built-in dynamic meta tag generation',
        '• Express.js integration',
        '',
        `${chalk.yellow('Best for:')}`,
        '• Production websites needing SEO',
        '• Content-focused applications',
        '• Sites requiring social sharing previews'
      ],
      'fullstack-app': [
        `${chalk.bold('Fullstack App Template')} ${templateIcons['fullstack-app']}`,
        '',
        `${chalk.dim('Complete solution with frontend and backend.')}`,
        '',
        `${chalk.yellow('Features:')}`,
        '• API routes with Express integration',
        '• File-based routing system',
        '• Authentication system with JWT',
        '• Database connectors (MongoDB, MySQL, PostgreSQL)',
        '• Server-side rendering with hydration',
        '• WebSocket support',
        '',
        `${chalk.yellow('Best for:')}`,
        '• Full production applications',
        '• Apps needing authentication',
        '• Projects requiring database integration'
      ],
      'go-wasm-app': [
        `${chalk.bold('Go WASM App Template')} ${templateIcons['go-wasm-app'] || '🔄'}`,
        '',
        `${chalk.dim('WebAssembly integration with Go programming language.')}`,
        '',
        `${chalk.yellow('Features:')}`,
        '• Go + WebAssembly integration',
        '• High-performance computation in browser',
        '• Server-side WASM processing',
        '• Shared code between Go and JavaScript',
        '• Optimized build pipeline',
        '',
        `${chalk.yellow('Best for:')}`,
        '• Computation-heavy applications',
        '• Projects requiring Go libraries',
        '• Performance-critical features'
      ]
    }[answers.template] || ['No detailed information available for this template'];
    
    console.log(boxen(detailedDescription.join('\n'), {
      padding: 1,
      margin: 1,
      title: answers.template,
      titleAlignment: 'center',
      borderStyle: 'round',
      borderColor: 'yellow'
    }));
    
    const proceed = await inquirer.prompt([{
      type: 'confirm',
      name: 'continue',
      message: 'Continue with this template?',
      default: true
    }]);
    
    if (!proceed.continue) {
      return chooseTemplate();
    }
  }
  
  return answers.template;
}

// Create default templates if they don't exist
async function createDefaultTemplates(templatesPath) {
  // Templates are now created as actual directories and files
  // This function can be simplified since templates exist
  console.log('Templates already exist in the templates directory');
}

// Create a new project with enhanced visuals and status updates
async function createProject(projectName, options) {
  displayBanner();
  createSection('Project Setup');

  if (!projectName) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: chalk.green('What is your project name?'),
        default: 'my-baraqex-app',
        validate: input =>
          /^[a-z0-9-_]+$/.test(input)
            ? true
            : 'Project name can only contain lowercase letters, numbers, hyphens, and underscores'
      }
    ]);
    projectName = answers.projectName;
  }

  if (!await checkDependencies()) return;

  let template = options.template || await chooseTemplate();

  const targetDir = path.resolve(projectName);
  const templateDir = path.join(__dirname, '..', 'templates', template);

  if (fs.existsSync(targetDir)) {
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: chalk.yellow(`Directory ${projectName} already exists. Overwrite?`),
        default: false
      }
    ]);
    if (!answers.overwrite) {
      console.log(chalk.red('✖ Operation cancelled'));
      return;
    }
  }

  // Multi-step execution with progress reporting
  console.log(chalk.dim('\nCreating your new Baraqex project...'));
  
  // Step 1: Create directory
  const step1 = ora({text: 'Creating project directory', color: 'cyan'}).start();
  try {
    await fs.ensureDir(targetDir);
    step1.succeed();
  } catch (error) {
    step1.fail();
    console.error(chalk.red(`Error creating directory: ${error.message}`));
    return;
  }
  
  // Step 2: Copy template files
  const step2 = ora({text: 'Copying template files', color: 'cyan'}).start();
  try {
    await fs.copy(templateDir, targetDir, { overwrite: true });
    step2.succeed();
  } catch (error) {
    step2.fail();
    console.error(chalk.red(`Error copying files: ${error.message}`));
    return;
  }
  
  // Step 3: Update package.json
  const step3 = ora({text: 'Configuring package.json', color: 'cyan'}).start();
  try {
    const pkgJsonPath = path.join(targetDir, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
      const pkgJson = await fs.readJson(pkgJsonPath);
      pkgJson.name = projectName;
      await fs.writeJson(pkgJsonPath, pkgJson, { spaces: 2 });
      step3.succeed();
    } else {
      step3.warn('No package.json found in template');
    }
  } catch (error) {
    step3.fail();
    console.error(chalk.red(`Error updating package.json: ${error.message}`));
    return;
  }
  
  // Final success message with helpful instructions
  console.log('\n' + boxen(
    `${chalk.bold.green('Project created successfully!')}\n\n` +
    `${chalk.bold('Project:')} ${chalk.cyan(projectName)}\n` +
    `${chalk.bold('Template:')} ${chalk.cyan(template)}\n` +
    `${chalk.bold('Location:')} ${chalk.cyan(targetDir)}\n\n` +
    `${chalk.bold.yellow('Next steps:')}\n\n` +
    `  ${chalk.dim('1.')} ${chalk.cyan(`cd ${projectName}`)}\n` +
    `  ${chalk.dim('2.')} ${chalk.cyan('npm install')}\n` +
    `  ${chalk.dim('3.')} ${chalk.cyan('npm run dev')}\n\n` +
    `${chalk.dim('For help and documentation:')} ${terminalLink('www.baraqex.tech', 'https://www.baraqex.tech')}`,
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'green'
    }
  ));
  
  // Suggest next command
  console.log(`\n${chalk.cyan('Tip:')} Run ${chalk.bold.green(`cd ${projectName} && npm install`)} to get started right away.\n`);
}

// ...existing code... (add:component, dev:tools, and all other functions remain the same but update references)

// Dashboard when no commands are specified
function showDashboard() {
  displayBanner();
  
  const commands = [
    { name: 'create', description: 'Create a new project', command: 'baraqex create my-app' },
    { name: 'add:component', description: 'Add a new UI component', command: 'baraqex add:component Button' },
    { name: 'add:page', description: 'Create a new page', command: 'baraqex add:page home' },
    { name: 'add:api', description: 'Create a new API endpoint', command: 'baraqex add:api users' },
    { name: 'dev:tools', description: 'Show development tools', command: 'baraqex dev:tools' },
    { name: 'test:server', description: 'Test server functions', command: 'baraqex test:server' }
  ];
  
  console.log(boxen(
    `${chalk.bold.cyan('Welcome to Baraqex CLI!')}\n\n` +
    `Select a command to get started or run ${chalk.yellow('baraqex <command> --help')} for more info.\n`,
    {
      padding: 1, 
      margin: { top: 1, bottom: 1 },
      borderStyle: 'round',
      borderColor: 'cyan'
    }
  ));
  
  console.log(`${chalk.bold.cyan('Available Commands:')}\n`);
  commands.forEach((cmd, i) => {
    console.log(`  ${chalk.green((i+1) + '.')} ${chalk.bold(cmd.name.padEnd(15))} ${chalk.dim(cmd.description)}`);
    console.log(`     ${chalk.yellow(cmd.command)}\n`);
  });
  
  console.log(boxen(
    `${chalk.bold('Quick Start:')} ${chalk.yellow('baraqex create my-app')}\n` +
    `${chalk.dim('More info:')} ${terminalLink('www.baraqex.tech', 'https://www.baraqex.tech')}`,
    {
      padding: 0.5,
      margin: { top: 1 },
      borderStyle: 'round',
      borderColor: 'blue'
    }
  ));
}

// Register commands with improved descriptions
program
  .command('create [name]')
  .description('Create a new Baraqex project')
  .option('-t, --template <template>', 'Specify template (basic-app, ssr-template, fullstack-app, go-wasm-app)')
  .action(createProject);

program
  .command('test:server')
  .description('Run server function tests')
  .action(async () => {
    displayBanner();
    createSection('Server Function Testing');
    
    const spinner = ora('Running server tests...').start();
    
    try {
      // Import and run the test-server.js file
      const { runAllTests } = await import('../test-server.js');
      const success = await runAllTests();
      
      if (success) {
        spinner.succeed('All server tests passed!');
      } else {
        spinner.fail('Some server tests failed');
      }
    } catch (error) {
      spinner.fail('Failed to run server tests');
      console.error(chalk.red(`Error: ${error.message}`));
    }
  });

// Default command when no arguments
if (process.argv.length <= 2) {
  showDashboard();
} else {
  program.parse(process.argv);
}