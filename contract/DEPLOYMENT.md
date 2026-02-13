# GameVault Contract Deployment Guide

## Prerequisites

1. Install Foundry:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

2. Install Node.js dependencies in contract folder:
```bash
cd /home/teak/code/monomons/contract
npm install
# or
yarn install
```

## Configuration

1. Create `.env` file in `/home/teak/code/monomons/contract/`:
```env
PRIVATE_KEY=your_private_key_here
RPC_URL=https://testnet-rpc.monad.xyz
```

**Important:** Make sure your wallet has:
- MON tokens for gas (get from Monad faucet)
- Will be set as the admin of the contract

## Deployment Steps

### 1. Compile the Contract
```bash
cd /home/teak/code/monomons/contract
forge build
```

### 2. Deploy to Monad Testnet
```bash
source .env
forge script script/Deploy.s.sol:DeployGameVault \
    --rpc-url $RPC_URL \
    --broadcast \
    --verify
```

### 3. Save the Contract Address
After deployment, you'll see output like:
```
GameVault deployed at: 0x1234...
Admin: 0xYourAddress...
```

**Copy this address and update it in:**
- `/home/teak/code/monomons/backend/src/services/betting.service.ts` (line 20)
- `/home/teak/code/monomons/frontend/src/pages/DojoPage.tsx` (line 19)
- `/home/teak/code/monomons/frontend/src/lib/utils.ts` (line 8)

## Post-Deployment Setup

### 1. Set ADMIN_PRIVATE_KEY in Backend
In `/home/teak/code/monomons/backend/.env`:
```env
ADMIN_PRIVATE_KEY=your_private_key_here
```

This must be the same key used to deploy the contract (the admin).

### 2. Verify Contract on Explorer (Optional)
```bash
forge verify-contract \
    --chain-id 10143 \
    --watch \
    YOUR_CONTRACT_ADDRESS \
    src/GameVault.sol:GameVault
```

## Contract Functions

### For Players (Frontend)
- `deposit(string gameId)` - payable, deposits MON into game pool

### For Admin (Backend)
- `withdrawFromGame(string gameId, uint256 amount, address recipient)` - pays winners
- `endGame(string gameId)` - closes game, sends remaining to admin

### Read Functions
- `getGameBalance(string gameId)` - get pool balance
- `getTotalDeposits()` - get total across all games
- `isGameActive(string gameId)` - check if game is active

## Testing

1. Fund the contract by placing bets from the frontend
2. Watch the backend console for withdrawal logs
3. Verify winners receive payouts
4. Check that remaining funds go to admin when game ends

## Troubleshooting

**"Insufficient funds" error:**
- Get MON from Monad Testnet faucet: https://testnet.monad.xyz/faucet

**"Only admin can call this" error:**
- Make sure ADMIN_PRIVATE_KEY in backend matches the deployer address

**Contract calls failing:**
- Verify CONTRACT_ADDRESS is updated everywhere
- Check RPC_URL is working: `curl $RPC_URL`

## Contract Address (After Deployment)

Update this section after deploying:

**Network:** Monad Testnet (Chain ID: 10143)  
**Contract Address:** `0x...` (update after deployment)  
**Admin Address:** `0x...` (your deployer address)  
**Deployed At:** 2024-...
