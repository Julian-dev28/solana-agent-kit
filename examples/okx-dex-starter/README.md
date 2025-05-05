# OKX DEX Starter

A starter project for using OKX DEX with Solana Agent Kit. This project provides a simple CLI interface for executing token swaps on OKX DEX.

## Prerequisites

- Node.js (v16 or higher)
- pnpm (recommended) or npm
- [OKX API credentials](https://web3.okx.com/build/dev-portal)
  - API Key
  - Secret Key
  - Passphrase
- Solana wallet with private key

## Setup

1. Clone the repository and navigate to the starter directory:
```bash
cd examples/okx-dex-starter
```

2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env` file with your credentials:
```env
# Required
OKX_SOLANA_PRIVATE_KEY=your_private_key_here
OKX_SOLANA_WALLET_ADDRESS=your_wallet_address_here
OKX_API_KEY=your_api_key_here
OKX_SECRET_KEY=your_secret_key_here
OKX_API_PASSPHRASE=your_passphrase_here
OKX_PROJECT_ID=your_project_id_here

# Optional
RPC_URL=https://api.mainnet-beta.solana.com
OPENAI_API_KEY=your_openai_key_here  # Only needed if using AI features
```

## Usage

Start the trading bot:
```bash
pnpm start
```

### Available Commands

- `swap [amount] [from_token] to [to_token]` - Execute a token swap
  Example: `swap 0.1 SOL to USDC`

- `quote [amount] [from_token] to [to_token]` - Get a quote without executing
  Example: `quote 0.1 SOL to USDC`

- `confirm` - Confirm the last quote and execute the swap

- `cancel` - Cancel the current swap

- `tokens` - List available tokens on Solana 

- `help` - Show available commands

- `exit` - Exit the bot

### Supported Tokens

The bot comes pre-configured with these common tokens:
- SOL: `11111111111111111111111111111111`
- USDC: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- USDT: `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB`

## Features

- Automatic slippage handling
- Token discovery for unknown tokens
- Human-readable amount formatting
- Detailed quote information including price impact
- Transaction status tracking
- Base58 validation for addresses and keys

## Error Handling

The bot includes comprehensive error handling for:
- Invalid token addresses
- Insufficient liquidity
- Invalid amounts
- Base58 encoding issues
- API errors

## Development

The project uses TypeScript and includes type definitions for all major components. Key files:

- `index.ts` - Main bot implementation
- `package.json` - Project configuration and dependencies

## License

MIT 