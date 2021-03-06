declare let window: any;
import { BigNumber, ethers } from "ethers";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";
import epicToken from "../artifacts/contracts/EPICToken.sol/EPICToken.json";
import nftEpicGame from "../artifacts/contracts/NFTEpicGame.sol/NFTEpicGame.json";
import {
  CHAIN_ID,
  CHAIN_ID_INT,
  GAME_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ADDRESS,
} from "../utils/constants";
import {
  AttackProps,
  BigBoss,
  CharacterProps,
  DappContextProps,
  SpecialAttackProps,
} from "../utils/contracts";
import {
  parseAttacks,
  parseBigBoss,
  parseDefaultCharacter,
  parseSpecialAttacks,
} from "../utils/helper";

const DappContext = createContext<DappContextProps>({
  isLoading: false,
  currentAccount: null,
  currentBalance: "0",
  defaultCharactersList: [],
  hasCharacter: false,
  gameContract: null,
  allAttacks: [],
  allSpecialAttacks: [],
  bigBoss: null,
  error: "",
  currentCharacter: {
    characterIndex: BigNumber.from(0),
    name: "",
    imageURI: "",
    hp: BigNumber.from(0),
    maxHp: BigNumber.from(0),
    attacks: [BigNumber.from(0)],
    specialAttacks: [BigNumber.from(0)],
    lastRegenTime: BigNumber.from(0),
    tokenId: BigNumber.from(0),
  },
  connectWalletAction: async () => {},
  faucet: async () => {},
  mintCharacterNFT: async () => {},
  attackBoss: async () => {},
  attackBossWithSpecialAttack: async () => {},
  claimHealth: async () => {},
  fetchSpecialAttacks: async () => [],
  buySpecialAttack: async () => {},
});

export const DappProvider: React.FC = ({ children }) => {
  const data = useProviderData();

  return <DappContext.Provider value={data}>{children}</DappContext.Provider>;
};

export const useDapp = () => useContext<DappContextProps>(DappContext);

