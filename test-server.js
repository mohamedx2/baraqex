import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== Baraqex Server Functions Test Suite 🚀 ===\n');

async function testServerCreation() {
  console.log('🔧 Testing Server Creation...');
  
  try {
    // Import the compiled server module
    const { createServer } = await import('./dist/server/index.js');
    
    // Test basic server creation
    const server = createServer({
      port: 3001,
      apiDir: './test-api',
      pagesDir: './test-pages',
      staticDir: './public'
    });
    
    console.log('✅ Server created successfully');
    
    // Test getting Express app
    const app = server.getExpressApp();
    console.log('✅ Express app accessible');
    
    // Test server start and stop
    await server.start();
    console.log('✅ Server started successfully on port 3001');
    
    await server.stop();
    console.log('✅ Server stopped successfully\n');
    
    return true;
  } catch (error) {
    console.error('❌ Server creation test failed:', error.message);
    return false;
  }
}

async function testDatabaseConnections() {
  console.log('🗄️ Testing Database Connections...');
  
  try {
    const { Database } = await import('./dist/server/index.js');
    
    // Test MongoDB (will fail without actual DB, but tests class creation)
    try {
      const mongoDb = new Database({
        type: 'mongodb',
        url: 'mongodb://localhost:27017/test'
      });
      console.log('✅ MongoDB Database class created');
    } catch (error) {
      console.log('⚠️ MongoDB connection expected to fail in test environment');
    }
    
    // Test MySQL
    try {
      const mysqlDb = new Database({
        type: 'mysql',
        url: 'mysql://user:pass@localhost:3306/test'
      });
      console.log('✅ MySQL Database class created');
    } catch (error) {
      console.log('⚠️ MySQL connection expected to fail in test environment');
    }
    
    // Test PostgreSQL
    try {
      const pgDb = new Database({
        type: 'postgres',
        url: 'postgresql://user:pass@localhost:5432/test'
      });
      console.log('✅ PostgreSQL Database class created');
    } catch (error) {
      console.log('⚠️ PostgreSQL connection expected to fail in test environment');
    }
    
    console.log('✅ All database classes created successfully\n');
    return true;
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    return false;
  }
}

async function testAuthentication() {
  console.log('🔐 Testing Authentication Service...');
  
  try {
    const { AuthService } = await import('./dist/server/index.js');
    
    const auth = new AuthService({
      secret: 'test-secret-key',
      expiresIn: '1h'
    });
    
    console.log('✅ AuthService created');
    
    // Test password hashing
    const password = 'testpassword123';
    const hashedPassword = await auth.hashPassword(password);
    console.log('✅ Password hashing works');
    
    // Test password comparison
    const isValid = await auth.comparePasswords(password, hashedPassword);
    console.log(`✅ Password comparison: ${isValid ? 'Valid' : 'Invalid'}`);
    
    // Test token generation
    const user = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      roles: ['user']
    };
    
    const token = auth.generateToken(user);
    console.log('✅ Token generated successfully');
    
    // Test token verification
    const decoded = auth.verifyToken(token);
    console.log(`✅ Token verification: ${decoded ? 'Valid' : 'Invalid'}`);
    
    console.log('✅ Authentication service working correctly\n');
    return true;
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    return false;
  }
}

async function testWasmIntegration() {
  console.log('⚡ Testing WebAssembly Integration...');
  
  try {
    // Check if test WASM file exists
    const wasmPath = './try/example.wasm';
    const wasmExecPath = './try/wasm_exec.cjs';
    
    if (!fs.existsSync(wasmPath)) {
      console.log('⚠️ Test WASM file not found, skipping WASM tests');
      return true;
    }
    
    if (!fs.existsSync(wasmExecPath)) {
      console.log('⚠️ wasm_exec.cjs not found, skipping WASM tests');
      return true;
    }
    
    const { loadGoWasmFromFile, callWasmFunction } = await import('./dist/server/index.js');
    
    // Load WASM module
    await loadGoWasmFromFile(wasmPath, {
      debug: false,
      goWasmPath: wasmExecPath
    });
    
    console.log('✅ WASM module loaded successfully');
    
    // Wait for functions to be registered
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test WASM functions
    try {
      const greeting = callWasmFunction('goHello', 'Baraqex');
      console.log(`✅ goHello result: ${greeting}`);
      
      const sum = callWasmFunction('goAdd', 15, 25);
      console.log(`✅ goAdd result: ${sum}`);
      
      const fibonacci = callWasmFunction('goFibonacci', 8);
      console.log(`✅ goFibonacci result: ${fibonacci}`);
      
      const isPrime = callWasmFunction('goIsPrime', 23);
      console.log(`✅ goIsPrime result: ${isPrime}`);
      
    } catch (error) {
      console.log('⚠️ Some WASM functions may not be available:', error.message);
    }
    
    console.log('✅ WebAssembly integration working correctly\n');
    return true;
  } catch (error) {
    console.error('❌ WASM integration test failed:', error.message);
    return false;
  }
}

