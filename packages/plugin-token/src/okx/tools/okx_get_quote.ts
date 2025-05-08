import axios from "redaxios";
import CryptoJS from "crypto-js";
import { SolanaAgentKit } from "solana-agent-kit";
import { OkxResponse, QuoteResponse } from "../types";

const baseUrl = "https://www.okx.com/api/v5";

export async function okx_get_quote(
  agent: SolanaAgentKit,
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string,
  slippage: string
): Promise<QuoteResponse> {
  try {
    const config = agent.config as any;
    const apiKey = config.OKX_API_KEY;
    const secretKey = config.OKX_SECRET_KEY;
    const apiPassphrase = config.OKX_API_PASSPHRASE;
    const projectId = config.OKX_PROJECT_ID;

    console.log("OKX Config:", {
      hasApiKey: !!apiKey,
      hasSecretKey: !!secretKey,
      hasPassphrase: !!apiPassphrase,
      hasProjectId: !!projectId
    });

    if (!apiKey || !secretKey || !apiPassphrase || !projectId) {
      throw new Error("Missing OKX API credentials");
    }

    const timestamp = new Date().toISOString();
    const path = "/dex/aggregator/quote";
    const params = {
      fromTokenAddress,
      toTokenAddress,
      amount,
      slippage: slippage || "0.5"
    };
    const queryString = "?" + new URLSearchParams(params).toString();

    const stringToSign = timestamp + "GET" + path + queryString;
    const sign = CryptoJS.enc.Base64.stringify(
      CryptoJS.HmacSHA256(stringToSign, secretKey)
    );

    console.log("Making OKX API request:", {
      url: `${baseUrl}${path}`,
      params,
      headers: {
        "Content-Type": "application/json",
        "OK-ACCESS-KEY": apiKey,
        "OK-ACCESS-SIGN": sign,
        "OK-ACCESS-TIMESTAMP": timestamp,
        "OK-ACCESS-PASSPHRASE": apiPassphrase,
        "OK-ACCESS-PROJECT": projectId,
      }
    });

    const response = await axios.get<OkxResponse<QuoteResponse>>(`${baseUrl}${path}`, {
      params,
      headers: {
        "Content-Type": "application/json",
        "OK-ACCESS-KEY": apiKey,
        "OK-ACCESS-SIGN": sign,
        "OK-ACCESS-TIMESTAMP": timestamp,
        "OK-ACCESS-PASSPHRASE": apiPassphrase,
        "OK-ACCESS-PROJECT": projectId,
      }
    });

    console.log("OKX API Response:", response.data);

    if (response.data.code === '0') {
      return response.data.data[0];
    }
    throw new Error(response.data.msg || 'Unknown error');
  } catch (error: any) {
    console.error("OKX API Error Details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config
    });
    throw new Error(`OKX API error: ${error.message}`);
  }
}
