import { describe, expect, test } from "@jest/globals";
import { SolanaAgentKit } from "../../packages/core/src/agent";
import { OKXChain, OKXResponse } from "../../packages/core/src/types";
import TokenPlugin from "../../packages/plugin-token/src";
import { Connection } from "@solana/web3.js";
import { Keypair } from "@solana/web3.js";
import { KeypairWallet } from "../../packages/core/src/utils/keypairWallet";

describe("OKX DEX Chain Data Tests", () => {
  let agent: SolanaAgentKit<typeof TokenPlugin>;

  beforeEach(() => {
    const connection = new Connection(process.env.RPC_URL || "");
    const keypair = Keypair.fromSecretKey(Buffer.from(process.env.SOLANA_PRIVATE_KEY || "", "base64"));
    const wallet = new KeypairWallet(keypair, process.env.RPC_URL || "");
    
    agent = new SolanaAgentKit(wallet, process.env.RPC_URL || "", {
      OKX_API_KEY: process.env.OKX_API_KEY,
      OKX_SECRET_KEY: process.env.OKX_SECRET_KEY,
      OKX_API_PASSPHRASE: process.env.OKX_API_PASSPHRASE,
      OKX_PROJECT_ID: process.env.OKX_PROJECT_ID,
        OKX_SOLANA_WALLET_ADDRESS: process.env.OKX_SOLANA_WALLET_ADDRESS,
      OKX_SOLANA_PRIVATE_KEY: process.env.OKX_SOLANA_PRIVATE_KEY
    });
    agent.use(TokenPlugin);
  });

  test("should get OKX DEX chain data", async () => {
    console.log("Testing OKX DEX Chain Data API...");
    console.log("Wallet address:", agent.wallet.publicKey.toString());

    const response = await (agent.methods as any).getOkxChainData();
    expect(response).toBeDefined();
    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);

    const chains = response.data;
    expect(chains.length).toBeGreaterThan(0);

    // Test first few items
    const testItems = chains.slice(0, 3);
    testItems.forEach((chain: { chainName: any; chainId: any; dexTokenApproveAddress: any; }) => {
      expect(chain.chainName).toBeDefined();
      expect(chain.chainId).toBeDefined();
      if (chain.dexTokenApproveAddress) {
        expect(typeof chain.dexTokenApproveAddress).toBe("string");
      }
    });

    console.log(`Found ${chains.length} chains`);
  });
});
