// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./PriceFeed.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Loan {
    PriceConsumerV3 internal priceFeed;
    ERC20 internal token;
    uint256 counter;

    constructor(address tokenAddress) {
        counter = 0;
        priceFeed = PriceConsumerV3(0xeB516E1A497bc2cd7239295393f048eDFb389aa5);
        token = ERC20(tokenAddress);
        //0xd9145CCE52D386f254917e481eB44e9943F39138);
    }

    struct Loans {
        address payable loanee;
        uint256 collateral;
        uint256 amountGotten;
        uint256 priceAtRequest;
        uint256 loanId;
        bool isOpen;
    }

    mapping(uint256 => Loans) private userToAddress;

    function getLatestPrice() public view returns (int) {
        return priceFeed.getLatestPrice();
    }

    function getLoan() public payable {
        require(msg.value != 0, "Enter number more than 0");

        uint price = uint256(getLatestPrice()) * 1e10;
        uint256 loanAmount = uint256(price) * msg.value;
        uint256 amount = loanAmount / 1e18;
        require(
            token.balanceOf(address(this)) >= amount,
            "Not enough stablecoins available to loan out"
        );

        token.transfer(msg.sender, amount);

        userToAddress[counter] = Loans(
            payable(msg.sender),
            msg.value,
            amount,
            price,
            counter,
            true
        );

        counter++;
    }

    function payLoan(uint256 loanId) public {
        require(
            userToAddress[loanId].loanee == payable(msg.sender),
            "You must be the loanee of this loan to do this"
        );
        require(userToAddress[loanId].isOpen == true, "This loan is closed");

        token.transferFrom(
            msg.sender,
            address(this),
            userToAddress[loanId].amountGotten
        );
        userToAddress[loanId].isOpen = false;
        (bool callSuccess, ) = payable(msg.sender).call{
            value: userToAddress[loanId].collateral
        }("");
        require(callSuccess, "call failed");
    }

    function getLoans(uint256 loanId)
        public
        view
        returns (Loans memory loanDetails)
    {
        loanDetails = userToAddress[loanId];
        return loanDetails;
    }
}
