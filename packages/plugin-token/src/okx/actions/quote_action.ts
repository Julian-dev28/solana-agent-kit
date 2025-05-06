// src/actions/okx-dex/quote_action.ts
import { Action } from "solana-agent-kit";
import { z } from "zod";
import { getOkxQuote } from "../tools";

const TOKEN_ADDRESSES = {
  "sol": "So11111111111111111111111111111111111111112",
  "usdc": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "usdt": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  "wif": "2222222222222222222222222222222222222222222222222222222222222222"
};

const okxDexQuoteAction: Action = {
  name: "OKX_DEX_QUOTE",
  similes: ["get quote", "okx dex quote"],
  description: "Get quote from OKX DEX.",
  examples: [[
    {
      input: {
        fromTokenAddress: "So11111111111111111111111111111111111111112",
        toTokenAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        amount: "1000000000",
        slippage: "0.5"
      },
      output: {
        status: "success",
        summary: {
          quote: {
            fromToken: "SOL",
            toToken: "USDC",
            fromAmount: "1",
            toAmount: "20.5"
          }
        }
      },
      explanation: "Getting quote from OKX DEX"
    }
  ]],
  schema: z.object({
    fromTokenAddress: z.string(),
    toTokenAddress: z.string(),
    amount: z.string(),
    slippage: z.string().default("0.5")
  }),
  handler: async (agent: any, input: Record<string, any>) => {
    const quote = await getOkxQuote(agent, input.fromTokenAddress, input.toTokenAddress, input.amount, input.slippage);
    return {
      status: "success",
      summary: {
        quote: quote.data[0]
      }
    };
  }
};

export default okxDexQuoteAction;