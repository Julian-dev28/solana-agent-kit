import { initDexClient } from "./utils";
import { SolanaAgentKit } from "solana-agent-kit";

/**
 * Get chain data from OKX DEX
 * @param agent SolanaAgentKit instance
 * @returns Chain data from OKX DEX
 */
export async function getOkxChainData(agent: SolanaAgentKit) {
  try {
    const dexClient = await initDexClient(agent);
    const response = await dexClient.dex.getChainData('501');
    return response;
  } catch (error: any) {
    throw new Error(`Failed to get OKX chain data: ${error.message}`);
  }
}