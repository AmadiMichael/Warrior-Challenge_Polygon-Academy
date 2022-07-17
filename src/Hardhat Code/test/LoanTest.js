const { expect } = require("chai");

describe("Getting a Loan", function () {
  this.beforeEach(async function () {
    const Token = await hre.ethers.getContractFactory("Token");
    token = await Token.deploy(hre.ethers.utils.parseEther("1000000"));

    await token.deployed();

    const Loan = await ethers.getContractFactory("LoanTest");
    loan = await Loan.deploy(token.address);

    [account1] = await ethers.getSigners();

    //making liquidity for the test loan contract
    await token
      .connect(account1)
      .transfer(loan.address, hre.ethers.utils.parseEther("1000"));
  });

  it("Loan is successfully taken", async function () {
    const oldTokenBalance = await token
      .connect(account1)
      .balanceOf(account1.address);

    const oldBalance = await ethers.provider.getBalance(account1.address);

    const transactionResponse = await loan.connect(account1).getLoan({
      value: ethers.utils.parseEther("3"),
    });
    const transactionReceipt = await transactionResponse.wait(1);
    const { gasUsed, effectiveGasPrice } = transactionReceipt;

    const gasCost = gasUsed.mul(effectiveGasPrice);

    const loans = await loan.getLoans(0);

    expect(
      ethers.utils.formatEther(
        await ethers.provider.getBalance(account1.address)
      )
    ).to.equal(
      ethers.utils.formatEther(
        oldBalance.sub(loans.collateral).sub(gasCost).toString()
      )
    );
    expect(
      ethers.utils.formatEther(
        await token.connect(account1).balanceOf(account1.address)
      )
    ).to.equal(
      ethers.utils.formatEther(
        oldTokenBalance.add(loans.amountGotten).toString()
      )
    );
    expect(loans.loanee).to.equal(account1.address);
    expect(loans.collateral).to.equal(ethers.utils.parseEther("3"));
    expect(loans.amountGotten).to.equal(ethers.utils.parseEther("1.5"));
    expect(loans.priceAtRequest).to.equal(ethers.utils.parseEther("0.5"));
    expect(loans.loanId).to.equal(0);
    expect(loans.isOpen).to.equal(true);
  });
});

describe("Paying a Loan", function () {
  this.beforeEach(async function () {
    const Token = await hre.ethers.getContractFactory("Token");
    token = await Token.deploy(hre.ethers.utils.parseEther("1000000"));

    await token.deployed();

    const Loan = await ethers.getContractFactory("LoanTest");
    loan = await Loan.deploy(token.address);

    [account1, account2] = await ethers.getSigners();

    //making liquidity for the test loan contract
    await token
      .connect(account1)
      .transfer(loan.address, hre.ethers.utils.parseEther("1000"));

    await loan.connect(account1).getLoan({
      value: ethers.utils.parseEther("3"),
    });

    //approve contract to spend your stable tokens
    const approvalAmount = await loan.connect(account1).getLoans(0);
    await token
      .connect(account1)
      .approve(loan.address, approvalAmount.amountGotten);
  });

  it("Loan paid back successfully", async function () {
    const oldTokenBalance = await token
      .connect(account1)
      .balanceOf(account1.address);

    const oldBalance = await ethers.provider.getBalance(account1.address);

    const transactionResponse = await loan.connect(account1).payLoan(0);
    const transactionReceipt = await transactionResponse.wait(1);
    const { gasUsed, effectiveGasPrice } = transactionReceipt;

    const gasCost = gasUsed.mul(effectiveGasPrice);

    const loans = await loan.getLoans(0);

    expect(
      ethers.utils.formatEther(
        await ethers.provider.getBalance(account1.address)
      )
    ).to.equal(
      ethers.utils.formatEther(
        oldBalance.add(loans.collateral).sub(gasCost).toString()
      )
    );
    expect(
      ethers.utils.formatEther(
        await token.connect(account1).balanceOf(account1.address)
      )
    ).to.equal(
      ethers.utils.formatEther(
        oldTokenBalance.sub(loans.amountGotten).toString()
      )
    );
    expect(loans.loanee).to.equal(account1.address);
    expect(loans.collateral).to.equal(ethers.utils.parseEther("3"));
    expect(loans.amountGotten).to.equal(ethers.utils.parseEther("1.5"));
    expect(loans.priceAtRequest).to.equal(ethers.utils.parseEther("0.5"));
    expect(loans.loanId).to.equal(0);
    expect(loans.isOpen).to.equal(false);
  });

  it("Should only let the owner repay the loan once", async function () {
    expect(await loan.connect(account1).payLoan(0)).to.be.revertedWith(
      "This loan is closed"
    );
  });
});

describe("Not-owner actions on a Loan", function () {
  this.beforeEach(async function () {
    const Token = await hre.ethers.getContractFactory("Token");
    token = await Token.deploy(hre.ethers.utils.parseEther("1000000"));

    await token.deployed();

    const Loan = await ethers.getContractFactory("LoanTest");
    loan = await Loan.deploy(token.address);

    [account1, account2] = await ethers.getSigners();

    //making liquidity for the test loan contract
    await token
      .connect(account1)
      .transfer(loan.address, hre.ethers.utils.parseEther("1000"));

    await loan.connect(account1).getLoan({
      value: ethers.utils.parseEther("3"),
    });

    //approve contract to spend your stable tokens
    const approvalAmount = await loan.connect(account1).getLoans(0);
    await token
      .connect(account1)
      .approve(loan.address, approvalAmount.amountGotten);
  });

  it("Should only let the owner repay the loan", async function () {
    const response = await loan.connect(account2).payLoan(0);
    expect(response.wait()).to.be.revertedWith(
      "You must be the loanee of this loan to do this"
    );
  });
});
