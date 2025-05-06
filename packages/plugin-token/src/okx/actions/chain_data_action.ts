// src/actions/okx-dex/chain_data_action.ts
import { Action } from "solana-agent-kit";
import { z } from "zod";
import { getOkxChainData } from "../tools";

const okxDexChainDataAction: Action = {
  name: "OKX_DEX_CHAIN_DATA",
  similes: ["get chain data", "okx dex chain data"],
  description: "Get chain data from OKX DEX.",
  examples: [[
    {
      input: {},
      output: {
        status: "success",
        summary: {
          chainData: {
            chainId: "501",
            chainName: "Solana",
            dexTokenApproveAddress: "6JQYBf383aJYqZu5nimYWYKZQe18ZH8JHjWK215JF13"
          }
        }
      },
      explanation: "Getting chain data from OKX DEX"
    }
  ]],
  schema: z.object({}),
  handler: async (agent: any) => {
    const chainData = await getOkxChainData(agent);
    return {
      status: "success",
      summary: {
        chainData
      }
    };
  }
};

export default okxDexChainDataAction;