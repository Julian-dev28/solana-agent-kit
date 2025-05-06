import TokenPlugin from "@solana-agent-kit/plugin-token";
import { SolanaAgentKit } from "solana-agent-kit";
import { Connection } from "@solana/web3.js";
import { Keypair } from "@solana/web3.js";
import { KeypairWallet } from "solana-agent-kit";
import dotenv from "dotenv";
import bs58 from "bs58";
import { getOkxLiquidity } from "../../packages/plugin-token/src/okx/tools/get_liquidity";
import { getOkxQuote } from "../../packages/plugin-token/src/okx/tools/get_quote";
import { getOkxChainData } from "../../packages/plugin-token/src/okx/tools/get_chain_data";
import { getLiquidity, getQuote } from "@solana-agent-kit/plugin-token/src/okx";

// Load environment variables
dotenv.config();

async function main() {
  try {
    // Initialize connection and wallet
    const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
    const connection = new Connection(rpcUrl);
    
    // Use the provided private key
    const privateKey = process.env.OKX_SOLANA_PRIVATE_KEY!;
    const privateKeyBytes = bs58.decode(privateKey);
    const keypair = Keypair.fromSecretKey(privateKeyBytes);
    const wallet = new KeypairWallet(keypair, rpcUrl);

    console.log("Wallet address:", wallet.publicKey.toString());

    // Initialize agent
    const agent = new SolanaAgentKit(wallet, rpcUrl, {
      OKX_API_KEY: process.env.OKX_API_KEY,
      OKX_SECRET_KEY: process.env.OKX_SECRET_KEY,
      OKX_API_PASSPHRASE: process.env.OKX_API_PASSPHRASE,
      OKX_PROJECT_ID: process.env.OKX_PROJECT_ID,
      OKX_SOLANA_WALLET_ADDRESS: process.env.OKX_SOLANA_WALLET_ADDRESS,
      OKX_SOLANA_PRIVATE_KEY: process.env.OKX_SOLANA_PRIVATE_KEY
    });

    // Use plugins
    agent
      .use(TokenPlugin)

    // Initialize TokenPlugin
    TokenPlugin.initialize(agent);

    // Test OKX DEX functionality
    console.log("\nTesting OKX DEX...");
    
    // Test liquidity
    console.log("\nTesting OKX DEX Liquidity...");
    const liquidityResponse = await getOkxLiquidity(agent);
    console.log("Liquidity Sources:", liquidityResponse.data.length);

    // Test quote
    console.log("\nTesting OKX DEX Quote...");
    const fromTokenAddress = "So11111111111111111111111111111111111111112"; // SOL
    const toTokenAddress = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // USDC
    const amount = "1000000000"; // 1 SOL
    const quoteResponse = await getOkxQuote(agent, fromTokenAddress, toTokenAddress, amount, "0.5");
    console.log("Quote Response:", quoteResponse.data[0]);
  } catch (error) {
    console.error("Error running tests:", error);
    process.exit(1);
  }
}

// Run the tests
main();
