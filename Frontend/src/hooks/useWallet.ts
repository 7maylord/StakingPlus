import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { networkInfoMap } from "../config";

export const useWallet = () => {
  const [provider, setProvider] = useState<any>(null);
  const [signer, setSigner] = useState<any>(null);
  const [currentChain, setCurrentChain] = useState<number | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [balance, setBalance] = useState<string | null>(null);

  // Check if wallet is already connected
  const checkConnection = useCallback(async () => {
    if (!window.ethereum) return;
    
    try {
      // Use eth_accounts which returns connected accounts without prompting
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts.length > 0) {
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await web3Provider.getSigner();
        setProvider(web3Provider);
        setSigner(signer);
        setWalletAddress(accounts[0]);
        
        // Get chain ID
        const chainId = await window.ethereum.request({ method: "eth_chainId" });
        setCurrentChain(parseInt(chainId, 16));
        
        // Get account balance
        await updateBalance(accounts[0]);
      }
    } catch (error: any) {
      console.error("Error checking connection:", error);
    }
  }, []);

  const updateBalance = async (address: string) => {
    if (!window.ethereum) return;
    
    try {
      const balance = await window.ethereum.request({
        method: "eth_getBalance",
        params: [address, "latest"]
      });
      setBalance(ethers.formatEther(balance));
    } catch (error: any) {
      console.error("Error fetching balance:", error);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("No Ethereum wallet found! Please install MetaMask or another wallet.");
      return;
    }
    
    setIsConnecting(true);
    setError(null);
    
    try {
      // Request accounts (displays wallet popup)
      const accounts = await window.ethereum.request({ 
        method: "eth_requestAccounts" 
      });
      
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await web3Provider.getSigner();
      setProvider(web3Provider);
      setSigner(signer);
      setWalletAddress(accounts[0]);
      
      // Get chain ID 
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      setCurrentChain(parseInt(chainId, 16));
      
      // Get account balance
      await updateBalance(accounts[0]);
    } catch (error: any) {
      if (error.code === 4001) {
        // User rejected the connection request
        setError("Connection request rejected. Please connect your wallet to use this application.");
      } else {
        setError(`Failed to connect wallet: ${error.message}`);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    // Note: EIP-1193 doesn't have a standard disconnect method
    // We can only clear our app state
    setProvider(null);
    setSigner(null);
    setWalletAddress(null);
    setCurrentChain(null);
    setBalance(null);
  };

  // Event handlers
  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      disconnectWallet();
    } else {
      // User switched accounts
      setWalletAddress(accounts[0]);
      updateBalance(accounts[0]);
    }
  }, []);

  const handleChainChanged = useCallback(async (chainId: string) => {
    // Note: MetaMask recommends reloading the page on chain change
    // but we'll just update our state for this example
    const newChainId = parseInt(chainId, 16);
    setCurrentChain(newChainId);
    
    // Update balance as it might be different on the new chain
    if (walletAddress) {
      updateBalance(walletAddress);
    }
  }, [walletAddress]);

  const handleConnect = useCallback((connectInfo: { chainId: string }) => {
    console.log("Wallet connected!", connectInfo);
    // You could trigger additional actions here
  }, []);

  const handleDisconnect = useCallback((error: { code: number; message: string }) => {
    console.log("Wallet disconnected:", error);
    disconnectWallet();
  }, []);

  const switchNetwork = async (chainId: number) => {
    if (!window.ethereum) return;
    
    const hexChainId = "0x" + chainId.toString(16);
    
    try {
      // Try to switch to the network
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hexChainId }]
      });
    } catch (error: any) {
      // This error code indicates the chain has not been added to MetaMask
      if (error.code === 4902 && networkInfoMap[chainId]) {
        try {
          const network = networkInfoMap[chainId];
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: hexChainId,
                chainName: network.chainName,
                nativeCurrency: network.nativeCurrency,
                rpcUrls: network.rpcUrls,
                blockExplorerUrls: network.blockExplorerUrls
              }
            ]
          });
        } catch (addError) {
          if (addError instanceof Error) {
            setError(`Failed to add network: ${addError.message}`);
          } else {
            setError("Failed to add network: Unknown error");
          }
        }
      } else {
        setError(`Failed to switch network: ${error.message}`);
      }
    }
  };

  

  // Setup and cleanup event listeners
  const setupProviderListeners = useCallback(() => {
    if (window.ethereum) {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);
      
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
      window.ethereum.on("connect", handleConnect);
      window.ethereum.on("disconnect", handleDisconnect);
      
      checkConnection();
    }
  }, [handleAccountsChanged, handleChainChanged, handleConnect, handleDisconnect, checkConnection]);

  const removeProviderListeners = useCallback(() => {
    if (window.ethereum) {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
      window.ethereum.removeListener("connect", handleConnect);
      window.ethereum.removeListener("disconnect", handleDisconnect);
    }
  }, [handleAccountsChanged, handleChainChanged, handleConnect, handleDisconnect]);

  // Initial setup
  useEffect(() => {
    setupProviderListeners();

    // checkConnection();
    
    return () => {
      removeProviderListeners();
    };
  }, [setupProviderListeners, removeProviderListeners]);

  return {
    provider,
    signer,
    currentChain,
    walletAddress,
    error,
    isConnecting,
    balance,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    setupProviderListeners,
    removeProviderListeners
  };
};