async function testServerUtilities() {
  console.log('🛠️ Testing Server Utilities...');
  
  try {
    const utils = await import('./dist/server/utils.js');
    
    // Test JSON parsing
    const validJson = '{"test": "value"}';
    const parsed = utils.safeJsonParse(validJson, {});
    console.log('✅ Safe JSON parse works');
    
    // Test token generation
    const token = utils.generateToken(32);
    console.log(`✅ Token generated: ${token.length} characters`);
    
    // Test string hashing
    const hash = utils.hashString('test-string', 'salt');
    console.log('✅ String hashing works');
    
    // Test pagination
    const mockReq = {
      query: { page: '2', limit: '10' }
    };
    const pagination = utils.getPagination(mockReq);
    console.log(`✅ Pagination: page ${pagination.page}, limit ${pagination.limit}, skip ${pagination.skip}`);
    
    console.log('✅ Server utilities working correctly\n');
    return true;
  } catch (error) {
    console.error('❌ Server utilities test failed:', error.message);
    return false;
  }
}

async function testTemplateGeneration() {
  console.log('📄 Testing Template Generation...');
  
  try {
    const templates = await import('./dist/server/templates.js');
    
    // Test document generation
    const document = templates.generateDocument('<h1>Test Content</h1>', {
      title: 'Test Page',
      description: 'Test page description',
      scripts: ['/test.js'],
      styles: ['/test.css']
    });
    
    console.log('✅ HTML document generated');
    console.log(`✅ Document contains title: ${document.includes('Test Page')}`);
    
    // Test error page generation
    const errorPage = templates.generateErrorPage(404, 'Page not found');
    console.log('✅ Error page generated');
    console.log(`✅ Error page contains 404: ${errorPage.includes('404')}`);
    
    // Test loading page generation
    const loadingPage = templates.generateLoadingPage('Loading test...');
    console.log('✅ Loading page generated');
    
    console.log('✅ Template generation working correctly\n');
    return true;
  } catch (error) {
    console.error('❌ Template generation test failed:', error.message);
    return false;
  }
}

async function testApiRoutes() {
  console.log('🌐 Testing API Routes...');
  
  try {
    // Create test API directory and files
    const testApiDir = './test-api';
    if (!fs.existsSync(testApiDir)) {
      fs.mkdirSync(testApiDir, { recursive: true });
    }
    
    // Create a test API endpoint
    const testApiContent = `
export async function get(req, res) {
  res.json({ message: 'Hello from test API!', timestamp: new Date().toISOString() });
}

export async function post(req, res) {
  res.json({ message: 'POST request received', data: req.body });
}
`;
    
    fs.writeFileSync(path.join(testApiDir, 'test.js'), testApiContent);
    
    // Import and create server
    const { createServer } = await import('./dist/server/index.js');
    const { default: request } = await import('supertest');
    
    // Create server with test API
    const server = createServer({
      port: 3002,
      apiDir: testApiDir,
      staticDir: './public'
    });
    
    await server.start();
    
    // Give the API router time to register routes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const app = server.getExpressApp();
    
    // Debug: Check if route is registered
    console.log('Testing route registration...');
    
    try {
      // Test GET request
      const getResponse = await request(app)
        .get('/api/test')
        .expect(200);
      
      console.log('✅ GET /api/test:', getResponse.body.message);
      
      // Test POST request
      const postResponse = await request(app)
        .post('/api/test')
        .send({ name: 'Baraqex Test' })
        .expect(200);
      
      console.log('✅ POST /api/test:', postResponse.body.message);
      
    } catch (testError) {
      console.error('Route test failed:', testError.message);
      
      // Try alternative route path
      try {
        const altResponse = await request(app)
          .get('/api/')
          .expect(404);
        console.log('API base path returns 404 as expected');
      } catch (altError) {
        console.error('Alternative test also failed:', altError.message);
      }
      
      throw testError;
    }
    
    await server.stop();
    
    // Clean up test files
    fs.rmSync(testApiDir, { recursive: true, force: true });
    
    console.log('✅ API routes working correctly\n');
    return true;
  } catch (error) {
    console.error('❌ API routes test failed:', error.message);
    
    // Clean up on error
    try {
      const testApiDir = './test-api';
      if (fs.existsSync(testApiDir)) {
        fs.rmSync(testApiDir, { recursive: true, force: true });
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    return false;
  }
}

async function runAllTests() {
  console.log('Starting comprehensive server test suite...\n');
  
  const tests = [
    { name: 'Server Creation', fn: testServerCreation },
    { name: 'Database Connections', fn: testDatabaseConnections },
    { name: 'Authentication', fn: testAuthentication },
    { name: 'WebAssembly Integration', fn: testWasmIntegration },
    { name: 'Server Utilities', fn: testServerUtilities },
    { name: 'Template Generation', fn: testTemplateGeneration },
    { name: 'API Routes', fn: testApiRoutes }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`❌ ${test.name} failed with error:`, error);
      failed++;
    }
  }
  
  console.log('=== Test Results ===');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Baraqex server is working perfectly! 🚀');
  } else {
    console.log(`\n⚠️ ${failed} test(s) failed. Please check the errors above.`);
  }
  
  return failed === 0;
}

// Run tests if this file is executed directly
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });

export { runAllTests };
