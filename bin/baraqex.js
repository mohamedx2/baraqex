#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import gradient from 'gradient-string';
import { createSpinner } from 'nanospinner';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import boxen from 'boxen';
import terminalLink from 'terminal-link';
import updateNotifier from 'update-notifier';
import ora from 'ora';
import figlet from 'figlet';
import semver from 'semver';
import open from 'open';
import glob from 'glob';
import { WebSocketServer } from 'ws';
import chokidar from 'chokidar';
import { performance } from 'perf_hooks';
import os from 'os';
import { createRequire } from 'module';

// Convert to ESM-friendly __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);
const require = createRequire(import.meta.url);

// Enhanced package info with comprehensive update checking
let packageInfo = {};
try {
  packageInfo = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  const notifier = updateNotifier({ 
    pkg: packageInfo, 
    updateCheckInterval: 1000 * 60 * 60 * 12, // Check every 12 hours
    shouldNotifyInNpmScript: true
  });
  
  if (notifier.update && notifier.update.latest !== packageInfo.version) {
    const versionDiff = semver.diff(notifier.update.current, notifier.update.latest);
    const urgency = versionDiff === 'major' ? '🚨 MAJOR' : 
                   versionDiff === 'minor' ? '⚠️ MINOR' : 
                   '🔧 PATCH';
    
    const updateMessage = boxen(
      `${chalk.yellow(`📦 Update available! ${urgency} Update`)}\n\n` +
      `${chalk.dim('Current:')} ${chalk.red(notifier.update.current)}\n` +
      `${chalk.dim('Latest:')} ${chalk.green(notifier.update.latest)}\n\n` +
      `${chalk.cyan('Run one of these commands to update:')}\n` +
      `• ${chalk.yellow('npm i -g baraqex@latest')}\n` +
      `• ${chalk.yellow('yarn global add baraqex@latest')}\n` +
      `• ${chalk.yellow('pnpm add -g baraqex@latest')}\n\n` +
      `${chalk.dim('Changelog:')} ${terminalLink('View changes', `https://github.com/mohamedx2/baraqex/releases/tag/v${notifier.update.latest}`)}\n` +
      `${chalk.dim('Documentation:')} ${terminalLink('Updated docs', 'https://www.baraqex.tech/docs')}`,
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: versionDiff === 'major' ? 'red' : versionDiff === 'minor' ? 'yellow' : 'green',
        title: '🎯 Baraqex Update Available'
      }
    );
    console.log(updateMessage);
  }
} catch (error) {
  // Silently continue if update check fails
}

// Enhanced CLI instance with global configuration
const program = new Command();

// Global configuration store
const globalConfig = {
  analytics: true,
  autoUpdate: true,
  defaultTemplate: 'basic-app',
  defaultPackageManager: 'npm',
  telemetry: true
};

// Load user preferences
const configPath = path.join(os.homedir(), '.baraqex', 'config.json');
try {
  if (fs.existsSync(configPath)) {
    const userConfig = fs.readJsonSync(configPath);
    Object.assign(globalConfig, userConfig);
  }
} catch (error) {
  // Use defaults if config can't be loaded
}

// Performance monitoring
const perfMonitor = {
  startTime: performance.now(),
  checkpoints: new Map(),
  
  checkpoint(name) {
    this.checkpoints.set(name, performance.now() - this.startTime);
  },
  
  report() {
    const total = performance.now() - this.startTime;
    console.log(chalk.dim(`\n⏱️ Performance: ${total.toFixed(2)}ms total`));
    for (const [name, time] of this.checkpoints) {
      console.log(chalk.dim(`   • ${name}: ${time.toFixed(2)}ms`));
    }
  }
};

