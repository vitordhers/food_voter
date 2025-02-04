import { Navbar } from "./components/Navbar";
import { UiContextProvider } from "./contexts/UiContext";
import { Web3ContextProvider } from "./contexts/Web3Context";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { Home } from "./pages/Home";
import { MyBallots } from "./pages/MyBallots";
import { BallotsContextProvider } from "./contexts/BallotsContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckToSlot } from "@fortawesome/free-solid-svg-icons";

function App() {
  return (
    <Web3ContextProvider>
      <BallotsContextProvider>
        <UiContextProvider>
          <div className="drawer drawer-end">
            <input
              id="drawer-input"
              type="checkbox"
              className="drawer-toggle"
            />
            <div className="drawer-content flex flex-col">
              <Router>
                <Navbar />
                <Routes>
                  <Route path="/" Component={Home} />
                  <Route path="/my-ballots" Component={MyBallots} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </Router>
            </div>
            <div className="drawer-side">
              <label
                htmlFor="drawer-input"
                aria-label="close sidebar"
                className="drawer-overlay"
              ></label>
              <ul className="menu p-4 w-80 min-h-full bg-base-200">
                <li>
                  <label htmlFor="new-ballot" className="btn btn-primary">
                    <FontAwesomeIcon icon={faCheckToSlot} />
                    Start a Ballot
                  </label>
                </li>
              </ul>
            </div>
          </div>
        </UiContextProvider>
      </BallotsContextProvider>
    </Web3ContextProvider>
  );
}

export default App;
