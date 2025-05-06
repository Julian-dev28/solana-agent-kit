import { Action } from "solana-agent-kit";
import { z } from "zod";
import { executeOkxSwap } from "../tools";

const TOKEN_ADDRESSES = {
  "sol": "So11111111111111111111111111111111111111112",
  "usdc": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "usdt": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  "wif": "2222222222222222222222222222222222222222222222222222222222222222"
};

const okxDexSwapAction: Action = {
  name: "OKX_DEX_SWAP",
  similes: ["swap", "okx dex swap"],
  description: "Execute a token swap on OKX DEX.",
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
          swap: {
            fromToken: "SOL",
            toToken: "USDC",
            fromAmount: "1",
            toAmount: "20.5",
            txId: "5KKsT6UcmKK6Jx9hCx8hzwwJqJpCNzwhGYkNjREHpJEbzxV6nJt8Y2KgN6QRGyyGKQKmnVKXKQmVxetS4LYqHhV8"
          }
        }
      },
      explanation: "Executing swap on OKX DEX"
    }
  ]],
  schema: z.object({
    fromTokenAddress: z.string(),
    toTokenAddress: z.string(),
    amount: z.string(),
    slippage: z.string().default("0.5")
  }),
  handler: async (agent: any, input: Record<string, any>) => {
    const swap = await executeOkxSwap(agent, input.fromTokenAddress, input.toTokenAddress, input.amount, input.slippage);
    return {
      status: "success",
      summary: {
        swap
      }
    };
  }
};

export default okxDexSwapAction;
    

