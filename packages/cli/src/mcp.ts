#!/usr/bin/env node

import { mcpServeCommand } from './commands/mcp-serve.js';

mcpServeCommand().catch((err) => {
  console.error('[orbit-mcp] Fatal error:', err);
  process.exit(1);
});
