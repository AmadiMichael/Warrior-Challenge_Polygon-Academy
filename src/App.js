import "./App.css";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import {
  contractAddress,
  abi,
  tokenAbi,
  tokenContractAddress,
} from "./constants.js";

function App() {
  const [connWalletButton, setConnWalletButton] = useState("Connect Wallet");
  const [walletAddress, setWalletAddress] = useState("No wallet connected");
  const [contract, setContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [reserveBalance, setReserveBalance] = useState("...");

  async function connect() {
    if (typeof window.ethereum !== "undefined") {
      try {
        try {
          console.log("I see a metamask");
          await window.ethereum.request({ method: "eth_requestAccounts" });
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          setWalletAddress(accounts[0]);
        } catch (error) {
          console.log(error);
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        console.log(signer);

        const loan = new ethers.Contract(contractAddress, abi, signer);
        const token = new ethers.Contract(
          tokenContractAddress,
          tokenAbi,
          signer
        );
        setContract(loan);
        setTokenContract(token);
        setConnWalletButton("Wallet Connected");
        console.log(
          ethers.utils.formatEther(await loan.getLatestPrice()) * 1e10
        );
      } catch (err) {
        console.log(err.message);
      }
    }
  }

  async function getLoan(event) {
    event.preventDefault();
    if (typeof window.ethereum !== "undefined") {
      try {
        const getLoan = await contract.getLoan({
          value: ethers.utils.parseEther(event.target.amount.value),
        });
        console.log("sending transaction...");
        await getLoan.wait();
        console.log("Confirmed!");
      } catch (err) {
        console.log(err.message);
      }
    }
  }

  async function payLoan(event) {
    event.preventDefault();
    if (typeof window.ethereum !== "undefined") {
      try {
        const yourLoan = await contract.getLoans(event.target.loanId.value);

        if (yourLoan.isOpen == true) {
          console.log("approving contract...");
          const approval = await tokenContract.approve(
            contractAddress,
            yourLoan.amountGotten
          );

          await approval.wait();
          console.log("approved!");
          const getLoan = await contract.payLoan(event.target.loanId.value);
          console.log("sending transaction...");
          await getLoan.wait(1);
          console.log("Confirmed!");
        } else {
          console.log("This loan is closed");
        }
      } catch (err) {
        console.log(err.message);
      }
    }
  }

  async function getTokenBalances() {
    if (typeof window.ethereum !== "undefined") {
      try {
        const balances = await tokenContract.balanceOf(contractAddress);
        console.log(ethers.utils.formatEther(balances));
        setReserveBalance(ethers.utils.formatEther(balances));
      } catch (err) {
        console.log(err.message);
      }
    }
  }

  useEffect(() => {
    if (contract !== null) {
      getTokenBalances();
    }
  });

  return (
    <div className="App">
      <header className="App-header"></header>
      <button onClick={connect}> {connWalletButton} </button>
      <p></p>
      Wallet Address: {walletAddress}
      <p></p>
      Contracts Token Reserve Balance: {reserveBalance} Blue StableCoins
      <p></p>
      <form onSubmit={getLoan}>
        <input id="amount" placeholder="amount in MATIC" /> <p></p>
        <button type="submit"> GET LOAN </button>
      </form>
      <p style={{ marginBottom: "2em" }}></p>
      <form onSubmit={payLoan}>
        <input id="loanId" placeholder="loan ID" /> <p></p>
        <button type="submit">PAY LOAN </button>
      </form>
    </div>
  );
}

export default App;
