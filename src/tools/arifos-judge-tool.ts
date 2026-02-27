/**
 * arifOS Judge Tool
 * 
 * OpenClaw tool wrapper that calls arifOS MCP apex_judge.
 * This is ADAPTER code, not constitutional logic.
 * All governance happens in arifOS.
 */

import { Tool, ToolContext } from '@openclaw/sdk';

interface ArifOSJudgeInput {
  query: string;
  context?: string;
  session_id?: string;
}

interface ArifOSJudgeOutput {
  verdict: 'SEAL' | 'VOID' | 'PARTIAL' | 'SABAR' | '888_HOLD';
  stage: string;
  reason: string;
  confidence: number;
}

export const arifOSJudgeTool: Tool<ArifOSJudgeInput, ArifOSJudgeOutput> = {
  name: 'arifos_judge',
  description: 'Call arifOS apex_judge for constitutional verdict',
  
  async execute(input: ArifOSJudgeInput, context: ToolContext): Promise<ArifOSJudgeOutput> {
    const mcpEndpoint = process.env.ARIFOS_MCP_ENDPOINT || 'http://127.0.0.1:8088/mcp';
    
    // Call arifOS apex_judge via MCP
    const response = await fetch(mcpEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'apex_judge',
        params: {
          query: input.query,
          context: input.context,
          session_id: input.session_id || context.sessionId,
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`arifOS MCP error: ${response.status}`);
    }
    
    const result = await response.json();
    
    return {
      verdict: result.verdict,
      stage: result.stage,
      reason: result.reason || result.error || '',
      confidence: result.confidence || 0.0,
    };
  }
};

export default arifOSJudgeTool;
