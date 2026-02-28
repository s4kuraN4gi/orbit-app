#!/usr/bin/env node

import { startMcpServer } from './server.js';

startMcpServer().catch((err) => {
  console.error('[orbit-mcp] Fatal error:', err);
  process.exit(1);
});
