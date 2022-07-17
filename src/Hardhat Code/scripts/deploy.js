const hre = require("hardhat");
const { verify } = require("../utils/verify");
require("@nomiclabs/hardhat-etherscan");

async function main() {
  // const Token = await hre.ethers.getContractFactory("Token");
  // const token = await Token.deploy(hre.ethers.utils.parseEther("1000000"));

  // await token.deployed(6);

  // console.log("Token contract deployed to:", token.address);

  const Loan = await hre.ethers.getContractFactory("Loan");
  const loan = await Loan.deploy("0x4fFEd1f977C38f34B54cbe712edC27620cA32E28");

  await loan.deployed(6);

  console.log("Loan contract deployed to:", loan.address);

  try {
    // await run("verify:verify", {
    //   address: token.address,
    //   constructorArguments: [hre.ethers.utils.parseEther("1000000")],
    //   contract: "contracts/Token.sol:Token",
    // });
    await run("verify:verify", {
      address: loan.address,
      constructorArguments: ["0x4fFEd1f977C38f34B54cbe712edC27620cA32E28"],
      contract: "contracts/Loan.sol:Loan",
    });
  } catch (e) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Already Verified");
    } else {
      console.log(e);
    }
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