// Enhanced banner with system information and tips
const displayBanner = () => {
  const titleText = figlet.textSync('Baraqex', { 
    font: 'ANSI Shadow',
    horizontalLayout: 'fitted',
    verticalLayout: 'fitted' 
  });
  
  console.log('\n' + gradient(['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57']).multiline(titleText));
  
  const stats = getProjectStats();
  const systemInfo = getSystemInfo();
  
  // Daily tip system
  const tips = [
    "💡 Use 'baraqex dev --open' to automatically open your browser",
    "🚀 Try 'baraqex add:component Button --typescript' for TypeScript components",
    "📊 Run 'baraqex doctor' to check your project health",
    "🎨 Use 'baraqex add:layout Dashboard --sidebar' for instant layouts",
    "⚡ Enable hot reload with 'baraqex dev --hot'",
    "📱 Generate PWA with 'baraqex add:pwa'",
    "🔧 Customize builds with 'baraqex build --analyze'",
    "🌐 Deploy instantly with 'baraqex deploy --platform vercel'"
  ];
  
  const dailyTip = tips[new Date().getDate() % tips.length];
  
  console.log(boxen(
    `${chalk.bold.cyan('🚀 Modern Full-Stack Framework with AI-Powered Development')}\n\n` +
    `${chalk.dim('Version:')} ${chalk.cyan(packageInfo.version)} ${chalk.dim('•')} ${chalk.dim('Node:')} ${chalk.green(process.version)}\n` +
    `${chalk.dim('Platform:')} ${chalk.green(systemInfo.platform)} ${chalk.dim('•')} ${chalk.dim('Memory:')} ${chalk.green(systemInfo.memory)}\n\n` +
    (stats.isProject ? 
      `${chalk.bold.green('✓ Current Project:')} ${chalk.cyan(stats.name)}\n` +
      `${chalk.dim('•')} ${chalk.green(stats.components)} components ${chalk.dim('•')} ${chalk.green(stats.pages)} pages ${chalk.dim('•')} ${chalk.green(stats.apis)} APIs\n` +
      `${chalk.dim('•')} Bundle size: ${chalk.yellow(stats.bundleSize)} ${chalk.dim('•')} Last build: ${chalk.yellow(stats.lastBuild)}\n\n` :
      `${chalk.yellow('💡 Quick Start:')} Run ${chalk.cyan('baraqex create my-app')} to begin\n\n`
    ) +
    `${chalk.bold.magenta('🌟 Quick Links:')}\n` +
    `${chalk.dim('•')} ${terminalLink('📚 Documentation', 'https://www.baraqex.tech/docs')} ${chalk.dim('•')} ${terminalLink('🎯 Examples', 'https://www.baraqex.tech/examples')}\n` +
    `${chalk.dim('•')} ${terminalLink('💬 Discord', 'https://discord.gg/baraqex')} ${chalk.dim('•')} ${terminalLink('🐛 Issues', 'https://github.com/mohamedx2/baraqex/issues')}\n\n` +
    `${chalk.bold.blue('💡 Daily Tip:')} ${dailyTip}`,
    {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: 'round',
      borderColor: 'cyan',
      title: '🎯 Baraqex CLI',
      titleAlignment: 'center'
    }
  ));
};

// Enhanced system information gathering
const getSystemInfo = () => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsage = ((usedMem / totalMem) * 100).toFixed(1);
  
  return {
    platform: `${os.platform()} ${os.arch()}`,
    memory: `${(usedMem / 1024 / 1024 / 1024).toFixed(1)}GB / ${(totalMem / 1024 / 1024 / 1024).toFixed(1)}GB (${memUsage}%)`,
    cpu: os.cpus()[0]?.model || 'Unknown',
    cores: os.cpus().length,
    nodeVersion: process.version,
    npmVersion: null // Will be populated by dependency check
  };
};

// Enhanced project statistics with bundle analysis
const getProjectStats = () => {
  try {
    const pkg = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(pkg)) {
      return { isProject: false };
    }
    
    const packageJson = fs.readJsonSync(pkg);
    const isBaraqexProject = packageJson.dependencies?.baraqex || packageJson.devDependencies?.baraqex;
    
    if (!isBaraqexProject) {
      return { isProject: false };
    }
    
    // Enhanced file counting with better patterns
    const componentsCount = countFiles('./src/components', ['.tsx', '.jsx', '.ts', '.js', '.vue']);
    const pagesCount = countFiles('./src/pages', ['.tsx', '.jsx', '.ts', '.js']);
    const apisCount = countFiles('./src/api', ['.tsx', '.jsx', '.ts', '.js']);
    const testsCount = countFiles('./src', ['.test.ts', '.test.js', '.spec.ts', '.spec.js']);
    
    // Bundle size analysis
    const bundleSize = getBundleSize();
    const lastBuild = getLastBuildTime();
    
    return {
      isProject: true,
      name: packageJson.name,
      version: packageJson.version,
      components: componentsCount,
      pages: pagesCount,
      apis: apisCount,
      tests: testsCount,
      bundleSize,
      lastBuild,
      scripts: Object.keys(packageJson.scripts || {}).length,
      dependencies: Object.keys(packageJson.dependencies || {}).length + 
                   Object.keys(packageJson.devDependencies || {}).length
    };
  } catch (error) {
    return { isProject: false };
  }
};

// Enhanced file counting with exclusion patterns
const countFiles = (dir, extensions) => {
  try {
    if (!fs.existsSync(dir)) return 0;
    
    const pattern = `${dir}/**/*.{${extensions.map(ext => ext.replace('.', '')).join(',')}}`;
    const files = glob.sync(pattern, { 
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**'] 
    });
    
    return files.length;
  } catch (error) {
    return 0;
  }
};

// Bundle size analysis
const getBundleSize = () => {
  try {
    const distPath = path.join(process.cwd(), 'dist');
    const buildPath = path.join(process.cwd(), 'build');
    const targetPath = fs.existsSync(distPath) ? distPath : 
                      fs.existsSync(buildPath) ? buildPath : null;
    
    if (!targetPath) return 'No build';
    
    const files = glob.sync(`${targetPath}/**/*`, { nodir: true });
    const totalSize = files.reduce((acc, file) => {
      try {
        return acc + fs.statSync(file).size;
      } catch {
        return acc;
      }
    }, 0);
    
    const sizeInMB = (totalSize / 1024 / 1024).toFixed(1);
    return `${sizeInMB}MB`;
  } catch (error) {
    return 'Unknown';
  }
};

