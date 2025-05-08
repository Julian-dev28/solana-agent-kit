import { Action } from "solana-agent-kit";
import { z } from "zod";
import { okx_get_quote } from "../tools/okx_get_quote";

const okxGetQuoteAction: Action = {
  name: "OKX_GET_QUOTE",
  similes: [
    "get swap quote",
    "check swap rate",
    "token swap value",
    "quote check",
    "get swap price",
    "check token price",
    "get token rate",
    "check token value",
    "get swap value",
    "check swap price"
  ],
  description: "Get a quote for swapping between two tokens using OKX DEX",
  examples: [
    [
      {
        input: {
          fromTokenAddress: "So11111111111111111111111111111111111111112",
          toTokenAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          amount: "1000000000",
          slippage: "0.5"
        },
        output: {
          status: "success",
          quote: {
            fromToken: "SOL",
            toToken: "USDC",
            fromAmount: "1",
            toAmount: "23.45",
            priceImpact: "0.04",
            tradeFee: "0.12"
          },
          message: "Quote received: 1 SOL = 23.45 USDC (0.04% price impact)"
        },
        explanation: "Get a quote for swapping 1 SOL to USDC"
      }
    ]
  ],
  schema: z.object({
    fromTokenAddress: z.string().describe("The mint address of the token to swap from"),
    toTokenAddress: z.string().describe("The mint address of the token to swap to"),
    amount: z.string().describe("The amount to swap in minimal divisible units"),
    slippage: z.string().nullable().default("0.5").describe("Maximum slippage percentage (e.g., '0.5' for 0.5%)")
  }),
  handler: async (agent, input: Record<string, any>) => {
    try {
      const quote = await okx_get_quote(
        agent,
        input.fromTokenAddress,
        input.toTokenAddress,
        input.amount,
        input.slippage || "0.5"
      );

      return {
        status: "success",
        quote: {
          fromToken: quote.fromToken.tokenSymbol,
          toToken: quote.toToken.tokenSymbol,
          fromAmount: quote.fromTokenAmount,
          toAmount: quote.toTokenAmount,
          priceImpact: quote.priceImpactPercentage,
          tradeFee: quote.tradeFee
        },
        message: `Quote received: ${quote.fromTokenAmount} ${quote.fromToken.tokenSymbol} = ${quote.toTokenAmount} ${quote.toToken.tokenSymbol} (${quote.priceImpactPercentage}% price impact)`
      };
    } catch (error: any) {
      return {
        status: "error",
        message: `Failed to get quote: ${error.message}`
      };
    }
  }
};

export default okxGetQuoteAction;
