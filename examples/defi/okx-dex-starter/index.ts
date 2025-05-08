import { SolanaAgentKit, KeypairWallet, createLangchainTools } from "solana-agent-kit";
import { Keypair } from "@solana/web3.js";
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { HumanMessage } from "@langchain/core/messages";
import TokenPlugin from "@solana-agent-kit/plugin-token";
import bs58 from "bs58";
import dotenv from "dotenv";
import * as readline from "readline";
import { initDexClient } from "../../src/tools/okx-dex/utils";

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

// Helper functions for base58 validation
function isValidBase58(str: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(str);
}

function encodeBase58Safe(str: string): string {
  // Remove any non-base58 characters and whitespace
  return str.replace(/[^1-9A-HJ-NP-Za-km-z]/g, '');
}

function updateTokenInfo(quote: any) {
  try {
    // Update from quote data array
    if (quote?.data?.[0]) {
      const quoteData = quote.data[0];
      if (quoteData.fromToken) {
        tokenInfoCache[quoteData.fromToken.address] = {
          symbol: quoteData.fromToken.tokenSymbol,
          address: quoteData.fromToken.address,
          decimals: parseInt(quoteData.fromToken.decimal)
        };
      }
      if (quoteData.toToken) {
        tokenInfoCache[quoteData.toToken.address] = {
          symbol: quoteData.toToken.tokenSymbol,
          address: quoteData.toToken.address,
          decimals: parseInt(quoteData.toToken.decimal)
        };
      }
    }

    // Update from compare list
    if (quote?.data?.[0]?.quoteCompareList) {
      quote.data[0].quoteCompareList.forEach((route: any) => {
        if (route.tokenIn) {
          tokenInfoCache[route.tokenIn.address] = {
            symbol: route.tokenIn.symbol,
            address: route.tokenIn.address,
            decimals: parseInt(route.tokenIn.decimals)
          };
        }
        if (route.tokenOut) {
          tokenInfoCache[route.tokenOut.address] = {
            symbol: route.tokenOut.symbol,
            address: route.tokenOut.address,
            decimals: parseInt(route.tokenOut.decimals)
          };
        }
      });
    }
  } catch (error) {
    console.error("Error updating token info:", error);
  }
}

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

function validateAndFormatAmount(amount: string, address: string): { isValid: boolean; formatted: string; humanReadable: string } {
  try {
    const cleanAmount = amount.replace(/,/g, '').trim();
    
    if (!/^\d*\.?\d+$/.test(cleanAmount)) {
      return { isValid: false, formatted: "0", humanReadable: "0" };
    }

    const value = parseFloat(cleanAmount);
    if (isNaN(value) || value <= 0) {
      return { isValid: false, formatted: "0", humanReadable: "0" };
    }

    const tokenInfo = getTokenInfo(address);
    const decimals = tokenInfo?.decimals ?? 9;
    
    // Convert to base units with proper decimal handling
    const parts = cleanAmount.split('.');
    let wholePart = parts[0] || '0';
    const fractionalPart = parts[1] || '';
    
    // Ensure whole part is not empty and has at least one digit
    if (!wholePart || wholePart === '') {
      wholePart = '0';
    }
    
    // Pad with zeros if needed, then take correct number of decimal places
    const paddedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
    
    // Combine whole and fractional parts
    const baseUnits = wholePart + paddedFractional;
    
    // Remove leading zeros but keep at least one digit
    const formattedBaseUnits = baseUnits.replace(/^0+/, '') || '0';

    // Format human readable amount
    const humanValue = value.toLocaleString(undefined, {
      minimumFractionDigits: Math.min(6, decimals),
      maximumFractionDigits: Math.min(6, decimals),
      useGrouping: false // Prevent thousand separators
    });

    return {
      isValid: true,
      formatted: formattedBaseUnits, // Use base units for API calls
      humanReadable: `${humanValue} ${tokenInfo?.symbol || address.slice(0, 8)}`
    };
  } catch (err) {
    console.error("Error formatting amount:", err);
    return { isValid: false, formatted: "0", humanReadable: "0" };
  }
}

