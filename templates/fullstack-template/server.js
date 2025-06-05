import { createDevServer } from 'baraqex/server';

const server = createDevServer({
  port: 3000,
  enableCors: true
});

// Enable SSR with hydration
server.enableSSR({ hydratable: true });

// Start the server
server.start().then(() => {
  console.log('Full-stack server started!');
  console.log('Visit http://localhost:3000');
  console.log('API available at http://localhost:3000/api');
});
