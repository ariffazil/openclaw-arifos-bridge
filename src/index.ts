/**
 * arifOS Bridge Extension for OpenClaw
 * 
 * Integrates OpenClaw gateway with arifOS constitutional kernel via MCP.
 */

import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";

const ARIFOS_MCP_ENDPOINT = process.env.ARIFOS_MCP_ENDPOINT || "http://127.0.0.1:8088/mcp";

interface MCPRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: Record<string, any>;
}

let requestId = 0;

async function mcpCall(method: string, params?: Record<string, any>): Promise<any> {
  const req: MCPRequest = {
    jsonrpc: "2.0",
    id: ++requestId,
    method,
    params,
  };

  const response = await fetch(ARIFOS_MCP_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
    },
    body: JSON.stringify(req),
  });

  if (!response.ok) {
    throw new Error(`MCP HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  
  if (contentType.includes("text/event-stream")) {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No SSE body");
    
    const decoder = new TextDecoder();
    let buffer = "";
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.result) return parsed.result;
            if (parsed.error) throw new Error(`MCP error: ${parsed.error.message}`);
          } catch (e) {
            // Continue reading
          }
        }
      }
    }
    throw new Error("SSE ended without result");
  }
  
  return (await response.json()).result;
}

async function apexJudge(query: string, sessionId: string, actorId: string): Promise<any> {
  const result = await mcpCall("tools/call", {
    name: "apex_judge",
    arguments: {
      query,
      session_id: sessionId,
      actor_id: actorId,
    },
  });

  const content = result?.content?.[0]?.text;
  if (content) {
    try {
      return JSON.parse(content);
    } catch {
      return { verdict: "VOID", error: content };
    }
  }
  return result;
}

const arifOSBridgePlugin = {
  id: "arifos-bridge",
  name: "arifOS Constitutional Bridge",
  description: "Bridge to arifOS MCP for 13-floor constitutional governance",
  kind: "tool" as const,
  configSchema: emptyPluginConfigSchema(),
  
  register(api: OpenClawPluginApi) {
    // Use safe logger access
    const logger = api.runtime?.logger || console;
    
    api.registerTool(
      () => ({
        name: "arifos_judge",
        description: "Constitutional evaluation using arifOS 13-floor governance (F1-F13).",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Query to evaluate" },
          },
          required: ["query"]
        },
        async execute(args: { query: string }, ctx: any) {
          const result = await apexJudge(
            args.query,
            ctx.sessionKey,
            ctx.userId || "openclaw"
          );
          return {
            verdict: result.verdict,
            stage: result.stage,
            reason: result.reason || result.error,
            confidence: result.confidence,
          };
        }
      }),
      { names: ["arifos_judge"] }
    );

    logger.info("[arifOS Bridge] Registered arifos_judge tool");
  }
};

export default arifOSBridgePlugin;
