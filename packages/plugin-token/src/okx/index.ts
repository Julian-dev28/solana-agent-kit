import { getOkxLiquidity, getOkxQuote, executeOkxSwap, getOkxTokens, getOkxChainData } from "./tools";
import okxDexChainDataAction from "./actions/chain_data_action";
import okxDexLiquidityAction from "./actions/liquidity_action";
import okxDexQuoteAction from "./actions/quote_action";
import okxDexSwapAction from "./actions/swap_action";

// Export everything from tools and types
export * from "./tools";
export * from "./types";

// Export the actions
export {
  okxDexChainDataAction,
  okxDexLiquidityAction,
  okxDexQuoteAction,
  okxDexSwapAction
};

// Maintain backward compatibility
export const getLiquidity = getOkxLiquidity;
export const getQuote = getOkxQuote;
export const executeSwap = executeOkxSwap;
export const getTokens = getOkxTokens;
export const getChainData = getOkxChainData;

// Export all actions as an array for easy use in plugins
export const okxActions = [
  okxDexChainDataAction,
  okxDexLiquidityAction,
  okxDexQuoteAction,
  okxDexSwapAction
]; 