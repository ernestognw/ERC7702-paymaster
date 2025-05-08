# Delegated Paymaster

This project demonstrates a simplified approach to transaction sponsorship by combining ERC-7702 (Set Code for EOAs) and ERC-4337 (Account Abstraction) standards. It enables EOAs to sponsor transactions for other EOAs in a straightforward manner.

## Overview

Traditional gas sponsorship solutions are complex to implement and configure. This project addresses this challenge by using ERC-7702's delegation capability combined with a paymaster implementation, creating a simpler sponsorship mechanism.

## Features

- **EOA-to-EOA Sponsorship**: Enable one EOA to pay for another EOA's transactions
- **ERC-7702 Integration**: Leverage the ability for EOAs to delegate to contract code
- **Simplified Paymaster**: Implementation of a paymaster compatible with ERC-7702 signatures
- **EntryPoint Compatibility**: Works with the standard ERC-4337 EntryPoint

## How It Works

1. A sponsoring EOA delegates to the paymaster contract using ERC-7702
2. The sponsor signs an authorization for specific transactions they want to sponsor
3. The user includes this signature in their UserOperation's `paymasterAndData` field
4. The paymaster verifies the signature and pays for the transaction on behalf of the sponsor

## Project Structure

- `contracts/`: Smart contract implementations
  - `AccountERC7702.sol`: ERC-7702 compatible smart account
  - `PaymasterERC7702.sol`: Paymaster implementation for ERC-7702 accounts
- `tasks/`: Hardhat tasks for testing functionality
  - `erc7702.ts`: Task demonstrating EOA sponsorship using ERC-7702
- `ignition/`: Hardhat Ignition deployment modules

## Getting Started

### Prerequisites

- Node.js
- Hardhat
- An Ethereum EOA with testnet ETH (i.e the Paymaster)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Deployment

Deploy contracts to a testnet:

```bash
npx hardhat ignition deploy ./ignition/modules/PaymasterERC7702.ts --network sepolia
```

## Usage Example

The following task demonstrates how to use the delegated paymaster:

```bash
npx hardhat erc7702Paymaster --network sepolia
```

This task:
- Creates an ERC-7702 account
- Configures a paymaster with ERC-7702 signatures
- Executes a transaction where one EOA sponsors another EOA's transaction fees

## License

This project is licensed under the MIT License.
