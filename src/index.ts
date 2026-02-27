/**
 * arifOS Bridge Extension for OpenClaw
 * 
 * ⚠️  TEMPORARY REST SHIM — Migration Path Only
 * 
 * Current: OpenClaw → REST POST /tools/{name} → arifOS
 * Target:  OpenClaw → MCP JSON-RPC/SSE → arifOS
 * 
 * This implementation uses REST as a short-lived migration path to verify
 * operator flow end-to-end. The canonical boundary should be MCP-native.
 * 
 * TODO: Return to MCP-native bridge once operator flow is proven.
 * Issue: MCP session management complexity in Docker networking context.
 * 
 * DITEMPA BUKAN DIBERI
 */

import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";

// TEMPORARY: REST endpoint for migration verification
// Canonical target: http://10.0.0.3:8088/mcp (MCP-native)
const ARIFOS_REST_ENDPOINT = process.env.ARIFOS_REST_ENDPOINT || "http://10.0.0.3:8080";

// Canonical MCP endpoint (for future migration back)
const ARIFOS_MCP_ENDPOINT = process.env.ARIFOS_MCP_ENDPOINT || "http://10.0.0.3:8088/mcp";

interface ArifOSJudgeResult {
  verdict: "SEAL" | "VOID" | "PARTIAL" | "SABAR" | "888_HOLD" | string;
  stage?: string;
  reason?: string;
  confidence?: number;
  error?: string;
}

/**
 * TEMPORARY REST implementation for migration verification.
 * 
 * TODO: Replace with MCP-native call once session handling is resolved.
 * See: arifos_aaa_mcp/server.py for canonical MCP interface.
 */
async function apexJudgeREST(
  query: string,
  sessionId: string,
  actorId: string
): Promise<ArifOSJudgeResult> {
  const response = await fetch(`${ARIFOS_REST_ENDPOINT}/tools/apex_judge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      session_id: sessionId,
      actor_id: actorId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      verdict: "VOID",
      error: `arifOS HTTP ${response.status}: ${errorText}`,
    };
  }

  const data = await response.json();
  const result = data.result || data;
  
  if (result.verdict) {
    return {
      verdict: result.verdict,
      stage: result.stage || result.data?.stage,
      reason: result.reason || result.data?.verdict,
      confidence: result.confidence,
    };
  }
  
  if (result.data?.verdict) {
    return {
      verdict: result.data.verdict,
      stage: result.data.stage,
      reason: result.data.verdict,
    };
  }
  
  return {
    verdict: "VOID",
    error: "Unexpected response format",
    reason: JSON.stringify(result).substring(0, 200),
  };
}

/**
 * PLACEHOLDER: MCP-native implementation (target architecture)
 * 
 * Requires:
 * - Session initialization via POST /mcp (initialize)
 * - Session ID extraction from MCP-Session-Id header
 * - Subsequent calls with MCP-Session-Id header
 * - SSE stream parsing for responses
 * 
 * Blocked by: Docker container session persistence complexity
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function apexJudgeMCP(
  _query: string,
  _sessionId: string,
  _actorId: string
): Promise<ArifOSJudgeResult> {
  // TODO: Implement canonical MCP protocol
  // 1. Initialize session: POST /mcp {method: "initialize", ...}
  // 2. Extract MCP-Session-Id from response headers
  // 3. Call tools/call with session header
  // 4. Parse SSE response stream
  throw new Error("MCP-native not yet implemented — use apexJudgeREST");
}

const arifOSBridgePlugin = {
  id: "arifos-bridge",
  name: "arifOS Constitutional Bridge",
  description: "Bridge to arifOS constitutional kernel (TEMPORARY REST SHIM)",
  kind: "tool" as const,
  configSchema: emptyPluginConfigSchema(),
  
  register(api: OpenClawPluginApi) {
    const logger = api.runtime?.logger || console;
    
    api.registerTool(
      () => ({
        name: "arifos_judge",
        description: "Constitutional evaluation (F1-F13). TEMP: Uses REST shim, target is MCP-native.",
        parameters: {
          type: "object",
          properties: {
            query: { 
              type: "string", 
              description: "Query to evaluate constitutionally" 
            },
          },
          required: ["query"]
        },
        async execute(args: { query: string }, ctx: any) {
          logger.info(`[arifOS Bridge/REST] Judging: "${args.query.substring(0, 50)}..."`);
          
          // TEMPORARY: Using REST shim for migration verification
          // TODO: Switch to apexJudgeMCP once session handling resolved
          const result = await apexJudgeREST(
            args.query,
            ctx.sessionKey || `session-${Date.now()}`,
            ctx.userId || "openclaw"
          );
          
          logger.info(`[arifOS Bridge/REST] Verdict: ${result.verdict}`);
          
          return {
            verdict: result.verdict,
            stage: result.stage || "888_JUDGE",
            reason: result.reason || result.error,
            confidence: result.confidence,
            // Mark as REST shim for debugging
            _bridge_mode: "REST_SHIM",
            _canonical_target: "MCP_NATIVE",
          };
        }
      }),
      { names: ["arifos_judge"] }
    );

    logger.warn(`[arifOS Bridge] ⚠️  RUNNING TEMPORARY REST SHIM`);
    logger.warn(`[arifOS Bridge]    Endpoint: ${ARIFOS_REST_ENDPOINT}`);
    logger.warn(`[arifOS Bridge]    Target:   ${ARIFOS_MCP_ENDPOINT} (NOT YET ACTIVE)`);
    logger.info(`[arifOS Bridge] Registered arifos_judge tool`);
  }
};

export default arifOSBridgePlugin;
