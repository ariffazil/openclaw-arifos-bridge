/**
 * openclaw-arifos-bridge
 * 
 * Integration layer between OpenClaw gateway and arifOS constitutional kernel.
 * 
 * EXPORTS:
 * - Tools: arifOSJudgeTool (wraps apex_judge)
 * - Adapters: routeToMCP (message routing)
 * 
 * BOUNDARY:
 * This module contains ONLY adapter/glue code.
 * Constitutional logic lives in arifOS.
 */

// Tools
export { arifOSJudgeTool } from './tools/arifos-judge-tool.js';

// Adapters
export { routeToMCP, type MCPToolCall } from './adapters/message-to-mcp.js';

// Version
export const VERSION = '1.0.0';
export const ARIFOS_BRIDGE_SPEC = '2026.02.27';