// Last build time
const getLastBuildTime = () => {
  try {
    const distPath = path.join(process.cwd(), 'dist');
    const buildPath = path.join(process.cwd(), 'build');
    const targetPath = fs.existsSync(distPath) ? distPath : 
                      fs.existsSync(buildPath) ? buildPath : null;
    
    if (!targetPath) return 'Never';
    
    const stat = fs.statSync(targetPath);
    const diffMs = Date.now() - stat.mtime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Recently';
  } catch (error) {
    return 'Unknown';
  }
};

// Enhanced dependency checking with version validation
async function checkDependencies() {
  const spinner = ora({
    text: 'Analyzing development environment...',
    spinner: 'dots12',
    color: 'cyan'
  }).start();
  
  try {
    const checks = [];
    const recommendations = [];
    
    // Node.js version check with LTS recommendations
    const nodeVersionOutput = await execAsync('node --version');
    const nodeVersion = nodeVersionOutput.stdout.trim().replace('v', '');
    const requiredNodeVersion = '16.0.0';
    const recommendedNodeVersion = '18.0.0';
    
    if (semver.lt(nodeVersion, requiredNodeVersion)) {
      checks.push({
        name: 'Node.js',
        status: 'error',
        current: nodeVersion,
        required: requiredNodeVersion,
        message: `Node.js ${requiredNodeVersion}+ required`
      });
    } else if (semver.lt(nodeVersion, recommendedNodeVersion)) {
      checks.push({
        name: 'Node.js',
        status: 'warning',
        current: nodeVersion,
        recommended: recommendedNodeVersion,
        message: `Consider upgrading to Node.js ${recommendedNodeVersion}+ (LTS)`
      });
      recommendations.push(`Upgrade Node.js to v${recommendedNodeVersion} for better performance`);
    } else {
      checks.push({
        name: 'Node.js',
        status: 'success',
        current: nodeVersion,
        message: 'Excellent version'
      });
    }
    
    // Package managers check with performance comparison
    const packageManagers = [];
    try {
      const npmVersion = await execAsync('npm --version');
      packageManagers.push({ name: 'npm', version: npmVersion.stdout.trim(), speed: '⭐⭐⭐' });
    } catch (error) {}
    
    try {
      const pnpmVersion = await execAsync('pnpm --version');
      packageManagers.push({ name: 'pnpm', version: pnpmVersion.stdout.trim(), speed: '⭐⭐⭐⭐⭐' });
      recommendations.push('pnpm detected - fastest package manager available!');
    } catch (error) {}
    
    try {
      const yarnVersion = await execAsync('yarn --version');
      packageManagers.push({ name: 'yarn', version: yarnVersion.stdout.trim(), speed: '⭐⭐⭐⭐' });
    } catch (error) {}
    
    if (packageManagers.length > 0) {
      checks.push({
        name: 'Package Managers',
        status: 'info',
        message: packageManagers.map(pm => `${pm.name} v${pm.version} ${pm.speed}`).join(', ')
      });
    }
    
    // Git check with repository analysis
    try {
      await execAsync('git --version');
      checks.push({
        name: 'Git',
        status: 'success',
        message: 'Available'
      });
      
      // Check if in a git repository
      try {
        await execAsync('git rev-parse --git-dir');
        const remoteOutput = await execAsync('git remote -v');
        if (remoteOutput.stdout.includes('github.com')) {
          checks.push({
            name: 'Repository',
            status: 'info',
            message: 'GitHub repository detected'
          });
        }
      } catch (error) {
        recommendations.push('Initialize Git repository for version control');
      }
    } catch (error) {
      checks.push({
        name: 'Git',
        status: 'warning',
        message: 'Not available (recommended for version control)'
      });
      recommendations.push('Install Git for version control');
    }
    
    // VS Code check
    try {
      await execAsync('code --version');
      checks.push({
        name: 'VS Code',
        status: 'success',
        message: 'Available (recommended editor)'
      });
    } catch (error) {
      recommendations.push('Install VS Code for the best development experience');
    }
    
    // Docker check (for deployment)
    try {
      await execAsync('docker --version');
      checks.push({
        name: 'Docker',
        status: 'success',
        message: 'Available (great for deployment)'
      });
    } catch (error) {}
    
    const hasErrors = checks.some(check => check.status === 'error');
    const hasWarnings = checks.some(check => check.status === 'warning');
    
    if (hasErrors) {
      spinner.fail('Environment has critical issues');
    } else if (hasWarnings) {
      spinner.warn('Environment ready with recommendations');
    } else {
      spinner.succeed('Environment optimally configured');
    }
    
    // Display detailed results
    console.log('\n' + boxen(
      checks.map(check => {
        const icon = {
          success: '✅',
          warning: '⚠️',
          error: '❌',
          info: 'ℹ️'
        }[check.status];
        
        return `${icon} ${chalk.bold(check.name)}: ${check.message}` +
               (check.current ? ` ${chalk.dim(`(v${check.current})`)}` : '');
      }).join('\n') +
      (recommendations.length > 0 ? '\n\n' + chalk.bold.yellow('💡 Recommendations:\n') +
       recommendations.map(rec => `• ${rec}`).join('\n') : ''),
      {
        title: 'Environment Analysis',
        padding: 1,
        borderColor: hasErrors ? 'red' : hasWarnings ? 'yellow' : 'green'
      }
    ));
    
    return !hasErrors;
  } catch (error) {
    spinner.fail('Environment check failed');
    console.log(chalk.red('Error: Could not verify environment requirements.'));
    return false;
  }
}

