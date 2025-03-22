import { gql } from "@apollo/client";

export const GET_USER_DATA = gql`
  query GetUserData($user: ID!) {
    user(id: $user) {
      stakedAmount
      pendingRewards
      stakes {
        id
        amount
        timestamp
        unlockTime
        status
      }
      rewardsClaimed {
        id
        amount
        timestamp
      }
    }
    protocol(id: "1") {
      totalStaked
      currentRewardRate
      totalRewardsDistributed
      minLockDuration
    }
  }
`;