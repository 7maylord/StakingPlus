import { ethers } from "ethers";
import STAKING_CONTRACT_ABI from "../abi/StakingContract.json"
import TOKEN_CONTRACT_ABI from "../abi/TokenContract.json"

const STAKING_CONTRACT_ADDRESS = import.meta.env.VITE_STAKING_CONTRACT_ADDRESS as string;
const TOKEN_CONTRACT_ADDRESS = import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS as string;

export const getStakingContract = (signer: ethers.Signer) => {
  return new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_CONTRACT_ABI, signer);
};

export const getTokenContract = (signer: ethers.Signer) => {
    return new ethers.Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, signer);
  };  

export const checkAllowance = async (signer: ethers.Signer, owner: string, spender: string) => {
    const tokenContract = getTokenContract(signer);
    const allowance = await tokenContract.allowance(owner, spender);
    return allowance;
  };

export const approveTokens = async (signer: ethers.Signer, spender: string, amount: bigint) => {
    const tokenContract = getTokenContract(signer);
    const tx = await tokenContract.approve(spender, amount);
    await tx.wait();
  };

export const checkContractState = async (signer: ethers.Signer) => {
    const contract = getStakingContract(signer);
    const isPaused = await contract.paused();
    return isPaused;
  };

export const stake = async (signer: ethers.Signer, amount: bigint) => {
  const contract = getStakingContract(signer);
  const tx = await contract.stake(amount);
  await tx.wait();
};

export const withdraw = async (signer: ethers.Signer, amount: bigint) => {
  const contract = getStakingContract(signer);
  const tx = await contract.withdraw(amount);
  await tx.wait();
};

export const claimRewards = async (signer: ethers.Signer) => {
  const contract = getStakingContract(signer);
  const tx = await contract.claimRewards();
  await tx.wait();
};

export const emergencyWithdraw = async (signer: ethers.Signer) => {
  const contract = getStakingContract(signer);
  const tx = await contract.emergencyWithdraw();
  await tx.wait();
};