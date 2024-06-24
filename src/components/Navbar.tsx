import { ReactEventHandler, useState } from "react";
import { Web3ConnectionStatus } from "../enum/web3-connection-status.enum";
import logo from "/food_vote.png";
import metamaskLogo from "/metamask.svg";
import {
  faCheckToSlot,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useWeb3Context } from "../hooks/useWeb3Context";
import { useUiContext } from "../hooks/useUiContext";
import { Link } from "react-router-dom";

export const Navbar = () => {
  const {
    connectToMetaMask,
    web3Status,
    selectedAccountAddress,
    walletAccounts,
    selectAddressByIndex,
  } = useWeb3Context();

  const { openNewBallotModal } = useUiContext();

  const [addressDetailsOpen, setAddressDetailsOpen] = useState(false);

  const onToggle: ReactEventHandler<HTMLDetailsElement> = (e) => {
    setAddressDetailsOpen((e.target as HTMLDetailsElement).open);
  };

  return (
    <div className="w-full navbar bg-base-300">
      <div className="flex-1 px-2 mx-2">
        <Link to="/">
          <div className="flex justify-center items-center">
            <img className="logo" src={logo} />
            <span className="m-2">Food voter</span>
          </div>
        </Link>
      </div>
      <div className="flex-none">
        <ul className="menu menu-horizontal flex gap-x-2 justify-center items-end">
          <li>
            {web3Status !== Web3ConnectionStatus.Accepted ? (
              <button
                className={`btn ${
                  web3Status !== Web3ConnectionStatus.Connecting
                    ? "btn-outline"
                    : ""
                } 
              ${
                web3Status === Web3ConnectionStatus.Rejected
                  ? "btn-error"
                  : "btn-warning"
              }
              btn-sm rounded-lg flex`}
                onClick={connectToMetaMask}
              >
                <img className="metamask-logo" src={metamaskLogo} />
                {web3Status === Web3ConnectionStatus.None && (
                  <span>Connect to MetaMask</span>
                )}
                {web3Status === Web3ConnectionStatus.Connecting && (
                  <span className="loading loading-spinner"></span>
                )}
                {web3Status === Web3ConnectionStatus.Rejected && (
                  <span>Allow MetaMask</span>
                )}
              </button>
            ) : (
              <details onToggle={onToggle}>
                <summary className="btn-outline btn-sm btn-success rounded-lg flex">
                  <img className="metamask-logo" src={metamaskLogo} />
                  <span
                    className={`address ${
                      addressDetailsOpen ? "max-w-lg" : "max-w-32"
                    }  text-ellipsis overflow-hidden hover:text-clip hover:max-w-lg`}
                  >
                    {selectedAccountAddress}
                  </span>
                </summary>
                <ul className="p-2 bg-base-100 rounded-t-none w-lg z-10">
                  <h2 className="menu-title">Select Account</h2>
                  {walletAccounts.map((addr, i) => (
                    <div
                      key={addr.substring(0, 13)}
                      className="block tooltip tooltip-left"
                      data-tip={
                        addr === selectedAccountAddress
                          ? "Account Selected"
                          : "Select Account"
                      }
                    >
                      <li className="text-ellipsis overflow-hidden hover:text-clip">
                        <a
                          className={
                            addr === selectedAccountAddress ? "active" : ""
                          }
                          onClick={() => selectAddressByIndex(i)}
                        >
                          {addr === selectedAccountAddress && (
                            <FontAwesomeIcon
                              className="success-icon"
                              icon={faCircleCheck}
                            />
                          )}
                          {addr}
                        </a>
                      </li>
                    </div>
                  ))}
                </ul>
              </details>
            )}
          </li>
          <li className="hidden lg:block">
            <button className="btn btn-primary" onClick={openNewBallotModal}>
              <FontAwesomeIcon icon={faCheckToSlot} />
              Start a Ballot
            </button>
          </li>
        </ul>
      </div>
      <div className="flex-none lg:hidden">
        <label
          htmlFor="drawer-input"
          aria-label="open sidebar"
          className="btn btn-square btn-ghost"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="inline-block w-6 h-6 stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
          </svg>
        </label>
      </div>
    </div>
  );
};