// Enhanced template selection with live previews
async function chooseTemplate() {
  const templatesPath = path.join(__dirname, '..', 'templates');
  const templates = fs.readdirSync(templatesPath).filter(file =>
    fs.statSync(path.join(templatesPath, file)).isDirectory()
  );
  
  const templateData = {
    'basic-app': {
      icon: '🚀',
      name: 'Basic App',
      description: 'Perfect for learning and simple applications',
      features: ['Client-side rendering', 'React hooks', 'Tailwind CSS', 'Hot reload', 'TypeScript support'],
      buildTime: '~30s',
      complexity: 'Beginner',
      useCase: 'Learning, prototypes, simple apps',
      bundleSize: '~150KB',
      performance: '⭐⭐⭐⭐',
      seo: '⭐⭐',
      tags: ['SPA', 'React', 'Beginner'],
      preview: 'https://basic-app.baraqex.tech'
    },
    'ssr-template': {
      icon: '🌐',
      name: 'SSR Template',
      description: 'Server-side rendering with excellent SEO',
      features: ['SSR + Hydration', 'SEO optimized', 'Fast initial load', 'Dynamic routes', 'Meta management'],
      buildTime: '~45s',
      complexity: 'Intermediate',
      useCase: 'Marketing sites, blogs, e-commerce',
      bundleSize: '~200KB',
      performance: '⭐⭐⭐⭐⭐',
      seo: '⭐⭐⭐⭐⭐',
      tags: ['SSR', 'SEO', 'Production'],
      preview: 'https://ssr.baraqex.tech'
    },
    'fullstack-app': {
      icon: '⚡',
      name: 'Fullstack App',
      description: 'Complete solution with backend integration',
      features: ['API routes', 'Database ORM', 'Authentication', 'File uploads', 'Real-time features'],
      buildTime: '~60s',
      complexity: 'Advanced',
      useCase: 'Production apps, dashboards, SaaS',
      bundleSize: '~300KB',
      performance: '⭐⭐⭐⭐',
      seo: '⭐⭐⭐⭐',
      tags: ['Fullstack', 'Database', 'Auth'],
      preview: 'https://fullstack.baraqex.tech'
    },
    'go-wasm-app': {
      icon: '🔄',
      name: 'Go WASM App',
      description: 'High-performance computing with WebAssembly',
      features: ['Go + WASM', 'Performance critical', 'Cross-platform', 'Advanced builds', 'Native speed'],
      buildTime: '~90s',
      complexity: 'Expert',
      useCase: 'Scientific computing, games, tools',
      bundleSize: '~500KB',
      performance: '⭐⭐⭐⭐⭐',
      seo: '⭐⭐',
      tags: ['WASM', 'Performance', 'Go'],
      preview: 'https://wasm.baraqex.tech'
    },
    'pwa-app': {
      icon: '📱',
      name: 'PWA App',
      description: 'Progressive Web App with offline capabilities',
      features: ['Service workers', 'Offline support', 'Push notifications', 'App-like experience'],
      buildTime: '~50s',
      complexity: 'Intermediate',
      useCase: 'Mobile-first apps, offline apps',
      bundleSize: '~250KB',
      performance: '⭐⭐⭐⭐⭐',
      seo: '⭐⭐⭐⭐',
      tags: ['PWA', 'Mobile', 'Offline'],
      preview: 'https://pwa.baraqex.tech'
    }
  };
  
  console.log(boxen(
    `${chalk.bold.cyan('🎯 Choose Your Project Template')}\n\n` +
    `${chalk.dim('💡 Each template is production-ready and includes best practices')}\n\n` +
    templates.map(template => {
      const data = templateData[template] || {
        icon: '📦',
        name: template,
        description: 'Custom template',
        features: ['Basic functionality'],
        complexity: 'Unknown',
        tags: ['Custom']
      };
      
      return `${data.icon} ${chalk.bold.cyan(data.name)} ${chalk.dim(data.tags?.map(t => `#${t}`).join(' '))}\n` +
             `   ${chalk.dim(data.description)}\n` +
             `   ${chalk.yellow('Performance:')} ${data.performance} ${chalk.yellow('SEO:')} ${data.seo} ${chalk.yellow('Bundle:')} ${data.bundleSize}\n` +
             `   ${chalk.yellow('Best for:')} ${data.useCase}`;
    }).join('\n\n'),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
      title: '📋 Template Selection'
    }
  ));
  
  const { template } = await inquirer.prompt([
    {
      type: 'list',
      name: 'template',
      message: chalk.green('🎯 Select your project template:'),
      choices: templates.map(template => {
        const data = templateData[template] || { icon: '📦', name: template, complexity: 'Unknown' };
        return {
          name: `${data.icon} ${chalk.bold(data.name)} ${chalk.dim(`(${data.complexity})`)}`,
          value: template,
          short: template
        };
      }),
      pageSize: 10
    }
  ]);
  
  const selectedData = templateData[template];
  if (selectedData) {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: '🚀 Continue with this template', value: 'continue' },
          { name: '👀 View detailed information', value: 'details' },
          { name: '🌐 Open live preview', value: 'preview' },
          { name: '🔄 Choose different template', value: 'back' }
        ]
      }
    ]);
    
    if (action === 'back') {
      return chooseTemplate();
    }
    
    if (action === 'preview' && selectedData.preview) {
      console.log(chalk.cyan(`🌐 Opening preview: ${selectedData.preview}`));
      await open(selectedData.preview);
      
      const { proceed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: 'Continue with this template?',
          default: true
        }
      ]);
      
      if (!proceed) {
        return chooseTemplate();
      }
    }
    
    if (action === 'details') {
      console.log(boxen(
        `${selectedData.icon} ${chalk.bold.cyan(selectedData.name)}\n\n` +
        `${chalk.dim(selectedData.description)}\n\n` +
        `${chalk.yellow('✨ Features:')}\n` +
        selectedData.features.map(f => `  • ${f}`).join('\n') + '\n\n' +
        `${chalk.yellow('📊 Specifications:')}\n` +
        `  • Build Time: ${selectedData.buildTime}\n` +
        `  • Bundle Size: ${selectedData.bundleSize}\n` +
        `  • Performance: ${selectedData.performance}\n` +
        `  • SEO Score: ${selectedData.seo}\n` +
        `  • Complexity: ${selectedData.complexity}\n\n` +
        `${chalk.yellow('🎯 Best For:')} ${selectedData.useCase}\n\n` +
        `${chalk.yellow('🏷️ Tags:')} ${selectedData.tags?.join(', ')}`,
        {
          title: 'Template Details',
          padding: 1,
          borderColor: 'cyan'
        }
      ));
      
      const { proceed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: 'Continue with this template?',
          default: true
        }
      ]);
      
      if (!proceed) {
        return chooseTemplate();
      }
    }
  }
  
  return template;
}

