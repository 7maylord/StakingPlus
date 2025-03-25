import { BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  EmergencyWithdrawn as EmergencyWithdrawnEvent,
  RewardRateUpdated as RewardRateUpdatedEvent,
  RewardsClaimed as RewardsClaimedEvent,
  Staked as StakedEvent,
  StakingInitialized as StakingInitializedEvent,
  StakingPaused as StakingPausedEvent,
  StakingUnpaused as StakingUnpausedEvent,
  TokenRecovered as TokenRecoveredEvent,
  Withdrawn as WithdrawnEvent,
} from "../generated/StakingContract/StakingContract";
import {
  User,
  Protocol,
  StakePosition,
  Withdrawal,
  RewardClaimed,
  EmergencyWithdrawn,
  RewardRateUpdated,
  StakingInitialized,
  StakingPaused,
  StakingUnpaused,
  TokenRecovered,
} from "../generated/schema";

// Helper function to load or create a User entity
function getOrCreateUser(address: string): User {
  let user = User.load(address);
  if (!user) {
    user = new User(address);
    user.stakedAmount = BigInt.fromI32(0);
    user.pendingRewards = BigInt.fromI32(0);
    user.lastStakeTimestamp = BigInt.fromI32(0);
    user.save();
  }
  return user;
}

// Helper function to load or create a Protocol entity
function getOrCreateProtocol(): Protocol {
  let protocol = Protocol.load("1");
  if (!protocol) {
    protocol = new Protocol("1");
    protocol.totalStaked = BigInt.fromI32(0);
    protocol.currentRewardRate = BigInt.fromI32(0);
    protocol.totalRewardsDistributed = BigInt.fromI32(0);
    protocol.minLockDuration = BigInt.fromI32(86400)
    protocol.save();
  }
  return protocol;
}

export function handleStaked(event: StakedEvent): void {
  // Update User entity
  let user = getOrCreateUser(event.params.user.toHex());
  user.stakedAmount = user.stakedAmount.plus(event.params.amount);
  user.lastStakeTimestamp = event.block.timestamp;
  user.save();

  // Fetch minLockDuration from the Protocol entity
  let protocol = getOrCreateProtocol();
  const unlockTime = event.block.timestamp.plus(protocol.minLockDuration);

  // Create a new Stake entity
  let stakePosition = new StakePosition(event.transaction.hash.toHex());
  stakePosition.user = user.id;
  stakePosition.amount = event.params.amount;
  stakePosition.timestamp = event.block.timestamp;
  stakePosition.unlockTime = unlockTime; // Set unlockTime
  stakePosition.totalStaked = event.params.newTotalStaked;
  stakePosition.transactionHash = event.transaction.hash;
  stakePosition.currentRewardRate = event.params.currentRewardRate;
  stakePosition.status = "active";
  stakePosition.save();

  // Update Protocol entity
  protocol.totalStaked = event.params.newTotalStaked;
  protocol.currentRewardRate = event.params.currentRewardRate;
  protocol.save();
}

export function handleWithdrawn(event: WithdrawnEvent): void {
  // Update User entity
  let user = getOrCreateUser(event.params.user.toHex());
  user.stakedAmount = user.stakedAmount.minus(event.params.amount);
  user.save();

  // Create a new Withdrawal entity
  let withdrawal = new Withdrawal(event.transaction.hash.toHex());
  withdrawal.user = user.id;
  withdrawal.amount = event.params.amount;
  withdrawal.timestamp = event.block.timestamp;
  withdrawal.totalStaked = event.params.newTotalStaked;
  withdrawal.currentRewardRate = event.params.currentRewardRate;
  withdrawal.save();

  let stakePosition = StakePosition.load(event.transaction.hash.toHex());
  if (stakePosition) {
    stakePosition.status = "withdrawn"; // Set status to "withdrawn"
    stakePosition.save();
  }

  // Update Protocol entity
  let protocol = getOrCreateProtocol();
  protocol.totalStaked = event.params.newTotalStaked;
  protocol.save();
}