function formatQuoteResult(quote: any, fromAddress: string, toAddress: string): void {
  if (quote.status === "error") {
    console.log("\nQuote Error:");
    console.log("  Message:", quote.message || "Unknown error");
    return;
  }

  // Handle OKX API response structure
  const quoteData = quote.data?.[0];
  if (!quoteData) {
    console.log("\nInvalid quote response");
    return;
  }

  // Update token info cache
  updateTokenInfo(quote);

  // Update token info cache first
  if (quoteData.fromToken && quoteData.toToken) {
    tokenInfoCache[fromAddress] = {
      symbol: quoteData.fromToken.tokenSymbol,
      address: fromAddress,
      decimals: parseInt(quoteData.fromToken.decimal)
    };
    tokenInfoCache[toAddress] = {
      symbol: quoteData.toToken.tokenSymbol,
      address: toAddress,
      decimals: parseInt(quoteData.toToken.decimal)
    };
  }

  const fromSymbol = quoteData.fromToken?.tokenSymbol || getTokenInfo(fromAddress)?.symbol || fromAddress.slice(0, 8);
  const toSymbol = quoteData.toToken?.tokenSymbol || getTokenInfo(toAddress)?.symbol || toAddress.slice(0, 8);

  // Format amounts using the token decimals from the quote
  const toTokenDecimals = parseInt(quoteData.toToken?.decimal || "6");
  const expectedOutput = (parseInt(quoteData.toTokenAmount) / Math.pow(10, toTokenDecimals)).toFixed(6);
  
  // Calculate minimum output (can be adjusted based on slippage)
  const minOutput = (parseInt(quoteData.toTokenAmount) * 0.995 / Math.pow(10, toTokenDecimals)).toFixed(6);
  
  // Get price impact from the response
  const priceImpact = parseFloat(quoteData.priceImpactPercentage || "0");

  console.log("\nQuote Details:");
  console.log(`  ${fromSymbol} → ${toSymbol}`);
  console.log("  Expected Output:", `${expectedOutput} ${toSymbol}`);
  console.log("  Minimum Output:", `${minOutput} ${toSymbol}`);
  console.log("  Price Impact:", `${priceImpact.toFixed(2)}%`);
  
  // Display available routes if present
  if (quoteData.quoteCompareList && quoteData.quoteCompareList.length > 0) {
    console.log("\nAvailable Routes:");
    quoteData.quoteCompareList.forEach((route: any) => {
      console.log(`  ${route.dexName}: ${route.amountOut} ${toSymbol} (Fee: ${route.tradeFee})`);
    });
  }

  // Display token prices if available
  if (quoteData.fromToken?.tokenUnitPrice || quoteData.toToken?.tokenUnitPrice) {
    console.log("\nToken Prices:");
    if (quoteData.fromToken?.tokenUnitPrice) {
      console.log(`  ${fromSymbol}: $${parseFloat(quoteData.fromToken.tokenUnitPrice).toFixed(4)}`);
    }
    if (quoteData.toToken?.tokenUnitPrice) {
      console.log(`  ${toSymbol}: $${parseFloat(quoteData.toToken.tokenUnitPrice).toFixed(4)}`);
    }
  }
}

