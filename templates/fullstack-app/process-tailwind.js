// Process Tailwind CSS (ESM version)
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Process function
async function processTailwind() {
  console.log('Processing Tailwind CSS...');
  
  try {
    // Paths
    const inputPath = resolve(__dirname, 'public/tailwind.css');
    const outputPath = resolve(__dirname, 'public/styles.css');
    
    // Read the input file
    const css = fs.readFileSync(inputPath, 'utf8');
    
    // Process with PostCSS
    const result = await postcss([
      tailwindcss,
      autoprefixer
    ]).process(css, {
      from: inputPath,
      to: outputPath
    });
    
    // Write the output
    fs.writeFileSync(outputPath, result.css);
    
    console.log('Tailwind CSS processed successfully!');
  } catch (error) {
    console.error('Error processing Tailwind CSS:', error);
    process.exit(1);
  }
}

// Run the processor
processTailwind();