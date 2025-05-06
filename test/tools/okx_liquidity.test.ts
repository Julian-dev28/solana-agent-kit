import { describe, expect, test } from "@jest/globals";
import { SolanaAgentKit } from "../../packages/core/src/agent";
import { OKXLiquiditySource, OKXResponse } from "../../packages/core/src/types";
import { getOkxLiquidity } from "../../packages/plugin-token/src/okx";
import { Connection } from "@solana/web3.js";
import { Keypair } from "@solana/web3.js";
import { KeypairWallet } from "../../packages/core/src/utils/keypairWallet";
import TokenPlugin from "../../packages/plugin-token/src/index";
describe("OKX DEX Liquidity Tests", () => {
  let agent: SolanaAgentKit<Record<string, never>>;

  beforeEach(() => {
    const rpcUrl = process.env.RPC_URL || "";
    const connection = new Connection(rpcUrl);
    const keypair = Keypair.fromSecretKey(Buffer.from(process.env.SOLANA_PRIVATE_KEY || "", "base64"));
    const wallet = new KeypairWallet(keypair, connection.rpcEndpoint);
    
    agent = new SolanaAgentKit(wallet, rpcUrl, {
      OKX_API_KEY: process.env.OKX_API_KEY,
      OKX_SECRET_KEY: process.env.OKX_SECRET_KEY,
      OKX_API_PASSPHRASE: process.env.OKX_API_PASSPHRASE,
      OKX_PROJECT_ID: process.env.OKX_PROJECT_ID,
      OKX_SOLANA_WALLET_ADDRESS: process.env.OKX_SOLANA_WALLET_ADDRESS,
      OKX_SOLANA_PRIVATE_KEY: process.env.OKX_SOLANA_PRIVATE_KEY
    });

    agent.use(TokenPlugin);
  });

  test("should get OKX DEX liquidity", async () => {
    console.log("Testing OKX DEX Liquidity API...");
    console.log("Wallet address:", agent.wallet.publicKey.toString());

    const response = await (agent.methods as any).getOkxLiquidity();
    expect(response).toBeDefined();
    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);

    const liquiditySources = response.data;
    expect(liquiditySources.length).toBeGreaterThan(0);

    // Test first few items
    const testItems = liquiditySources.slice(0, 3);
    testItems.forEach((source: OKXLiquiditySource) => {
      expect(source.id).toBeDefined();
      expect(source.logo).toBeDefined();
    });

    console.log(`Found ${liquiditySources.length} liquidity sources`);
  });
});