// Enhanced project creation with AI assistance
async function createProject(projectName, options) {
  perfMonitor.checkpoint('project-creation-start');
  displayBanner();
  console.log(chalk.bold.cyan('\n📁 AI-Powered Project Creation Wizard\n'));

  // Enhanced project name validation
  if (!projectName) {
    const { name } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: chalk.green('🎯 What is your project name?'),
        default: `my-awesome-app-${Date.now().toString(36)}`,
        validate: input => {
          if (!/^[a-z0-9-_]+$/.test(input)) {
            return '❌ Project name can only contain lowercase letters, numbers, hyphens, and underscores';
          }
          if (input.length < 3) {
            return '❌ Project name must be at least 3 characters long';
          }
          if (input.length > 50) {
            return '❌ Project name must be less than 50 characters';
          }
          if (fs.existsSync(path.resolve(input))) {
            return '❌ Directory already exists. Choose a different name.';
          }
          return true;
        },
        transformer: input => input.toLowerCase().replace(/[^a-z0-9-_]/g, '-')
      }
    ]);
    projectName = name;
  }

  perfMonitor.checkpoint('dependency-check-start');
  if (!await checkDependencies()) return;
  perfMonitor.checkpoint('dependency-check-end');

  // Enhanced project configuration with AI suggestions
  const config = await inquirer.prompt([
    {
      type: 'list',
      name: 'packageManager',
      message: '📦 Choose your preferred package manager:',
      choices: [
        { 
          name: '📦 npm (Most compatible, 50M+ weekly downloads)', 
          value: 'npm',
          short: 'npm'
        },
        { 
          name: '🚀 pnpm (3x faster, disk efficient, 2M+ weekly downloads)', 
          value: 'pnpm',
          short: 'pnpm'
        },
        { 
          name: '🧶 yarn (Zero-installs, plug\'n\'play, 20M+ weekly downloads)', 
          value: 'yarn',
          short: 'yarn'
        }
      ],
      default: globalConfig.defaultPackageManager
    },
    {
      type: 'confirm',
      name: 'typescript',
      message: '📝 Enable TypeScript? (Recommended for better DX)',
      default: true
    },
    {
      type: 'confirm',
      name: 'initGit',
      message: '🔄 Initialize Git repository?',
      default: true
    },
    {
      type: 'confirm',
      name: 'installDeps',
      message: '⚡ Install dependencies automatically?',
      default: true
    },
    {
      type: 'list',
      name: 'styling',
      message: '🎨 Choose styling solution:',
      choices: [
        { name: '🎨 Tailwind CSS (Utility-first)', value: 'tailwind' },
        { name: '💅 Styled Components (CSS-in-JS)', value: 'styled-components' },
        { name: '📦 CSS Modules (Scoped CSS)', value: 'css-modules' },
        { name: '⚡ Vanilla CSS (No framework)', value: 'vanilla' }
      ],
      default: 'tailwind'
    },
    {
      type: 'checkbox',
      name: 'features',
      message: '✨ Select additional features:',
      choices: [
        { name: '🔧 ESLint + Prettier (Code quality)', value: 'linting', checked: true },
        { name: '🧪 Jest + Testing Library (Testing)', value: 'testing', checked: true },
        { name: '📱 PWA Support (Offline-first)', value: 'pwa' },
        { name: '🌐 Internationalization (i18n)', value: 'i18n' },
        { name: '📊 Bundle Analyzer (Performance)', value: 'analyzer' },
        { name: '🐳 Docker Setup (Containerization)', value: 'docker' },
        { name: '🚀 GitHub Actions (CI/CD)', value: 'github-actions' },
        { name: '📈 Analytics (Usage tracking)', value: 'analytics' }
      ]
    }
  ]);

  let template = options.template || await chooseTemplate();
  perfMonitor.checkpoint('template-selection-end');

  const targetDir = path.resolve(projectName);
  const templateDir = path.join(__dirname, '..', 'templates', template);

  // Enhanced directory handling
  if (fs.existsSync(targetDir)) {
    const stat = fs.statSync(targetDir);
    const isEmpty = stat.isDirectory() && fs.readdirSync(targetDir).length === 0;
    
    if (!isEmpty) {
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: chalk.yellow(`⚠️ Directory ${projectName} already exists and is not empty. What would you like to do?`),
          choices: [
            { name: '🗑️ Remove and recreate (destructive)', value: 'overwrite' },
            { name: '📁 Merge with existing content', value: 'merge' },
            { name: '📝 Create with different name', value: 'rename' },
            { name: '❌ Cancel operation', value: 'cancel' }
          ]
        }
      ]);
      
      if (action === 'cancel') {
        console.log(chalk.red('✖ Operation cancelled by user'));
        return;
      }
      
      if (action === 'rename') {
        return createProject(null, options);
      }
      
      if (action === 'overwrite') {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: chalk.red('⚠️ This will permanently delete all existing files. Are you sure?'),
            default: false
          }
        ]);
        
        if (!confirm) {
          console.log(chalk.yellow('✖ Operation cancelled'));
          return;
        }
        
        await fs.remove(targetDir);
      }
    }
  }

  // Multi-step creation with detailed progress and time estimates
  const steps = [
    { name: 'Creating project structure', action: () => createProjectStructure(targetDir), estimate: '2s' },
    { name: 'Copying template files', action: () => copyTemplateFiles(templateDir, targetDir), estimate: '3s' },
    { name: 'Configuring package.json', action: () => configurePackageJson(targetDir, projectName, config), estimate: '1s' },
    { name: 'Setting up project configuration', action: () => setupAdvancedConfig(targetDir, config), estimate: '2s' }
  ];
  
  if (config.initGit) {
    steps.push({ 
      name: 'Initializing Git repository', 
      action: () => initGitRepo(targetDir), 
      estimate: '2s' 
    });
  }
  
  if (config.installDeps) {
    const estimatedTime = config.packageManager === 'pnpm' ? '30s' : 
                         config.packageManager === 'yarn' ? '45s' : '60s';
    steps.push({ 
      name: `Installing dependencies with ${config.packageManager}`, 
      action: () => installDependencies(targetDir, config.packageManager), 
      estimate: estimatedTime 
    });
  }
  
  // Add additional feature setup steps
  if (config.features.includes('docker')) {
    steps.push({ 
      name: 'Setting up Docker configuration', 
      action: () => setupDocker(targetDir), 
      estimate: '3s' 
    });
  }
  
  if (config.features.includes('github-actions')) {
    steps.push({ 
      name: 'Configuring GitHub Actions', 
      action: () => setupGithubActions(targetDir), 
      estimate: '2s' 
    });
  }

  console.log(chalk.cyan(`\n🚀 Creating project with ${steps.length} steps...\n`));

  for (const [index, step] of steps.entries()) {
    const spinner = ora({
      text: `${step.name} (${index + 1}/${steps.length}) - Est. ${step.estimate}`,
      color: 'cyan'
    }).start();
    
    const stepStart = performance.now();
    
    try {
      await step.action();
      const stepTime = ((performance.now() - stepStart) / 1000).toFixed(1);
      spinner.succeed(`${step.name} ${chalk.dim(`(${stepTime}s)`)}`);
    } catch (error) {
      spinner.fail(`${step.name} failed`);
      console.error(chalk.red(`❌ Error: ${error.message}`));
      
      // Offer to continue or abort
      const { continueOnError } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continueOnError',
          message: 'Continue with remaining steps?',
          default: true
        }
      ]);
      
      if (!continueOnError) {
        console.log(chalk.red('✖ Project creation aborted'));
        return;
      }
    }
  }

  perfMonitor.checkpoint('project-creation-end');

  // Enhanced success message with personalized next steps
  const nextSteps = generateNextSteps(projectName, config);
  const projectStats = analyzeProject(targetDir);

  console.log('\n' + boxen(
    `${chalk.bold.green('🎉 Project created successfully!')}\n\n` +
    `${chalk.bold('📁 Project:')} ${chalk.cyan(projectName)}\n` +
    `${chalk.bold('📋 Template:')} ${chalk.cyan(template)}\n` +
    `${chalk.bold('📍 Location:')} ${chalk.cyan(targetDir)}\n` +
    `${chalk.bold('📦 Package Manager:')} ${chalk.cyan(config.packageManager)}\n` +
    `${chalk.bold('📊 Files Created:')} ${chalk.cyan(projectStats.files)}\n` +
    `${chalk.bold('💾 Project Size:')} ${chalk.cyan(projectStats.size)}\n\n` +
    `${chalk.bold.yellow('🚀 Next Steps:')}\n\n` +
    nextSteps.map((step, i) => `  ${chalk.cyan((i+1) + '.')} ${step}`).join('\n') + '\n\n' +
    `${chalk.bold.magenta('🎯 Quick Commands:')}\n` +
    `• ${chalk.cyan('baraqex dev')} - Start development server\n` +
    `• ${chalk.cyan('baraqex build')} - Build for production\n` +
    `• ${chalk.cyan('baraqex doctor')} - Check project health\n` +
    `• ${chalk.cyan('baraqex add:component Button')} - Add components\n\n` +
    `${chalk.bold.blue('📚 Resources:')}\n` +
    `• ${terminalLink('📖 Documentation', 'https://www.baraqex.tech/docs')}\n` +
    `• ${terminalLink('🎯 Examples', 'https://www.baraqex.tech/examples')}\n` +
    `• ${terminalLink('💬 Discord Community', 'https://discord.gg/baraqex')}\n` +
    `• ${terminalLink('🐛 Report Issues', 'https://github.com/mohamedx2/baraqex/issues')}`,
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'green',
      title: '✨ Success!'
    }
  ));
  
  // Performance report
  if (globalConfig.analytics) {
    perfMonitor.report();
  }
  
  // Offer additional actions
  const { finalAction } = await inquirer.prompt([
    {
      type: 'list',
      name: 'finalAction',
      message: 'What would you like to do next?',
      choices: [
        { name: '🚀 Start development server', value: 'dev' },
        { name: '💻 Open in VS Code', value: 'vscode' },
        { name: '🌐 Open in browser', value: 'browser' },
        { name: '📋 View project structure', value: 'structure' },
        { name: '✨ That\'s it for now', value: 'done' }
      ]
    }
  ]);
  
  switch (finalAction) {
    case 'dev':
      console.log(chalk.cyan('\n🚀 Starting development server...\n'));
      await startDevServer({ port: '3000' }, targetDir);
      break;
    case 'vscode':
      try {
        await execAsync(`code "${targetDir}"`);
        console.log(chalk.green('✓ Opened in VS Code'));
      } catch (error) {
        console.log(chalk.yellow('⚠️ Could not open VS Code. Make sure it\'s installed and in your PATH.'));
      }
      break;
    case 'browser':
      console.log(chalk.cyan('🌐 Opening project documentation...'));
      await open('https://www.baraqex.tech/docs/getting-started');
      break;
    case 'structure':
      await showProjectStructure(targetDir);
      break;
  }
}

