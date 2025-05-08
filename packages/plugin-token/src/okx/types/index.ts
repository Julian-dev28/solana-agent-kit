export interface OkxResponse<T> {
  code: string;
  msg: string;
  data: T[];
}

export interface TokenInfo {
  tokenContractAddress: string;
  tokenSymbol: string;
  tokenUnitPrice: string | null;
  decimal: string;
  isHoneyPot: boolean;
  taxRate: string;
}

export interface DexProtocol {
  dexName: string;
  percent: string;
}

export interface SubRouter {
  dexProtocol: DexProtocol[];
  fromToken: TokenInfo;
  toToken: TokenInfo;
}

export interface DexRouter {
  router: string;
  routerPercent: string;
  subRouterList: SubRouter[];
}

export interface QuoteCompare {
  dexName: string;
  dexLogo: string;
  tradeFee: string;
  amountOut: string;
  priceImpactPercentage?: string;
}

export interface QuoteResponse {
  chainIndex: string;
  chainId: string;
  dexRouterList: DexRouter[];
  fromToken: TokenInfo;
  toToken: TokenInfo;
  fromTokenAmount: string;
  toTokenAmount: string;
  originToTokenAmount: string;
  priceImpactPercentage: string;
  tradeFee: string;
  estimateGasFee: string;
  quoteCompareList: QuoteCompare[];
}

export interface QuoteRequestParams {
  chainIndex?: string;
  chainId?: string;
  amount: string;
  fromTokenAddress: string;
  toTokenAddress: string;
  dexIds?: string;
  directRoute?: boolean;
  priceImpactProtectionPercentage?: string;
  feePercent?: string;
} 