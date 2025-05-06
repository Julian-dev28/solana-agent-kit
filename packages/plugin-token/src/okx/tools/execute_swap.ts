import { SolanaAgentKit } from "solana-agent-kit";
import { initDexClient } from "./utils";

/**
 * Execute a token swap on OKX DEX
 * @param agent SolanaAgentKit instance
 * @param fromTokenAddress Source token address
 * @param toTokenAddress Target token address
 * @param amount Amount to swap (in token base units)
 * @param slippage Slippage tolerance as a decimal (default: 0.005 = 0.5%)
 * @param autoSlippage Use auto slippage (default: true)
 * @param maxAutoSlippageBps Maximum auto slippage in basis points (default: 100 = 1%)
 * @returns Swap result with transaction ID
 */
export async function executeOkxSwap(
  agent: SolanaAgentKit,
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string,
  slippage: string
) {
  try {
    const dexClient = await initDexClient(agent);
    const response = await dexClient.dex.executeSwap({
      chainId: '501',
      fromTokenAddress,
      toTokenAddress,
      amount,
      slippage
    });
    return response;
  } catch (error: any) {
    throw new Error(`Failed to execute OKX swap: ${error.message}`);
  }
}