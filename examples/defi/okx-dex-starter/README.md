# OKX DEX Starter

This example demonstrates how to use the Solana Agent Kit with OKX DEX for token swaps.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

3. Build the project:
```bash
pnpm build
```

4. Run the example:
```bash
pnpm start
```

## Environment Variables

- `RPC_URL`: Your Solana RPC URL
- `SOLANA_PRIVATE_KEY`: Your Solana private key in base58 format
- `OPENAI_API_KEY`: Your OpenAI API key
- `OKX_API_KEY`: Your OKX API key
- `OKX_SECRET_KEY`: Your OKX secret key
- `OKX_API_PASSPHRASE`: Your OKX API passphrase
- `OKX_PROJECT_ID`: Your OKX project ID

## Usage

The example provides a chat interface where you can:

1. Get quotes for token swaps
2. Execute token swaps
3. View token information
4. Check balances

Example commands:
- `quote 0.1 SOL to USDC`
- `swap 0.1 SOL to USDC`
- `tokens`
- `help`

## Features

- Token price quotes
- Token swaps
- Balance checking
- Token discovery
- Price impact protection
- Multiple DEX routing 