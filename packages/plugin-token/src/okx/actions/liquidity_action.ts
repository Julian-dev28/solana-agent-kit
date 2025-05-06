// src/actions/okx-dex/liquidity_action.ts
import { Action } from "solana-agent-kit";
import { z } from "zod";
import { getOkxLiquidity } from "../tools";

const okxDexLiquidityAction: Action = {
  name: "OKX_DEX_LIQUIDITY",
  similes: ["get liquidity", "okx dex liquidity"],
  description: "Get liquidity information from OKX DEX.",
  examples: [[
    {
      input: {},
      output: {
        status: "success",
        summary: {
          liquidity: [
            {
              name: "Jupiter",
              icon: "https://example.com/jupiter.png",
              id: "1",
              logo: "https://example.com/jupiter-logo.png"
            }
          ]
        }
      },
      explanation: "Getting liquidity information from OKX DEX"
    }
  ]],
  schema: z.object({}),
  handler: async (agent: any) => {
    const liquidity = await getOkxLiquidity(agent);
    return {
      status: "success",
      summary: {
        liquidity
      }
    };
  }
};

export default okxDexLiquidityAction;

