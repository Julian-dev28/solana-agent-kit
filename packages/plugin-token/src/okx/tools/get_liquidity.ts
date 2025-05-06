import { initDexClient } from "./utils";
import { SolanaAgentKit } from "solana-agent-kit";

/**
 * Get liquidity information from OKX DEX
 * @param agent SolanaAgentKit instance
 * @returns Liquidity data from OKX DEX
 */
export async function getOkxLiquidity(agent: SolanaAgentKit) {
  try {
    const dexClient = await initDexClient(agent);
    const response = await dexClient.dex.getLiquidity('501');
    return response;
  } catch (error: any) {
    throw new Error(`Failed to get OKX liquidity: ${error.message}`);
  }
}