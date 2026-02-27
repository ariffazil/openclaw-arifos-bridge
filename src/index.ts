/**
 * openclaw-arifos-bridge
 * 
 * Integration layer between OpenClaw gateway and arifOS constitutional kernel.
 * 
 * EXPORTS:
 * - MCP Client: mcpInitialize, apexJudge, anchorSession, listTools
 * - Tools: arifOSJudgeTool
 * - Adapters: routeToMCP
 * 
 * PROTOCOL: MCP JSON-RPC over HTTP to arifOS /mcp
 * BOUNDARY: No constitutional logic. All governance in arifOS.
 */

// MCP Client (primary interface)
export {
  mcpInitialize,
  apexJudge,
  anchorSession,
  listTools,
  mcpCall,
  type ApexJudgeParams,
  type ApexJudgeResult,
} from './mcp-client.js';

// Tools (OpenClaw-facing)
export { arifOSJudgeTool, type ArifOSJudgeInput } from './tools/arifos-judge-tool.js';

// Adapters
export { routeToMCP, type MCPToolCall } from './adapters/message-to-mcp.js';

// Version
export const VERSION = '1.0.0';
export const ARIFOS_BRIDGE_SPEC = '2026.02.27';
export const PROTOCOL = 'MCP-2025-11-25';