// ...rest of the implementation with enhanced features...

// Helper functions for enhanced project creation
async function createProjectStructure(targetDir) {
  await fs.ensureDir(targetDir);
  
  // Create standard project structure
  const dirs = [
    'src',
    'src/components',
    'src/pages',
    'src/hooks',
    'src/utils',
    'src/styles',
    'public',
    'tests'
  ];
  
  for (const dir of dirs) {
    await fs.ensureDir(path.join(targetDir, dir));
  }
}

async function copyTemplateFiles(templateDir, targetDir) {
  if (!fs.existsSync(templateDir)) {
    throw new Error(`Template directory not found: ${templateDir}`);
  }
  
  await fs.copy(templateDir, targetDir, { 
    overwrite: true,
    filter: (src) => {
      // Skip node_modules and other build artifacts
      return !src.includes('node_modules') && 
             !src.includes('.git') && 
             !src.includes('dist') &&
             !src.includes('build');
    }
  });
}

async function configurePackageJson(targetDir, projectName, config) {
  const pkgJsonPath = path.join(targetDir, 'package.json');
  
  if (fs.existsSync(pkgJsonPath)) {
    const pkgJson = await fs.readJson(pkgJsonPath);
    
    // Update package.json with user preferences
    pkgJson.name = projectName;
    pkgJson.version = '0.1.0';
    pkgJson.private = true;
    pkgJson.description = `A modern web application built with Baraqex`;
    pkgJson.keywords = ['baraqex', 'react', 'typescript', 'frontend'];
    pkgJson.author = os.userInfo().username;
    
    // Add scripts based on configuration
    pkgJson.scripts = {
      ...pkgJson.scripts,
      'dev': 'baraqex dev',
      'build': 'baraqex build',
      'start': 'baraqex start',
      'test': config.features.includes('testing') ? 'jest' : 'echo "No tests specified"',
      'lint': config.features.includes('linting') ? 'eslint src --ext .ts,.tsx,.js,.jsx' : 'echo "No linting configured"',
      'format': config.features.includes('linting') ? 'prettier --write src/**/*.{ts,tsx,js,jsx,json,css,md}' : 'echo "No formatting configured"'
    };
    
    // Add dependencies based on features
    if (config.features.includes('testing')) {
      pkgJson.devDependencies = {
        ...pkgJson.devDependencies,
        'jest': '^29.0.0',
        '@testing-library/react': '^13.0.0',
        '@testing-library/jest-dom': '^5.0.0'
      };
    }
    
    if (config.features.includes('linting')) {
      pkgJson.devDependencies = {
        ...pkgJson.devDependencies,
        'eslint': '^8.0.0',
        'prettier': '^2.0.0',
        '@typescript-eslint/eslint-plugin': '^5.0.0',
        '@typescript-eslint/parser': '^5.0.0'
      };
    }
    
    await fs.writeJson(pkgJsonPath, pkgJson, { spaces: 2 });
  }
}

