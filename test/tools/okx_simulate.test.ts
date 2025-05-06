import { describe, expect, test } from "@jest/globals";
import { SolanaAgentKit } from "../../packages/core/src/agent";
import { OKXQuoteData, OKXResponse } from "../../packages/core/src/types";
import TokenPlugin from "../../packages/plugin-token/src";
import { OKXPluginMethods } from "../../packages/plugin-token/src/okx";
import { Connection } from "@solana/web3.js";
import { Keypair } from "@solana/web3.js";
import { KeypairWallet } from "../../packages/core/src/utils/keypairWallet";

describe("OKX DEX Simulate Tests", () => {
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

  test("should simulate OKX DEX swap", async () => {
    console.log("Testing OKX DEX Simulate API...");
    console.log("Wallet address:", agent.wallet.publicKey.toString());

    const fromTokenAddress = "So11111111111111111111111111111111111111112"; // SOL
    const toTokenAddress = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // USDC
    const amount = "1000000000"; // 1 SOL

    const response = await (agent.methods as unknown as OKXPluginMethods).getOkxQuote(fromTokenAddress, toTokenAddress, amount);
    expect(response).toBeDefined();
    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);

    const quotes = response.data;
    expect(quotes.length).toBeGreaterThan(0);

    // Test first quote
    const quote = quotes[0];
    expect(quote.inToken).toBeDefined();
    expect(quote.outToken).toBeDefined();
    expect(quote.inAmount).toBeDefined();
    expect(quote.outAmount).toBeDefined();
    expect(quote.price).toBeDefined();
    expect(quote.priceImpact).toBeDefined();
    expect(Array.isArray(quote.liquiditySources)).toBe(true);
    expect(quote.gasFee).toBeDefined();

    console.log(`Found ${quotes.length} quotes`);
  });
});
