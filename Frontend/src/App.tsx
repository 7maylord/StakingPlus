import { useState } from "react";
import { useWallet } from "./hooks/useWallet";
import { GET_USER_DATA } from "./utils/queries";
import { useQuery } from "@apollo/client";
import { ethers } from "ethers";
import { stake, withdraw, claimRewards, emergencyWithdraw, checkAllowance, approveTokens, checkContractState } from "./utils/contract";
import { ToastContainer, toast } from "react-toastify";
import StakingStats from "./components/StakingStats"

interface Stake {
  id: string;
  amount: string;
  unlockTime: number;
}

function App() {
  const { signer, walletAddress, connectWallet } = useWallet();
  const [amountD, setAmountD] = useState("");
  const [amountW, setAmountW] = useState("");
  const [isStaking, setIsStaking] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isClaimingRewards, setIsClaimingRewards] = useState(false);
  const [isEmergencyWithdrawing, setIsEmergencyWithdrawing] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_USER_DATA, {
    variables: { user: walletAddress?.toLowerCase() },
    skip: !walletAddress,
  });
  console.log("Stakes Data:", data?.user?.stakes);
  //console.log("Data:", data); // Debug the data
  //console.log("Loading:", loading); // Debug the loading state
  //console.log("Error:", error); // Debug any errors
  
  const STAKING_CONTRACT_ADDRESS = import.meta.env.VITE_STAKING_CONTRACT_ADDRESS as string;

  const handleStake = async () => {
    if (!signer || !amountD) {
      toast.error("Please enter an amount to stake");
      return;
    }
    
    setIsStaking(true);
    const toastId = toast.loading("Preparing to stake tokens...");
    
    try {
      const parsedAmount = ethers.parseEther(amountD);
      const owner = await signer.getAddress();
      
      // Using provider from signer for read operation
      const provider = signer.provider;
      
      toast.update(toastId, { 
        render: "Checking allowance...", 
        type: "info", 
        isLoading: true 
      });
      
      const allowance = await checkAllowance(provider, owner, STAKING_CONTRACT_ADDRESS);
      
      if (allowance < parsedAmount) {
        toast.update(toastId, { 
          render: "Approving tokens...", 
          type: "info", 
          isLoading: true 
        });
        
        await approveTokens(signer, STAKING_CONTRACT_ADDRESS, parsedAmount);
        toast.update(toastId, { 
          render: "Tokens approved successfully!", 
          type: "success", 
          isLoading: false,
          autoClose: 3000
        });
        
        // Create a new toast for staking process
        const stakeToastId = toast.loading("Preparing to stake tokens...");
        
        // Check contract state
        const isPaused = await checkContractState(signer);
        if (isPaused) {
          toast.update(stakeToastId, { 
            render: "Contract is currently paused. Please try again later.", 
            type: "error", 
            isLoading: false,
            autoClose: 5000
          });
          setIsStaking(false);
          return;
        }
        
        toast.update(stakeToastId, { 
          render: "Staking tokens...", 
          type: "info", 
          isLoading: true 
        });
        
        await stake(signer, parsedAmount);
        toast.update(stakeToastId, { 
          render: `Successfully staked ${amountD} tokens!`, 
          type: "success", 
          isLoading: false,
          autoClose: 5000
        });
        
        setAmountD("");
        refetch(); // Refresh user data
      } else {
        // Check contract state
        const isPaused = await checkContractState(signer);
        if (isPaused) {
          toast.update(toastId, { 
            render: "Contract is currently paused. Please try again later.", 
            type: "error", 
            isLoading: false,
            autoClose: 5000
          });
          setIsStaking(false);
          return;
        }
        
        toast.update(toastId, { 
          render: "Staking tokens...", 
          type: "info", 
          isLoading: true 
        });
        
        await stake(signer, parsedAmount);
        toast.update(toastId, { 
          render: `Successfully staked ${amountD} tokens!`, 
          type: "success", 
          isLoading: false,
          autoClose: 5000
        });
        
        setAmountD("");
        refetch(); // Refresh user data
      }
    } catch (error) {
      if (error instanceof Error && (error as any).data) {
        try {
          const decodedError = ethers.toUtf8String((error as any).data);
          toast.update(toastId, { 
            render: `Staking failed: ${decodedError}`, 
            type: "error", 
            isLoading: false,
            autoClose: 5000
          });
        } catch (e) {
          toast.update(toastId, { 
            render: "Staking failed: Contract error", 
            type: "error", 
            isLoading: false,
            autoClose: 5000
          });
        }
      } else {
        toast.update(toastId, { 
          render: `Staking failed: ${error instanceof Error ? error.message : "Unknown error"}`, 
          type: "error", 
          isLoading: false,
          autoClose: 5000
        });
      }
      console.error("Staking failed:", error);
    } finally {
      setIsStaking(false);
    }
  };

  const handleWithdraw = async () => {
    if (!signer || !amountW) {
      toast.error("Please enter an amount to withdraw");
      return;
    }
    
    setIsWithdrawing(true);
    const toastId = toast.loading("Preparing to withdraw tokens...");
    
    try {
      const parsedAmount = ethers.parseEther(amountW);
      
      // Check contract state
      const isPaused = await checkContractState(signer);
      if (isPaused) {
        toast.update(toastId, { 
          render: "Contract is currently paused. Please try again later.", 
          type: "error", 
          isLoading: false,
          autoClose: 5000
        });
        setIsWithdrawing(false);
        return;
      }
      
      toast.update(toastId, { 
        render: "Withdrawing tokens...", 
        type: "info", 
        isLoading: true,
        autoClose: 1000
      });
      
      await withdraw(signer, parsedAmount);
      toast.update(toastId, { 
        render: `Successfully withdrew ${amountW} tokens!`, 
        type: "success", 
        isLoading: false,
        autoClose: 5000
      });
      
      setAmountW("");
      refetch(); // Refresh user data
    } catch (error) {
      if (error instanceof Error && (error as any).data) {
        try {
          const decodedError = ethers.toUtf8String((error as any).data);
          toast.update(toastId, { 
            render: `Withdrawal failed: ${decodedError}`, 
            type: "error", 
            isLoading: false,
            autoClose: 5000
          });
        } catch (e) {
          toast.update(toastId, { 
            render: "Withdrawal failed: Contract error", 
            type: "error", 
            isLoading: false,
            autoClose: 5000
          });
        }
      } else {
        toast.update(toastId, { 
          render: `Withdrawal failed: ${error instanceof Error ? error.message : "Unknown error"}`, 
          type: "error", 
          isLoading: false,
          autoClose: 100
        });
      }
      console.error("Withdrawal failed:", error);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleClaimRewards = async () => {
    if (!signer) {
      toast.error("Wallet not connected");
      return;
    }
    
    setIsClaimingRewards(true);
    const toastId = toast.loading("Preparing to claim rewards...");
    
    try {
      // Check contract state
      const isPaused = await checkContractState(signer);
      if (isPaused) {
        toast.update(toastId, { 
          render: "Contract is currently paused. Please try again later.", 
          type: "error", 
          isLoading: false,
          autoClose: 5000
        });
        setIsClaimingRewards(false);
        return;
      }
      
      toast.update(toastId, { 
        render: "Claiming rewards...", 
        type: "info", 
        isLoading: true 
      });
      
      await claimRewards(signer);
      toast.update(toastId, { 
        render: "Successfully claimed rewards!", 
        type: "success", 
        isLoading: false,
        autoClose: 5000
      });
      
      refetch(); // Refresh user data
    } catch (error) {
      if (error instanceof Error && (error as any).data) {
        try {
          const decodedError = ethers.toUtf8String((error as any).data);
          toast.update(toastId, { 
            render: `Claiming rewards failed: ${decodedError}`, 
            type: "error", 
            isLoading: false,
            autoClose: 5000
          });
        } catch (e) {
          toast.update(toastId, { 
            render: "Claiming rewards failed: Contract error", 
            type: "error", 
            isLoading: false,
            autoClose: 5000
          });
        }
      } else {
        toast.update(toastId, { 
          render: `Claiming rewards failed: ${error instanceof Error ? error.message : "Unknown error"}`, 
          type: "error", 
          isLoading: false,
          autoClose: 5000
        });
      }
      console.error("Claiming rewards failed:", error);
    } finally {
      setIsClaimingRewards(false);
    }
  };

  const handleEmergencyWithdraw = async () => {
    if (!signer) {
      toast.error("Wallet not connected");
      return;
    }
    
    // Confirm with user before emergency withdrawal
    if (!window.confirm("Are you sure you want to perform an emergency withdrawal? This will forfeit any pending rewards.")) {
      return;
    }
    
    setIsEmergencyWithdrawing(true);
    const toastId = toast.loading("Preparing emergency withdrawal...");
    
    try {
      toast.update(toastId, { 
        render: "Processing emergency withdrawal...", 
        type: "info", 
        isLoading: true 
      });
      
      await emergencyWithdraw(signer);
      toast.update(toastId, { 
        render: "Emergency withdrawal successful!", 
        type: "success", 
        isLoading: false,
        autoClose: 5000
      });
      
      refetch(); // Refresh user data
    } catch (error) {
      if (error instanceof Error && (error as any).data) {
        try {
          const decodedError = ethers.toUtf8String((error as any).data);
          toast.update(toastId, { 
            render: `Emergency withdrawal failed: ${decodedError}`, 
            type: "error", 
            isLoading: false,
            autoClose: 5000
          });
        } catch (e) {
          toast.update(toastId, { 
            render: "Emergency withdrawal failed: Contract error", 
            type: "error", 
            isLoading: false,
            autoClose: 5000
          });
        }
      } else {
        toast.update(toastId, { 
          render: `Emergency withdrawal failed: ${error instanceof Error ? error.message : "Unknown error"}`, 
          type: "error", 
          isLoading: false,
          autoClose: 5000
        });
      }
      console.error("Emergency withdrawal failed:", error);
    } finally {
      setIsEmergencyWithdrawing(false);
    }
  };

  const handleConnectWallet = async () => {
    const toastId = toast.loading("Connecting wallet...");
    try {
      await connectWallet();
      toast.update(toastId, { 
        render: "Wallet connected successfully!", 
        type: "success", 
        isLoading: false,
        autoClose: 3000
      });
    } catch (error) {
      toast.update(toastId, { 
        render: `Failed to connect wallet: ${error instanceof Error ? error.message : "Unknown error"}`, 
        type: "error", 
        isLoading: false,
        autoClose: 5000
      });
    }
  };

  if (loading) return (
    <div className="p-4">
      <ToastContainer position="top-right" />
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-lg">Loading staking data...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-4">
      <ToastContainer position="top-right" />
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error.message}</span>
      </div>
      <button
        onClick={() => refetch()}
        className="mt-4 bg-blue-500 text-white p-2 rounded"
      >
        Try Again
      </button>
    </div>
  );

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <ToastContainer position="top-right" />
      <h1 className="text-2xl font-bold mb-4">Staking ++</h1>
      {!walletAddress ? (
        <button
          onClick={handleConnectWallet}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
          disabled={loading}
        >
          Connect Wallet
        </button>
      ) : (
        <div>
          <div className="bg-gray-500 p-4 rounded-lg mb-6">
            <p className="font-medium">Connected Wallet: <span className="text-blue-600">{walletAddress}</span></p>
            {data?.user && (
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-gray-500 text-sm">Total Staked</p>
                  <p className="text-lg text-black font-bold">{data.user.stakedAmount ? ethers.formatEther(data.user.stakedAmount) : '0'} STK</p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-gray-500 text-sm">Pending Rewards</p>
                  <p className="text-lg text-black font-bold">{data.user.pendingRewards ? ethers.formatEther(data.user.pendingRewards) : '0'} STK</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-500 p-4 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-3">Stake Tokens</h2>
              <div className="flex flex-col space-y-2">
                <input
                  type="text"
                  value={amountD}
                  onChange={(e) => setAmountD(e.target.value)}
                  className="border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Amount to stake"
                  disabled={isStaking}
                />
                <button
                  onClick={handleStake}
                  className="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition-colors flex justify-center items-center"
                  disabled={isStaking || !amountD}
                >
                  {isStaking ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : "Stake Tokens"}
                </button>
              </div>
            </div>

            <div className="bg-gray-500 p-4 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-3">Withdraw Tokens</h2>
              <div className="flex flex-col space-y-2">
                <input
                  type="text"
                  value={amountW}
                  onChange={(e) => setAmountW(e.target.value)}
                  className="border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Amount to withdraw"
                  disabled={isWithdrawing}
                />
                <button
                  onClick={handleWithdraw}
                  className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition-colors flex justify-center items-center"
                  disabled={isWithdrawing || !amountW}
                >
                  {isWithdrawing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : "Withdraw Tokens"}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-gray-500 p-4 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-3">Claim Rewards</h2>
              <button
                onClick={handleClaimRewards}
                className="bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600 transition-colors w-full flex justify-center items-center"
                disabled={isClaimingRewards}
              >
                {isClaimingRewards ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Claiming...
                  </>
                ) : "Claim Rewards"}
              </button>
            </div>

            <div className="bg-gray-500 p-4 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-3">Emergency Withdraw</h2>
              <button
                onClick={handleEmergencyWithdraw}
                className="bg-purple-500 text-white p-2 rounded hover:bg-purple-600 transition-colors w-full flex justify-center items-center"
                disabled={isEmergencyWithdrawing}
              >
                {isEmergencyWithdrawing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : "Emergency Withdraw"}
              </button>
              <p className="text-xs text-red-500 mt-2">⚠️ Warning: This will forfeit any pending rewards.</p>
            </div>
          </div>
          <div className="mt-6">
          {data?.protocol && data.user && (
            <StakingStats user={data.user} protocol={data.protocol} />
          )}
          </div>
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-3">Your Stakes</h2>
            {data?.user && data.user.stakes && data.user.stakes.length > 0 ? (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Staked On</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Unlock Time</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.user.stakes.map((stake: Stake) => (
                        <tr key={stake.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <a
                                href={`https://sepolia.etherscan.io/tx/${stake.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                              >
                                {stake.id.slice(0, 8)}...
                              </a>
                            </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm font-medium">{ethers.formatEther(stake.amount)} STK</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(parseInt(stake.timestamp) * 1000).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(stake.unlockTime * 1000).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <p className="text-gray-500">No stakes found. Start staking to see your positions here.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;