import { initDexClient } from "./utils";
import { SolanaAgentKit } from "solana-agent-kit";

/**
 * Get list of tokens supported by OKX DEX
 * @param agent SolanaAgentKit instance
 * @returns List of supported tokens
 */
export async function getOkxTokens(agent: SolanaAgentKit) {
  try {
    const dexClient = await initDexClient(agent);
    const response = await dexClient.dex.getTokens('501');
    return response;
  } catch (error: any) {
    throw new Error(`Failed to get OKX tokens: ${error.message}`);
  }
}