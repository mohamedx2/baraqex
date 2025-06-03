import { render, useState } from '../dist/index.js';

// Test the re-exported functionality
console.log('Testing baraqex package...');
console.log('render function:', typeof render);
console.log('useState function:', typeof useState);

// Verify the exports are available
if (render && useState) {
  console.log('✅ Successfully re-exported frontend-hamroun functionality!');
} else {
  console.log('❌ Re-export failed');
}