async function setupAdvancedConfig(targetDir, config) {
  // Create baraqex.config.js
  const configContent = generateBaraqexConfig(config);
  await fs.writeFile(path.join(targetDir, 'baraqex.config.js'), configContent);
  
  // Create additional config files based on features
  if (config.features.includes('linting')) {
    await createEslintConfig(targetDir, config);
    await createPrettierConfig(targetDir);
  }
  
  if (config.features.includes('testing')) {
    await createJestConfig(targetDir, config);
  }
  
  if (config.typescript) {
    await createTsConfig(targetDir);
  }
}

function generateBaraqexConfig(config) {
  return `export default {
  // Baraqex Configuration
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'development',
    minify: process.env.NODE_ENV === 'production',
    target: 'es2020'
  },
  
  dev: {
    port: 3000,
    host: 'localhost',
    open: true,
    hot: true
  },
  
  ssr: {
    enabled: ${config.template === 'ssr-template'},
    prerender: true
  },
  
  styling: {
    solution: '${config.styling}',
    autoprefixer: true,
    purgeCSS: process.env.NODE_ENV === 'production'
  },
  
  features: {
    pwa: ${config.features.includes('pwa')},
    i18n: ${config.features.includes('i18n')},
    analytics: ${config.features.includes('analytics')}
  },
  
  optimization: {
    bundleAnalyzer: ${config.features.includes('analyzer')},
    splitChunks: true,
    treeshaking: true
  }
};`;
}

