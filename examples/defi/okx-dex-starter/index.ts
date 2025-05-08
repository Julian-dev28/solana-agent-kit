import { SolanaAgentKit, KeypairWallet } from "solana-agent-kit";
import { Keypair } from "@solana/web3.js";
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { StructuredTool } from "@langchain/core/tools";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import TokenPlugin from "@solana-agent-kit/plugin-token";
import bs58 from "bs58";
import dotenv from "dotenv";
import { z } from "zod";
import * as readline from "readline";

// Load environment variables
dotenv.config();

export const OKX_SOLANA_WALLET_ADDRESS = process.env.OKX_SOLANA_WALLET_ADDRESS || "";

interface TokenInfo {
  symbol: string;
  address: string;
  decimals: number;
}

// Initialize with known tokens
let tokenInfoCache: Record<string, TokenInfo> = {
  "11111111111111111111111111111111": {
    symbol: "SOL",
    address: "11111111111111111111111111111111",
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

function getTokenInfo(address: string): TokenInfo | undefined {
  return tokenInfoCache[address];
}

export function formatTokenAmount(amount: string, address: string, tokenInfo?: any): string {
  try {
    const info = tokenInfo || getTokenInfo(address);
    const decimals = info?.decimals ?? 9;
    const symbol = info?.symbol || address.slice(0, 8);
    
    if (amount === "0") {
      return `0.000000 ${symbol}`;
    }

    const value = BigInt(amount);
    const divisor = BigInt(10 ** decimals);
    const integerPart = value / divisor;
    const decimalPart = value % divisor;
    
    const decimalStr = decimalPart.toString().padStart(decimals, '0');
    const formattedDecimal = decimalStr.slice(0, 6); // Show up to 6 decimal places
    
    return `${integerPart.toString()}.${formattedDecimal} ${symbol}`;
  } catch (err) {
    return `0.000000 ${address.slice(0, 8)}`;
  }
}

// Initialize agent with TokenPlugin
async function initializeAgent() {
  if (!process.env.SOLANA_PRIVATE_KEY) {
    throw new Error("SOLANA_PRIVATE_KEY is required");
  }

  try {
    // Create wallet from private key
    const privateKey = bs58.decode(process.env.SOLANA_PRIVATE_KEY);
    const keypair = Keypair.fromSecretKey(privateKey);
    const wallet = new KeypairWallet(keypair, process.env.RPC_URL || "https://api.mainnet-beta.solana.com");

    // Initialize SolanaAgentKit with TokenPlugin
    const agent = new SolanaAgentKit(
      wallet,
      process.env.RPC_URL || "https://api.mainnet-beta.solana.com",
      {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
        OKX_API_KEY: process.env.OKX_API_KEY!,
        OKX_SECRET_KEY: process.env.OKX_SECRET_KEY!,
      }
    ).use(TokenPlugin);

    return agent;
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    throw error;
  }
}

// Create a tool for getting quotes using the new V2 architecture
class GetQuoteTool extends StructuredTool {
  name = "get_quote";
  description = "Get a quote for swapping tokens on OKX DEX";
  schema = z.object({
    fromToken: z.string().describe("The token symbol to swap from (e.g., SOL, USDC)"),
    toToken: z.string().describe("The token symbol to swap to (e.g., SOL, USDC)"),
    amount: z.string().describe("The amount to swap"),
  });

  async _call({ fromToken, toToken, amount }: { fromToken: string; toToken: string; amount: string }): Promise<string> {
    try {
      const agent = await initializeAgent();
      // Use the plugin's method directly through agent.methods
      const result = await agent.methods.getQuote(agent, fromToken, toToken, amount, "0.5");
      return JSON.stringify(result, null, 2);
    } catch (error: any) {
      return `Error getting quote: ${error.message}`;
    }
  }
}

const getQuoteTool = new GetQuoteTool();

async function runChatbot() {
  console.log("\nInitializing OKX DEX Trading Bot...");
  
  // Create OpenAI instance
  const llm = new ChatOpenAI({
    modelName: "gpt-4-turbo-preview",
    temperature: 0,
  });

  // Create the prompt template
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a helpful assistant that helps users get quotes for token swaps on OKX DEX. You can use the get_quote tool to get quotes for swapping tokens."],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  // Create agent with tools
  const agent = await createOpenAIFunctionsAgent({
    llm,
    tools: [getQuoteTool],
    prompt,
  });

  // Create agent executor
  const agentExecutor = new AgentExecutor({
    agent,
    tools: [getQuoteTool],
    verbose: true,
  });

  console.log("\nBot initialized! You can now chat with the bot.");
  console.log("Example commands:");
  console.log("- Get a quote: 'Get a quote for swapping 0.1 SOL to USDC'");
  console.log("- Exit: 'exit' or 'quit'");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const askQuestion = (question: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(question, resolve);
    });
  };

  try {
    while (true) {
      const input = await askQuestion("\nYou: ");
      
      if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
        console.log("\nGoodbye!");
        break;
      }

      try {
        const result = await agentExecutor.invoke({
          input,
        });

        console.log("\nBot:", result.output);
      } catch (error: any) {
        console.error("\nError:", error.message);
      }
    }
  } catch (err) {
    console.error("\nError:", err);
  } finally {
    rl.close();
  }
}

// Start the chatbot when running directly
if (require.main === module) {
  runChatbot().catch(console.error);
} 