import { SolanaAgentKit, KeypairWallet } from "solana-agent-kit";
import TokenPlugin from "@solana-agent-kit/plugin-token";
import * as dotenv from "dotenv";
import * as readline from "readline";
import { Keypair } from "@solana/web3.js";
import bs58 from 'bs58';

// Define OKXPluginMethods interface
interface OKXPluginMethods {
  getOkxLiquidity: () => Promise<any>;
  getOkxQuote: (fromTokenAddress: string, toTokenAddress: string, amount: string, slippage?: string) => Promise<any>;
  executeOkxSwap: (fromTokenAddress: string, toTokenAddress: string, amount: string, slippage?: string) => Promise<any>;
  getOkxTokens: () => Promise<any>;
  getOkxChainData: () => Promise<any>;
}

dotenv.config();

function validateEnvironment(): void {
  const missingVars: string[] = [];
  const requiredVars = [
    "OPENAI_API_KEY", 
    "RPC_URL", 
    "SOLANA_PRIVATE_KEY",
    "OKX_API_KEY",
    "OKX_SECRET_KEY",
    "OKX_API_PASSPHRASE",
    "OKX_PROJECT_ID",
    "OKX_SOLANA_WALLET_ADDRESS",
    "OKX_SOLANA_PRIVATE_KEY"
  ];

  requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    console.error("Error: Required environment variables are not set");
    missingVars.forEach((varName) => {
      console.error(`${varName}=your_${varName.toLowerCase()}_here`);
    });
    process.exit(1);
  }
}

validateEnvironment();

interface TokenInfo {
  symbol: string;
  address: string;
  decimals: number;
}

// Initialize with known tokens
let tokenInfoCache: Record<string, TokenInfo> = {
  "So11111111111111111111111111111111111111112": {
    symbol: "SOL",
    address: "So11111111111111111111111111111111111111112",
    decimals: 9
  },
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": {
    symbol: "USDC",
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6
  },
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": {
    symbol: "USDT",
    address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    decimals: 6
  }
};

// Helper functions for base58 validation
function isValidBase58(str: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(str);
}

function encodeBase58Safe(str: string): string {
  return str.replace(/[^1-9A-HJ-NP-Za-km-z]/g, '');
}

function validateTokenAddress(address: string): string {
  // If it's already a valid address, return it
  if (isValidBase58(address) && address.length === 44) {
    return address;
  }

  // Try to find by symbol
  const token = Object.values(tokenInfoCache).find(t => 
    t.symbol.toLowerCase() === address.toLowerCase()
  );
  if (token) {
    return token.address;
  }

  // Try to clean and validate the address
  const cleaned = encodeBase58Safe(address);
  if (isValidBase58(cleaned) && cleaned.length === 44) {
    return cleaned;
  }

  throw new Error(`Invalid token address or symbol: ${address}. Available tokens: ${Object.values(tokenInfoCache).map(t => t.symbol).join(', ')}`);
}

function formatAmount(amount: string, tokenSymbol: string): string {
  const token = Object.values(tokenInfoCache).find(t => 
    t.symbol.toLowerCase() === tokenSymbol.toLowerCase()
  );
  if (!token) {
    throw new Error(`Unknown token symbol: ${tokenSymbol}`);
  }
  
  // Convert human-readable amount to base units
  const value = parseFloat(amount);
  if (isNaN(value) || value <= 0) {
    throw new Error(`Invalid amount: ${amount}`);
  }
  
  return (value * Math.pow(10, token.decimals)).toString();
}

async function initializeAgent() {
  const keypair = Keypair.fromSecretKey(
    bs58.decode(process.env.SOLANA_PRIVATE_KEY!)
  );

  const wallet = new KeypairWallet(keypair, process.env.RPC_URL!);

  const agent = new SolanaAgentKit(wallet, process.env.RPC_URL!, {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OKX_API_KEY: process.env.OKX_API_KEY,
    OKX_SECRET_KEY: process.env.OKX_SECRET_KEY,
    OKX_API_PASSPHRASE: process.env.OKX_API_PASSPHRASE,
    OKX_PROJECT_ID: process.env.OKX_PROJECT_ID,
    OKX_SOLANA_WALLET_ADDRESS: process.env.OKX_SOLANA_WALLET_ADDRESS,
    OKX_SOLANA_PRIVATE_KEY: process.env.OKX_SOLANA_PRIVATE_KEY
  } as any);

  // Use the TokenPlugin
  agent.use(TokenPlugin);

  // Initialize the plugin
  TokenPlugin.initialize(agent);

  // Ensure actions are properly initialized
  if (!agent.actions) {
    console.error("Agent actions object is undefined");
    throw new Error("Agent actions not initialized");
  }

  // Check if OKX actions are available
  const requiredOkxActions = [
    'OKX_DEX_CHAIN_DATA',
    'OKX_DEX_LIQUIDITY',
    'OKX_DEX_QUOTE',
    'OKX_DEX_SWAP'
  ];

  const okxActions = agent.actions.filter(action => 
    requiredOkxActions.includes(action.name)
  );

  if (okxActions.length !== requiredOkxActions.length) {
    console.error("Available actions:", agent.actions.map(a => a.name));
    console.error("Missing OKX actions:", requiredOkxActions.filter(name => 
      !agent.actions.some(a => a.name === name)
    ));
    throw new Error("OKX plugin actions not properly initialized");
  }

  return { agent };
}