export const useProviderData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);
  const [currentBalance, setCurrentBalance] = useState<string | null>(null);
  const [currentCharacter, setCurrentCharacter] = useState<CharacterProps>();
  const [hasCharacter, setHasCharacter] = useState(false);
  const [defaultCharactersList, setDefaultCharactersList] = useState<
    CharacterProps[]
  >([]);
  const [allAttacks, setAllAttacks] = useState<AttackProps[]>([]);
  const [allSpecialAttacks, setAllSpecialAttacks] = useState<
    SpecialAttackProps[]
  >([]);
  const [bigBoss, setBigBoss] = useState<BigBoss | null>(null);
  const [gameContract, setGameContract] = useState<ethers.Contract | null>(
    null
  );
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const checkIfWalletIsConnected = useCallback(async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log("Make sure you have MetaMask!");

        alert("Make sure you have MetaMask!");
        setIsLoading(false);
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      checkNetwork();
    } catch (err) {
      console.log(err);
    }
  }, []);

  // Check for the connect network
  const checkNetwork = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const { chainId } = await provider.getNetwork();
      if (chainId === CHAIN_ID_INT) {
        console.log("chainId :>> ", chainId);
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        if (accounts.length !== 0) {
          const account = accounts[0];
          console.log("Found an authorized account:", account);
          setCurrentAccount(account);
        } else {
          console.log("No authorized account found");
        }
      } else {
        console.log("HERE");
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [
            {
              chainId: CHAIN_ID,
            },
          ],
        });
        setError("Please connect to the Rinkeby network");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const connectWalletAction = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (err) {
      console.log(`err`, err);
    }
  };

  const fetchBalance = async () => {
    var balance: string;
    if (tokenContract) {
      balance = await tokenContract.balanceOf(currentAccount);
    } else {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        TOKEN_CONTRACT_ADDRESS,
        epicToken.abi,
        signer
      );
      balance = await contract.balanceOf(currentAccount);
      setTokenContract(contract);
    }
    console.log("Balance is : ", balance.toString());
    setCurrentBalance(balance.toString());
  };

  const fetchData = async () => {
    var data = await gameContract.checkIfUserHasNFT();
    var character = parseDefaultCharacter(data);

    if (character.name == "") {
      setHasCharacter(false);
      var allDefaultCharacters = await gameContract.getAllDefaultCharacters();
      var characterList: CharacterProps[] = [];
      allDefaultCharacters.forEach((element) => {
        characterList.push(parseDefaultCharacter(element));
      });
      setDefaultCharactersList(characterList);
    } else {
      setHasCharacter(true);
      setCurrentCharacter(parseDefaultCharacter(data));
    }

    var bossData = await gameContract.getBigBoss();
    var boss = parseBigBoss(bossData);

    setBigBoss(boss);

    // Fetch all the attacks and special attacks
    var data = await gameContract.getAllAttacks();
    var attacks = [];
    data.forEach((element) => {
      attacks.push(parseAttacks(element));
    });
    setAllAttacks(attacks);

    var data = await gameContract.getAllSpecialAttacks();

    var specialAttacks = [];
    data.forEach((element) => {
      specialAttacks.push(parseSpecialAttacks(element));
    });
    console.log("specialAttacks :>> ", specialAttacks);
    setAllSpecialAttacks(specialAttacks);

    setIsLoading(false);
  };

  const faucet = async () => {
    if (BigNumber.from(currentBalance).gte(ethers.utils.parseEther("20"))) {
      toast(
        `You already have ${ethers.utils.formatEther(
          BigNumber.from(currentBalance)
        )} tokens. Please use that first.`,
        {
          draggable: true,
          closeOnClick: true,
          autoClose: 3500,
          progress: undefined,
          type: "error",
        }
      );
    } else {
      const id = toast.loading("Please wait...");
      try {
        var txn = await tokenContract.faucet(
          currentAccount,
          ethers.utils.parseEther("20")
        );
        await txn.wait();

        await fetchBalance();
        toast.update(id, {
          render: "20 EPIC token added to your wallet",
          type: "success",
          isLoading: false,
          draggable: true,
          closeOnClick: true,
          autoClose: 3500,
        });
      } catch (err) {
        toast.update(id, {
          render: "Error in faucet",
          type: "error",
          isLoading: false,
          draggable: true,
          closeOnClick: true,
          autoClose: 3500,
        });
      }
    }
  };

  const mintCharacterNFT = async (characterIndex: BigNumber) => {
    if (BigNumber.from(currentBalance) < ethers.utils.parseEther("10")) {
      toast(
        `You don't have enough tokens to mint a character. Please get more tokens.`,
        {
          draggable: true,
          closeOnClick: true,
          autoClose: 3500,
          progress: undefined,
          type: "error",
        }
      );
    } else {
      const id = toast.loading("Please wait...");
      var txn = await tokenContract.approve(
        gameContract.address,
        ethers.utils.parseEther("10")
      );
      await txn.wait();
      txn = await gameContract.mintCharacterNFT(characterIndex.toNumber());
      await txn.wait();
      setIsLoading(true);
      toast.update(id, {
        render: "AVENGERS",
        type: "success",
        isLoading: false,
        draggable: true,
        closeOnClick: true,
        autoClose: 3500,
      });
      setTimeout(async () => {
        toast.update(id, {
          render: "ASSEMBLE....",
          type: "success",
          isLoading: false,
          draggable: true,
          closeOnClick: true,
          autoClose: 3500,
        });
      }, 3000);
      setTimeout(async () => {
        await fetchData();
        setIsLoading(false);
      }, 6000);
    }
  };

  const attackBoss = async (attackIndex: BigNumber) => {
    const id = toast.loading("Please wait...");
    var txn = await gameContract.attackBoss(attackIndex.toNumber());
    txn.wait().then(async () => {
      toast.update(id, {
        render: "Attack Completed",
        type: "success",
        isLoading: false,
        draggable: true,
        closeOnClick: true,
        autoClose: 3500,
      });
      await fetchData();
    });
  };

  const attackBossWithSpecialAttack = async (attackSpecialIndex: BigNumber) => {
    const id = toast.loading("Please wait...");
    var txn = await gameContract.attackSpecialBoss(
      attackSpecialIndex.toNumber()
    );
    txn.wait().then(async () => {
      toast.update(id, {
        render: "Attack Completed",
        type: "success",
        isLoading: false,
        draggable: true,
        closeOnClick: true,
        autoClose: 3500,
      });
      await fetchData();
    });
  };

  const claimHealth = async () => {
    const id = toast.loading("Please wait...");
    try {
      var txn = await tokenContract.approve(
        gameContract.address,
        ethers.utils.parseEther("0.1")
      );
      await txn.wait();
      txn = await gameContract.claimHealth();
      await txn.wait();
      toast.update(id, {
        render: "Successfully Recovered Health",
        type: "success",
        isLoading: false,
        draggable: true,
        closeOnClick: true,
        autoClose: 3000,
      });
    } catch (err) {
      toast.update(id, {
        render: "Error in claiming health",
        type: "error",
        isLoading: false,
        draggable: true,
        closeOnClick: true,
        autoClose: 3000,
      });
    }
    fetchData();
  };

  const fetchSpecialAttacks = async () => {
    const data = await gameContract.getAllSpecialAttacks();
    const specialAttacks: SpecialAttackProps[] = [];
    data.forEach((element) => {
      specialAttacks.push(parseSpecialAttacks(element));
    });
    return specialAttacks;
  };

  const buySpecialAttack = async (price: BigNumber, index: BigNumber) => {
    if (BigNumber.from(currentBalance).lt(price)) {
      toast(
        `You don't have enough tokens to mint a character. Please get more tokens.`,
        {
          draggable: true,
          closeOnClick: true,
          autoClose: 3500,
          progress: undefined,
          type: "error",
        }
      );
    } else {
      const id = toast.loading("Please wait...");
      try {
        var txn = await tokenContract.approve(gameContract.address, price);
        await txn.wait();
        txn = await gameContract.buySpecialAttack(index);
        await txn.wait();
        toast.update(id, {
          render: "Successfully bought special attack",
          type: "success",
          isLoading: false,
          draggable: true,
          closeOnClick: true,
          autoClose: 3000,
        });
      } catch (err) {
        toast.update(id, {
          render: "Error in buying special attack",
          type: "error",
          isLoading: false,
          draggable: true,
          closeOnClick: true,
          autoClose: 3000,
        });
      }
    }
  };

  useEffect(() => {
    setIsLoading(true);
    checkIfWalletIsConnected();
    if (window.ethereum)
      window.ethereum.on("chainChanged", (chainId) => {
        window.location.reload();
      });
  }, [checkIfWalletIsConnected]);

  useEffect(() => {
    const getGameContract = async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        GAME_CONTRACT_ADDRESS,
        nftEpicGame.abi,
        signer
      );
      setGameContract(contract);
    };

    if (currentAccount) {
      getGameContract();
      fetchBalance();
    }
  }, [currentAccount, hasCharacter]);

  useEffect(() => {
    if (gameContract) {
      fetchData();
    }
  }, [gameContract, hasCharacter]);

  return {
    isLoading,
    currentAccount,
    currentBalance,
    currentCharacter,
    defaultCharactersList,
    hasCharacter,
    allAttacks,
    allSpecialAttacks,
    gameContract,
    bigBoss,
    error,
    connectWalletAction,
    faucet,
    mintCharacterNFT,
    attackBoss,
    attackBossWithSpecialAttack,
    claimHealth,
    fetchSpecialAttacks,
    buySpecialAttack,
  };
};