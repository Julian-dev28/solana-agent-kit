import type { Plugin, SolanaAgentKit } from "solana-agent-kit";

// Import all actions
// dexscreener
import getTokenDataAction from "./dexscreener/actions/getTokenData";

import cancelLimitOrdersAction from "./jupiter/actions/cancelLimitOrders";
import createLimitOrderAction from "./jupiter/actions/createLimitOrder";
// jupiter
import fetchPriceAction from "./jupiter/actions/fetchPrice";
import getLimitOrderHistoryAction from "./jupiter/actions/getLimitOrderHistory";
import getOpenLimitOrdersAction from "./jupiter/actions/getOpenLimitOrders";
import tokenDataByTickerAction from "./jupiter/actions/getTokenDataByTicker";
import stakeWithJupAction from "./jupiter/actions/stakeWithJup";
import tradeAction from "./jupiter/actions/trade";

// lightprotocol
import compressedAirdropAction from "./lightprotocol/actions/compressedAirdrop";

// solana
import balanceAction from "./solana/actions/balance";
import closeEmptyTokenAccountsAction from "./solana/actions/closeEmptyTokenAccounts";
import getTPSAction from "./solana/actions/getTPS";
import requestFundsAction from "./solana/actions/requestFunds";
import tokenBalancesAction from "./solana/actions/tokenBalances";
import transferAction from "./solana/actions/transfer";
import walletAddressAction from "./solana/actions/walletAddress";

// mayan
import mayanSwapAction from "./mayan/actions/swap";

// pumpfun
import launchPumpfunTokenAction from "./pumpfun/actions/launchPumpfunToken";

// pyth
import pythFetchPriceAction from "./pyth/actions/pythFetchPrice";

// rugcheck
import rugcheckAction from "./rugcheck/actions/rugcheck";

// solutiofi
import burnTokensUsingSolutiofiAction from "./solutiofi/actions/burnTokens";
import closeAccountsUsingSolutiofiAction from "./solutiofi/actions/closeAccounts";
import mergeTokensUsingSolutiofiAction from "./solutiofi/actions/mergeTokens";
import spreadTokenUsingSolutiofiAction from "./solutiofi/actions/spreadToken";

// okx
import { 
  okxDexChainDataAction,
  okxDexLiquidityAction,
  okxDexQuoteAction,
  okxDexSwapAction
} from "./okx";


// Import all tools
import {
  getTokenAddressFromTicker,
  getTokenDataByAddress,
} from "./dexscreener/tools";
import {
  cancelLimitOrders as cancelJupiterLimitOrders,
  createLimitOrder as createJupiterLimitOrder,
  fetchPrice,
  getLimitOrderHistory as getJupiterLimitOrderHistory,
  getOpenLimitOrders as getOpenJupiterLimitOrders,
  stakeWithJup,
  trade,
} from "./jupiter/tools";
import { sendCompressedAirdrop } from "./lightprotocol/tools";
import { swap } from "./mayan/tools";
import { launchPumpFunToken } from "./pumpfun/tools";
import { fetchPythPrice, fetchPythPriceFeedID } from "./pyth/tools";
import { fetchTokenDetailedReport, fetchTokenReportSummary } from "./rugcheck";
import {
  closeEmptyTokenAccounts,
  getTPS,
  getWalletAddress,
  get_balance,
  get_balance_other,
  get_token_balance,
  request_faucet_funds,
  transfer,
} from "./solana/tools";
import {
  burnTokens,
  closeAccounts,
  mergeTokens,
  spreadToken,
} from "./solutiofi/tools/solutiofi";

// Define and export the plugin
const TokenPlugin = {
  name: "token",

  // Combine all tools
  methods: {
    getTokenDataByAddress,
    getTokenAddressFromTicker,
    fetchPrice,
    stakeWithJup,
    trade,
    getJupiterLimitOrderHistory,
    createJupiterLimitOrder,
    cancelJupiterLimitOrders,
    getOpenJupiterLimitOrders,
    sendCompressedAirdrop,
    closeEmptyTokenAccounts,
    getTPS,
    get_balance,
    getWalletAddress,
    get_balance_other,
    get_token_balance,
    request_faucet_funds,
    transfer,
    swap,
    launchPumpFunToken,
    fetchPythPrice,
    fetchPythPriceFeedID,
    fetchTokenDetailedReport,
    fetchTokenReportSummary,
    burnTokensUsingSolutiofi: burnTokens,
    closeAccountsUsingSolutiofi: closeAccounts,
    mergeTokensUsingSolutiofi: mergeTokens,
    spreadTokenUsingSolutiofi: spreadToken,
  },

  // Combine all actions
  actions: [
    getTokenDataAction,
    tokenDataByTickerAction,
    fetchPriceAction,
    stakeWithJupAction,
    tradeAction,
    createLimitOrderAction,
    cancelLimitOrdersAction,
    getOpenLimitOrdersAction,
    getLimitOrderHistoryAction,
    compressedAirdropAction,
    balanceAction,
    tokenBalancesAction,
    getTPSAction,
    closeEmptyTokenAccountsAction,
    requestFundsAction,
    transferAction,
    mayanSwapAction,
    launchPumpfunTokenAction,
    pythFetchPriceAction,
    rugcheckAction,
    burnTokensUsingSolutiofiAction,
    spreadTokenUsingSolutiofiAction,
    closeAccountsUsingSolutiofiAction,
    mergeTokensUsingSolutiofiAction,
    walletAddressAction,
    // OKX actions
    okxDexChainDataAction,
    okxDexLiquidityAction,
    okxDexQuoteAction,
    okxDexSwapAction
  ],

  // Initialize function
  initialize: function (agent: SolanaAgentKit): void {
    console.log("Initializing TokenPlugin...");
    console.log("Plugin methods before initialization:", Object.keys(this.methods));
    console.log("Agent methods before initialization:", Object.keys(agent.methods || {}));
    console.log("Plugin actions before initialization:", this.actions.map(a => a.name));
    
    // Initialize all methods with the agent instance
    const methods = this.methods as Record<string, Function>;
    for (const [methodName, method] of Object.entries(methods)) {
      if (typeof method === "function") {
        console.log(`Binding method: ${methodName}`);
        try {
          // Bind the method to the agent instance and store it back in the methods object
          this.methods[methodName] = method.bind(null, agent);
          // Also ensure it's available on the agent's methods
          (agent.methods as Record<string, Function>)[methodName] = this.methods[methodName];
          console.log(`Successfully bound ${methodName}`);
        } catch (error) {
          console.error(`Failed to bind ${methodName}:`, error);
        }
      }
    }
    
    // Ensure actions are properly added to the agent
    if (!agent.actions) {
      agent.actions = [];
    }
    
    // Add all actions to the agent
    for (const action of this.actions) {
      if (!agent.actions.some(a => a.name === action.name)) {
        agent.actions.push(action);
        console.log(`Added action: ${action.name}`);
      }
    }
    
    // Verify OKX actions are present
    const okxActions = agent.actions.filter(a => a.name.startsWith('OKX_DEX_'));
    console.log("OKX actions found:", okxActions.map(a => a.name));
    
    console.log("Plugin methods after initialization:", Object.keys(this.methods));
    console.log("Agent methods after initialization:", Object.keys(agent.methods || {}));
    console.log("Agent actions after initialization:", agent.actions.map(a => a.name));
  },
} satisfies Plugin;

// Default export for convenience
export default TokenPlugin;
