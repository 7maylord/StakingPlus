interface NetworkInfo {
    chainName: string;
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
    rpcUrls: string[];
    blockExplorerUrls: string[];
  }
  
  export const networkInfoMap: Record<number, NetworkInfo> = {
      11155111: {
        chainName: "Sepolia Testnet",
        nativeCurrency: {
          name: "Ether",
          symbol: "ETH",
          decimals: 18
        },
        rpcUrls: ["https://sepolia.infura.io/"],
        blockExplorerUrls: ["https://sepolia.etherscan.io"]
      },
    //   534351: {
    //     chainName: "Scroll Sepolia Testnet",
    //     nativeCurrency: {
    //       name: "Ether",
    //       symbol: "ETH",
    //       decimals: 18
    //     },
    //     rpcUrls: ["https://sepolia-rpc.scroll.io/"],
    //     blockExplorerUrls: ["https://sepolia.scrollscan.com/"]
    //   },
    //   4202: {
    //     chainName: "Lisk Sepolia Testnet",
    //     nativeCurrency: {
    //       name: "LISK",
    //       symbol: "LSK",
    //       decimals: 18
    //     },
    //     rpcUrls: ["https://rpc.sepolia-api.lisk.com/"],
    //     blockExplorerUrls: ["https://sepolia-blockscout.lisk.com/"]
    //   },
    //   84532: {
    //     chainName: "Base Sepolia Testnet",
    //     nativeCurrency: {
    //       name: "BASE",
    //       symbol: "BST",
    //       decimals: 18
    //     },
    //     rpcUrls: ["https://base-sepolia-rpc.publicnode.com/"],
    //     blockExplorerUrls: ["https://sepolia.basescan.org/"]
    //   }
    };