export function handleRewardsClaimed(event: RewardsClaimedEvent): void {
  // Update User entity
  let user = getOrCreateUser(event.params.user.toHex());
  user.pendingRewards = event.params.newPendingRewards;
  user.save();

  // Create a new RewardClaimed entity
  let rewardClaimed = new RewardClaimed(event.transaction.hash.toHex());
  rewardClaimed.user = user.id;
  rewardClaimed.amount = event.params.amount;
  rewardClaimed.timestamp = event.block.timestamp;
  rewardClaimed.totalStaked = event.params.totalStaked;
  rewardClaimed.save();

  // Update Protocol entity
  let protocol = getOrCreateProtocol();
  protocol.totalRewardsDistributed = protocol.totalRewardsDistributed.plus(event.params.amount);
  protocol.save();
}

export function handleEmergencyWithdrawn(event: EmergencyWithdrawnEvent): void {
  // Update User entity
  let user = getOrCreateUser(event.params.user.toHex());
  user.stakedAmount = BigInt.fromI32(0);
  user.save();

  // Create a new EmergencyWithdrawn entity
  let emergencyWithdrawn = new EmergencyWithdrawn(event.transaction.hash.toHex());
  emergencyWithdrawn.user = user.id;
  emergencyWithdrawn.amount = event.params.amount;
  emergencyWithdrawn.penalty = event.params.penalty;
  emergencyWithdrawn.timestamp = event.block.timestamp;
  emergencyWithdrawn.totalStaked = event.params.newTotalStaked;
  emergencyWithdrawn.save();

  let stakePosition = StakePosition.load(event.transaction.hash.toHex());
  if (stakePosition) {
    stakePosition.status = "withdrawn"; // Set status to "withdrawn"
    stakePosition.save();
  }
  // Update Protocol entity
  let protocol = getOrCreateProtocol();
  protocol.totalStaked = event.params.newTotalStaked;
  protocol.save();
}

export function handleRewardRateUpdated(event: RewardRateUpdatedEvent): void {
  // Update Protocol entity
  let protocol = getOrCreateProtocol();
  protocol.currentRewardRate = event.params.newRate;
  protocol.save();

  // Create a new RewardRateUpdated entity
  let rewardRateUpdated = new RewardRateUpdated(event.transaction.hash.toHex());
  rewardRateUpdated.oldRate = event.params.oldRate;
  rewardRateUpdated.newRate = event.params.newRate;
  rewardRateUpdated.timestamp = event.block.timestamp;
  rewardRateUpdated.totalStaked = event.params.totalStaked;
  rewardRateUpdated.save();
}

export function handleStakingInitialized(event: StakingInitializedEvent): void {
  // Create a new StakingInitialized entity
  let stakingInitialized = new StakingInitialized(event.transaction.hash.toHex());
  stakingInitialized.stakingToken = event.params.stakingToken;
  stakingInitialized.initialRewardRate = event.params.initialRewardRate;
  stakingInitialized.timestamp = event.block.timestamp;
  stakingInitialized.save();

  // Initialize Protocol entity
  let protocol = getOrCreateProtocol();
  protocol.currentRewardRate = event.params.initialRewardRate;
  protocol.minLockDuration = BigInt.fromI32(86400); // Set minLockDuration (1 day)
  protocol.save();
}

export function handleStakingPaused(event: StakingPausedEvent): void {
  // Create a new StakingPaused entity
  let stakingPaused = new StakingPaused(event.transaction.hash.toHex());
  stakingPaused.timestamp = event.block.timestamp;
  stakingPaused.transactionHash = event.transaction.hash;
  stakingPaused.save();
}

export function handleStakingUnpaused(event: StakingUnpausedEvent): void {
  // Create a new StakingUnpaused entity
  let stakingUnpaused = new StakingUnpaused(event.transaction.hash.toHex());
  stakingUnpaused.timestamp = event.block.timestamp;
  stakingUnpaused.transactionHash = event.transaction.hash;
  stakingUnpaused.save();
}

export function handleTokenRecovered(event: TokenRecoveredEvent): void {
  // Create a new TokenRecovered entity
  let tokenRecovered = new TokenRecovered(event.transaction.hash.toHex());
  tokenRecovered.token = event.params.token;
  tokenRecovered.amount = event.params.amount;
  tokenRecovered.timestamp = event.block.timestamp;
  tokenRecovered.save();
}