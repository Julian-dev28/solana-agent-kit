import { Plugin, SolanaAgentKit } from "solana-agent-kit";

export interface OKXPluginMethods {
  getOkxLiquidity: () => Promise<any>;
  getOkxQuote: (fromTokenAddress: string, toTokenAddress: string, amount: string, slippage?: string) => Promise<any>;
  executeOkxSwap: (fromTokenAddress: string, toTokenAddress: string, amount: string, slippage?: string) => Promise<any>;
  getOkxTokens: () => Promise<any>;
  getOkxChainData: () => Promise<any>;
}

export interface OKXPlugin extends Plugin {
  methods: OKXPluginMethods;
} 