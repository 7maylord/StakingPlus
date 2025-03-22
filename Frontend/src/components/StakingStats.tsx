import { ethers } from "ethers";

interface StakingStatsProps {
  user: {
    stakedAmount: string;
    pendingRewards: string;
    stakes: {
      id: string;
      amount: string;
      timestamp: string;
      unlockTime: string;
    }[];
  };
  protocol: {
    currentRewardRate: string;
    totalStaked: string;
    totalRewardsDistributed: string;
  };
}

export default function StakingStats({ user, protocol }: StakingStatsProps) {
  // Calculate time until unlock for the latest stake
  const latestStake = user.stakes[user.stakes.length - 1];
  const timeUntilUnlock = latestStake ? Math.max(0, parseInt(latestStake.unlockTime) - Math.floor(Date.now() / 1000)) : 0;

  return (
    <div className="bg-gray-400 rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Staking Statistics</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-black">Current Staking Position</p>
          <p className="text-lg font-semibold">
            {ethers.formatEther(user.stakedAmount || "0")} STK
          </p>
        </div>
        <div>
          <p className="text-sm text-black">Pending Rewards</p>
          <p className="text-lg font-semibold">
            {ethers.formatEther(user.pendingRewards || "0")} STK
          </p>
        </div>
        <div>
          <p className="text-sm text-black">Time Until Unlock</p>
          <p className="text-lg font-semibold">
            {timeUntilUnlock > 0 ? `${timeUntilUnlock / 86400} Days` : "Unlocked"}
          </p>
        </div>
        <div>
          <p className="text-sm text-black">Current APR</p>
          <p className="text-lg font-semibold">{protocol.currentRewardRate}%</p>
        </div>
        <div>
          <p className="text-sm text-black">Total Staked</p>
          <p className="text-lg font-semibold">
            {ethers.formatEther(protocol.totalStaked || "0")} STK
          </p>
        </div>
        <div>
          <p className="text-sm text-black">Total Rewards Distributed</p>
          <p className="text-lg font-semibold">
            {ethers.formatEther(protocol.totalRewardsDistributed || "0")} STK
          </p>
        </div>
      </div>
    </div>
  );
}