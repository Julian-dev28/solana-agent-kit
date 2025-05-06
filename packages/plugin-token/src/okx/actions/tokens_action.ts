import { Action, SolanaAgentKit } from "solana-agent-kit";
import { z } from "zod";
import { executeOkxSwap, getOkxQuote, getOkxTokens } from "../tools";

export const okxDexTokensAction: Action = {
  name: "OKX_DEX_TOKENS",
  similes: ["list tokens", "okx dex tokens"],
  description: "List all tokens supported by OKX DEX.",
  examples: [[
    {
      input: {},
      output: {
        status: "success",
        summary: {
          tokens: [
            {
              symbol: "SOL",
              name: "Solana",
              address: "So11111111111111111111111111111111111111112"
            },
            {
              symbol: "USDC",
              name: "USD Coin",
              address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
            }
          ]
        }
      },
      explanation: "Listing all tokens supported by OKX DEX"
    }
  ]],
  schema: z.object({}),
  handler: async (agent: any, input: Record<string, any>) => {
    const tokens = await getOkxTokens(agent);
    return {
      status: "success",
      summary: {
        tokens: tokens
      }
    };  
  }
};