async function runTradingBot() {
  const { agent } = await initializeAgent();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log("\n🚀 Welcome to the Solana Agent Kit Trading Bot!");
  console.log("\n📋 Available Commands:");
  console.log("  swap <from> <to> <amount>   - Execute a token swap");
  console.log("  quote <from> <to> <amount>  - Get a quote for a swap");
  console.log("  tokens                     - List available tokens");
  console.log("  help                       - Show this help message");
  console.log("  exit                       - Exit the bot");
  
  console.log("\n💡 Example Usage:");
  console.log("  quote sol usdc 1.5         - Get quote for swapping 1.5 SOL to USDC");
  console.log("  swap sol usdc 1.5          - Swap 1.5 SOL to USDC");
  console.log("  quote usdc sol 100         - Get quote for swapping 100 USDC to SOL");
  console.log("  swap usdc sol 100          - Swap 100 USDC to SOL");

  while (true) {
    const input = await new Promise<string>((resolve) => {
      rl.question("\nEnter command: ", resolve);
    });
    const [command, ...args] = input.split(" ");

    try {
      switch (command.toLowerCase()) {
        case "swap": {
          if (args.length < 3) {
            console.log("Usage: swap <from> <to> <amount>");
            console.log("Example: swap sol usdc 1.5");
            continue;
          }
          const [fromSymbol, toSymbol, amount] = args;
          try {
            console.log(`\n🔄 Executing swap: ${amount} ${fromSymbol.toUpperCase()} to ${toSymbol.toUpperCase()}`);
            const fromAddress = validateTokenAddress(fromSymbol);
            const toAddress = validateTokenAddress(toSymbol);
            const formattedAmount = formatAmount(amount, fromSymbol);

            // Find and execute the OKX swap action
            const swapAction = agent.actions.find(a => a.name === 'OKX_DEX_SWAP');
            if (!swapAction) {
              throw new Error("OKX swap action not found");
            }

            const result = await swapAction.handler(agent, {
              fromTokenAddress: fromAddress,
              toTokenAddress: toAddress,
              amount: formattedAmount,
              slippage: "0.5"
            });

            console.log("✅ Swap executed successfully!");
            console.log("Transaction details:", result);
          } catch (error: any) {
            console.error("❌ Swap failed:", error.message);
          }
          break;
        }
        case "quote": {
          if (args.length < 3) {
            console.log("Usage: quote <from> <to> <amount>");
            console.log("Example: quote sol usdc 1.5");
            continue;
          }
          const [fromSymbol, toSymbol, amount] = args;
          try {
            console.log(`\n💱 Getting quote for: ${amount} ${fromSymbol.toUpperCase()} to ${toSymbol.toUpperCase()}`);
            const fromAddress = validateTokenAddress(fromSymbol);
            const toAddress = validateTokenAddress(toSymbol);
            const formattedAmount = formatAmount(amount, fromSymbol);

            // Find and execute the OKX quote action
            const quoteAction = agent.actions.find(a => a.name === 'OKX_DEX_QUOTE');
            if (!quoteAction) {
              throw new Error("OKX quote action not found");
            }

            const result = await quoteAction.handler(agent, {
              fromTokenAddress: fromAddress,
              toTokenAddress: toAddress,
              amount: formattedAmount,
              slippage: "0.5"
            });

            console.log("📊 Quote received:");
            console.log(JSON.stringify(result, null, 2));
          } catch (error: any) {
            console.error("❌ Failed to get quote:", error.message);
          }
          break;
        }
        case "tokens": {
          try {
            // Find and execute the OKX chain data action to get token list
            const chainDataAction = agent.actions.find(a => a.name === 'OKX_DEX_CHAIN_DATA');
            if (!chainDataAction) {
              throw new Error("OKX chain data action not found");
            }

            const result = await chainDataAction.handler(agent, {});
            console.log("\n📋 Available tokens:");
            console.log(JSON.stringify(result, null, 2));
          } catch (error: any) {
            console.error("❌ Failed to get token list:", error.message);
          }
          break;
        }
        case "help": {
          console.log("\n📋 Available Commands:");
          console.log("  swap <from> <to> <amount>   - Execute a token swap");
          console.log("  quote <from> <to> <amount>  - Get a quote for a swap");
          console.log("  tokens                     - List available tokens");
          console.log("  help                       - Show this help message");
          console.log("  exit                       - Exit the bot");
          break;
        }
        case "exit": {
          console.log("\n👋 Goodbye!");
          process.exit(0);
        }
        default: {
          console.log("Unknown command. Type 'help' for available commands.");
        }
      }
    } catch (error: any) {
      console.error("Error:", error.message);
    }
  }
}

// Run the bot
runTradingBot().catch(console.error); 