import { initDexClient } from "./utils";
import { SolanaAgentKit } from "solana-agent-kit";

/**
 * Get quote for token swap on OKX DEX
 * @param agent SolanaAgentKit instance
 * @param fromTokenAddress Source token address
 * @param toTokenAddress Target token address
 * @param amount Amount to swap in base units
 * @param slippage Slippage tolerance (optional)
 * @returns Quote response
 */
export async function getOkxQuote(
  agent: SolanaAgentKit,
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string,
  slippage: string
) {
  try {
    const dexClient = await initDexClient(agent);
    const response = await dexClient.dex.getQuote({
      chainId: '501',
      fromTokenAddress,
      toTokenAddress,
      amount,
      slippage
    });
    return response;
  } catch (error: any) {
    throw new Error(`Failed to get OKX quote: ${error.message}`);
  }
}