async function generateNextSteps(projectName, config) {
  const steps = [
    `cd ${projectName}`,
    !config.installDeps ? `${config.packageManager} install` : null,
    `${config.packageManager} run dev`
  ].filter(Boolean);
  
  // Add conditional steps based on configuration
  if (config.features.includes('testing')) {
    steps.push(`${config.packageManager} run test # Run your tests`);
  }
  
  if (config.features.includes('docker')) {
    steps.push('docker build -t ' + projectName + ' . # Build Docker image');
  }
  
  return steps;
}

function analyzeProject(targetDir) {
  try {
    const files = glob.sync(`${targetDir}/**/*`, { nodir: true });
    const totalSize = files.reduce((acc, file) => {
      try {
        return acc + fs.statSync(file).size;
      } catch {
        return acc;
      }
    }, 0);
    
    return {
      files: files.length,
      size: `${(totalSize / 1024).toFixed(1)}KB`
    };
  } catch (error) {
    return { files: 'Unknown', size: 'Unknown' };
  }
}

// ...continuing with more helper functions and remaining CLI commands...

program
  .name('baraqex')
  .description('🚀 Next-generation CLI for Baraqex - AI-Powered Full-Stack Framework')
  .version(packageInfo.version || '1.0.0')
  .option('--verbose', 'Enable verbose logging')
  .option('--no-analytics', 'Disable analytics and telemetry')
  .hook('preAction', (thisCommand) => {
    if (thisCommand.opts().verbose) {
      process.env.BARAQEX_VERBOSE = 'true';
    }
    if (thisCommand.opts().noAnalytics) {
      globalConfig.analytics = false;
    }
  });

// Enhanced create command
program
  .command('create [name]')
  .description('🎯 Create a new Baraqex project with AI-powered setup')
  .option('-t, --template <template>', 'Template: basic-app, ssr-template, fullstack-app, go-wasm-app, pwa-app')
  .option('--npm', 'Use npm package manager')
  .option('--yarn', 'Use yarn package manager') 
  .option('--pnpm', 'Use pnpm package manager')
  .option('--typescript', 'Enable TypeScript')
  .option('--no-typescript', 'Disable TypeScript')
  .option('--no-install', 'Skip dependency installation')
  .option('--no-git', 'Skip git repository initialization')
  .option('--styling <solution>', 'Styling solution: tailwind, styled-components, css-modules, vanilla')
  .option('--features <features>', 'Comma-separated features: linting,testing,pwa,i18n,analyzer,docker,github-actions,analytics')
  .action(createProject);

// Default command when no arguments - show enhanced dashboard
if (process.argv.length <= 2) {
  displayBanner();
} else {
  program.parse(process.argv);
}