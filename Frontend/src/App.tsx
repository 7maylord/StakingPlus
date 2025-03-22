import { useState } from "react";
import { useWallet } from "./hooks/useWallet";
import { GET_USER_DATA } from "./utils/queries";
import { useQuery } from "@apollo/client";
import { ethers } from "ethers";
import {
  stake,
  withdraw,
  claimRewards,
  emergencyWithdraw,
  checkAllowance,
  approveTokens,
  checkContractState,
} from "./utils/contract";

interface Stake {
  id: string;
  amount: string;
  unlockTime: number;
}

function App() {
  const { signer, walletAddress, connectWallet } = useWallet();
  const [amount, setAmount] = useState("");

  const { data, loading, error } = useQuery(GET_USER_DATA, {
    variables: { user: walletAddress?.toLowerCase() },
    skip: !walletAddress,
  });
  const STAKING_CONTRACT_ADDRESS = import.meta.env
    .VITE_STAKING_CONTRACT_ADDRESS as string;

    const handleStake = async () => {
      if (signer && amount) {
        const parsedAmount = ethers.parseEther(amount);
        const owner = await signer.getAddress();
    
        // Check allowance
        const allowance = await checkAllowance(signer, owner, STAKING_CONTRACT_ADDRESS);
        if (allowance.lt(parsedAmount)) {
          console.log("Approving tokens...");
          await approveTokens(signer, STAKING_CONTRACT_ADDRESS, parsedAmount);
        }
    
        // Check contract state
        const isPaused = await checkContractState(signer);
        if (isPaused) {
          console.error("Contract is paused");
          return;
        }
    
        // Stake tokens
        console.log("Staking amount:", parsedAmount.toString());
        try {
          await stake(signer, parsedAmount);
          setAmount("");
        } catch (error) {
          if (error instanceof Error && (error as any).data) {
            const decodedError = ethers.toUtf8String((error as any).data);
            console.error("Contract revert reason:", decodedError);
          } else {
            console.error("Staking failed:", error);
          }
        }
      }
    };

  const handleWithdraw = async () => {
    if (signer && amount) {
      await withdraw(signer, ethers.parseEther(amount));
      setAmount("");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Staking dApp</h1>
      {!walletAddress ? (
        <button
          onClick={connectWallet}
          className="bg-blue-500 text-white p-2 rounded"
        >
          Connect Wallet
        </button>
      ) : (
        <div>
          <p>Connected: {walletAddress}</p>
          <div className="mt-4">
            <h2 className="text-xl font-bold">Stake</h2>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border p-2"
              placeholder="Amount"
            />
            <button
              onClick={handleStake}
              className="bg-green-500 text-white p-2 rounded ml-2"
            >
              Stake
            </button>
          </div>
          <div className="mt-4">
            <h2 className="text-xl font-bold">Withdraw</h2>
            <button
              onClick={handleWithdraw}
              className="bg-red-500 text-white p-2 rounded"
            >
              Withdraw
            </button>
          </div>
          <div className="mt-4">
            <h2 className="text-xl font-bold">Claim Rewards</h2>
            <button
              onClick={() => claimRewards(signer!)}
              className="bg-yellow-500 text-white p-2 rounded"
            >
              Claim Rewards
            </button>
          </div>
          <div className="mt-4">
            <h2 className="text-xl font-bold">Emergency Withdraw</h2>
            <button
              onClick={() => emergencyWithdraw(signer!)}
              className="bg-purple-500 text-white p-2 rounded"
            >
              Emergency Withdraw
            </button>
          </div>
          <div className="mt-4">
            <h2 className="text-xl font-bold">Your Stakes</h2>
            {data?.user ? (
              data.user.stakes.map((stake: Stake) => (
                <div key={stake.id} className="border p-2 mt-2">
                  <p>Amount: {ethers.formatEther(stake.amount)}</p>
                  <p>
                    Unlock Time:{" "}
                    {new Date(stake.unlockTime * 1000).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p>No stakes found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
