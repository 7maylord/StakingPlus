# StakingPlus DApp

## Overview
This project is a decentralized staking platform that allows users to stake ERC-20 tokens, earn rewards, withdraw their staked funds, and handle emergency withdrawals with penalties. It comprises three key components:

1. **Smart Contract** (Solidity): Manages staking, rewards, withdrawals, and contract state.
2. **Frontend** (React + TypeScript + Ethers.js): Provides a user-friendly interface for interacting with the staking contract.
3. **Subgraph** (The Graph): Indexes on-chain data to provide efficient querying of staking-related events.

---

## 1. Smart Contract

### Features:
- Users can **stake tokens** and earn rewards based on APR.
- Staked tokens are subject to a **minimum lock duration**.
- Rewards are distributed dynamically and decrease as more tokens are staked.
- Users can **withdraw** staked tokens after the lock duration.
- **Emergency withdrawal** allows users to retrieve their tokens early but with a penalty.
- **Claim rewards** separately without withdrawing the stake.
- **Admin functions** to pause/unpause staking and modify key parameters.

### Deployment
The smart contract is deployed on the **Sepolia testnet**.
The Frontend is deployed at **[staking-plus.vercel.app](https://staking-plus.vercel.app/)** 

#### Smart Contract Address:
```
0xE574459B88a47b0B223468e677920C62E77A56AC
```
#### Token Contract Address:
```
0xf7A878a60Bd518B6DE696bAb141747Bcd2451C07
```

#### Events Indexed:
- `Staked`
- `Withdrawn`
- `RewardsClaimed`
- `RewardRateUpdated`
- `EmergencyWithdrawn`
- `StakingInitialized`
- `StakingPaused`
- `StakingUnpaused`
- `TokenRecovered`

---

## 2. Frontend (React + TypeScript)

### Tech Stack:
- **React** with **Vite** for a fast development experience.
- **Ethers.js v6** for blockchain interactions.
- **Apollo Client** for GraphQL queries (subgraph integration).
- **Tailwind CSS** for styling.
- **React-Toastify** for notifications.

### Features:
- **Connect Wallet:** Users can connect their wallet and interact with the staking contract.
- **Stake Tokens:** Enter the amount of tokens to stake, check allowance, and approve tokens if needed.
- **Withdraw Tokens:** Withdraw staked tokens after the lock period.
- **Claim Rewards:** Collect earned rewards without withdrawing the stake.
- **Emergency Withdraw:** Allows immediate withdrawal with a penalty.
- **Live Stats:** Displays total staked tokens, pending rewards, and current APR.
- **Transaction Feedback:** Success/failure messages for blockchain interactions.

### Setup

#### Clone the repository:
   ```sh
   git clone https://github.com/7maylord/StakingPlus.git
   cd StakingPlud
   cd Frontend
   ```
#### Install Dependencies
    ```sh
    yarn install
    ```
#### Environment Variables
    Create a `.env` file and configure:
    ```
    VITE_STAKING_CONTRACT_ADDRESS=0xE574459B88a47b0B223468e677920C62E77A56AC
    VITE_GRAPHQL_ENDPOINT=<Your_Subgraph_URL>
    ```
#### Run Frontend
    ```sh
    yarn run dev
    ```

---

## 3. Subgraph (The Graph)

### Purpose:
The subgraph indexes blockchain events and enables fast queries of staking data.

### Schema:
Defines entities such as:
- `User`: Stores staking details per user.
- `StakePosition`: Tracks individual stake amounts and timestamps.
- `Withdrawal`: Logs withdrawal transactions.
- `RewardClaimed`: Records claimed rewards.

### Subgraph Configuration (`subgraph.yaml`):
```yaml
specVersion: 1.2.0
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum
    name: StakingContract
    network: sepolia
    source:
      address: "0xE574459B88a47b0B223468e677920C62E77A56AC"
      abi: StakingContract
      startBlock: 7955247
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.9
      language: wasm/assemblyscript
      entities:
        - User
        - StakePosition
        - Withdrawal
        - RewardClaimed
      abis:
        - name: StakingContract
          file: ./abis/StakingContract.json
      eventHandlers:
        - event: Staked(indexed address,uint256,uint256,uint256,uint256)
          handler: handleStaked
        - event: Withdrawn(indexed address,uint256,uint256,uint256,uint256,uint256)
          handler: handleWithdrawn
        - event: RewardsClaimed(indexed address,uint256,uint256,uint256,uint256)
          handler: handleRewardsClaimed
        - event: EmergencyWithdrawn(indexed address,uint256,uint256,uint256,uint256)
          handler: handleEmergencyWithdrawn
      file: ./src/staking-contract.ts
```

### Deploying the Subgraph
1. Install Graph CLI:
   ```sh
   npm install -g @graphprotocol/graph-cli
   ```
2. Authenticate (if required):
   ```sh
   graph auth --product hosted-service <ACCESS_TOKEN>
   ```
3. cd stakingsubgraph

4. Generate Typings and Build
    ```sh
   graph codegen && graph build
   ```

5. Deploy:
   ```sh
   graph deploy --studio stakingsubgraph
   ```

---

## Author
Developed by **[MayLord](https://github.com/7maylord)**. 
This README provides an in-depth overview of the staking dApp, covering contract functionality, frontend, and subgraph integration. Feel free to contribute and improve the project!

##  Future Improvements
- **UI Enhancements**: Improve UX with better data visualization.
- **Multiple Tokens**: Support staking for multiple ERC-20 tokens.

---

Happy coding! 🚀