export async function executeSwap(
  agent: SolanaAgentKit,
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string,
  slippage: string = "0.5",
  autoSlippage: boolean = false,
  maxAutoSlippageBps: string = "100",
  userWalletAddress?: string
): Promise<any> {
  try {
    // Handle various SOL address formats and convert to OKX's expected format
    const WRAPPED_SOL_MINT = "So11111111111111111111111111111111111111112";
    const NATIVE_SOL_MINT = "11111111111111111111111111111111";
    
    // Convert addresses to strings and normalize
    let fromAddress = String(fromTokenAddress || '').trim();
    let toAddress = String(toTokenAddress || '').trim();
    
    // Convert SOL addresses to native format for the API
    if (fromAddress === WRAPPED_SOL_MINT) {
      console.log(`Converting from wrapped SOL to native format for API call: ${NATIVE_SOL_MINT}`);
      fromAddress = NATIVE_SOL_MINT;
    }
    
    if (toAddress === WRAPPED_SOL_MINT) {
      console.log(`Converting to wrapped SOL to native format for API call: ${NATIVE_SOL_MINT}`);
      toAddress = NATIVE_SOL_MINT;
    }
    
    // Clean the wallet address
    const walletAddress = String(userWalletAddress || agent.wallet_address.toString()).trim();
    
    console.log("\nDebug - OKX DEX Swap Execution:");
    console.log("  From token:", fromAddress);
    console.log("  To token:", toAddress);
    console.log("  Amount:", amount);
    console.log("  Amount type:", typeof amount);
    console.log("  User wallet:", walletAddress);

    // Initialize the OKX DEX client
    const dexClient = initDexClient(agent);

    // Get a quote first
    console.log("\nDebug - Getting quote for swap...");
    const quote = await dexClient.dex.getQuote({
      chainId: '501',
      fromTokenAddress: fromAddress,
      toTokenAddress: toAddress,
      amount: amount.toString(),
      slippage: autoSlippage ? "0" : slippage
    });

    console.log("\nDebug - Quote response status:", quote.code, quote.msg);
    
    // Validate the quote
    if (!quote.data || !quote.data[0]) {
      throw new Error(`Failed to get valid quote for the swap: ${quote.msg || "No data"}`);
    }

    const quoteData = quote.data[0];
    console.log("\nDebug - Quote data:", {
      fromToken: quoteData.fromToken?.tokenSymbol || "Unknown",
      toToken: quoteData.toToken?.tokenSymbol || "Unknown",
      fromAmount: quoteData.fromTokenAmount,
      toAmount: quoteData.toTokenAmount,
    });

    // Extract human-readable amounts for reporting
    const fromDecimal = parseInt(quoteData.fromToken?.decimal || "9");
    const toDecimal = parseInt(quoteData.toToken?.decimal || "6");
    const humanFromAmount = parseFloat(quoteData.fromTokenAmount) / Math.pow(10, fromDecimal);
    const humanToAmount = parseFloat(quoteData.toTokenAmount) / Math.pow(10, toDecimal);

    console.log("\nDebug - Executing swap transaction...");
    
    try {
      // Use the standard SDK method instead of trying to customize the request
      const swapResult = await dexClient.dex.executeSwap({
        chainId: '501',
        fromTokenAddress: fromAddress,
        toTokenAddress: toAddress,
        amount: amount.toString(),
        slippage,
        autoSlippage,
        maxAutoSlippage: maxAutoSlippageBps,
        userWalletAddress: walletAddress
      });

      console.log("\nDebug - Swap result:", JSON.stringify(swapResult, null, 2));

      return {
        status: "success",
        summary: {
          fromToken: quoteData.fromToken?.tokenSymbol || fromAddress,
          toToken: quoteData.toToken?.tokenSymbol || toAddress,
          fromAmount: humanFromAmount,
          toAmount: humanToAmount,
          exchangeRate: humanToAmount / humanFromAmount,
          txId: swapResult.transactionId || "Unknown",
          explorerUrl: swapResult.explorerUrl || `https://www.okx.com/web3/explorer/sol/tx/${swapResult.transactionId || ""}`
        },
        data: swapResult
      };
    } catch (swapError: any) {
      console.error("\nSwap execution failed:", swapError);
      
      if (swapError.message?.includes("Non-base58")) {
        console.log("\nAnalyzing base58 error...");
        
        const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
        
        // Check if Agent's wallet keypair is valid
        const agentPrivateKey = agent.wallet.secretKey.toString();
        console.log("Agent private key format valid:", base58Regex.test(agentPrivateKey.slice(0, 5) + "..."));
        
        // Let's try direct JSON.stringify to see the exact error:
        const errorDetails = {
          message: swapError.message,
          name: swapError.name,
          stack: swapError.stack,
          responseBody: swapError.responseBody,
          requestDetails: swapError.requestDetails
        };
        
        console.log("Detailed error:", JSON.stringify(errorDetails, null, 2));
      }
      
      return {
        status: "error",
        message: swapError.message || "Failed to execute swap",
        details: swapError.response?.data || swapError.responseBody || swapError.stack
      };
    }
  } catch (error: any) {
    console.error("\nDetailed swap error:", error);
    
    return {
      status: "error",
      message: error.message || "Failed to execute swap",
      details: error.response?.data || error.stack
    };
  }
}

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
        OKX_API_PASSPHRASE: process.env.OKX_API_PASSPHRASE!,
        OKX_PROJECT_ID: process.env.OKX_PROJECT_ID!,
      }
    ).use(TokenPlugin);

    // Create Langchain tools from agent actions
    const tools = createLangchainTools(agent, agent.actions);

    // Create OpenAI functions agent
    const agentOpenAI = createOpenAIFunctionsAgent({
      llm: new ChatOpenAI({ modelName: "gpt-4-turbo-preview" }),
      tools,
    });

    // Create agent executor
    const agentExecutor = new AgentExecutor({
      agent: agentOpenAI,
      tools,
      verbose: true,
    });

    return { agent, agentExecutor };
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    throw error;
  }
}

async function runChatbot() {
  console.log("\nInitializing OKX DEX Trading Bot...");
  const { agent, agentExecutor } = await initializeAgent();

  console.log("\nBot initialized! You can now chat with the bot.");
  console.log("Example commands:");
  console.log("- Get a quote: 'Get a quote for swapping 0.1 SOL to USDC'");
  console.log("- Execute swap: 'Swap 0.1 SOL to USDC'");
  console.log("- Check balance: 'What's my SOL balance?'");
  console.log("- List tokens: 'Show me available tokens'");
  console.log("- Exit: 'exit' or 'quit'");

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const askQuestion = (question: string): Promise<string> => {
    return new Promise((resolve) => {
      readline.question(question, resolve);
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
    readline.close();
  }
}

// Start the chatbot when running directly
if (require.main === module) {
  runChatbot().catch(console.error);
} 