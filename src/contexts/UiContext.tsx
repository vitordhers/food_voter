import {
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  createContext,
  useCallback,
  useMemo,
  useState,
} from "react";
import { NewBallot } from "../components/NewBallot";

interface UiContextProviderProps {
  children: ReactNode;
}

export interface UiContextType {
  openNewBallotModal: () => void;
  closeNewBallotModal: () => void;
  isCreatingNewBallot: boolean;
  setIsCreatingNewBallot: Dispatch<SetStateAction<boolean>>;
}

export const UiContext = createContext<UiContextType | undefined>(undefined);

export const UiContextProvider: FC<UiContextProviderProps> = ({ children }) => {
  const [newBallotModalOpen, setNewBallotModalOpen] = useState(false);
  const [isCreatingNewBallot, setIsCreatingNewBallot] = useState(false);

  const openNewBallotModal = useCallback(() => {
    setNewBallotModalOpen(true);
  }, []);

  const closeNewBallotModal = useCallback(() => {
    if (isCreatingNewBallot) return;
    setNewBallotModalOpen(false);
  }, [isCreatingNewBallot]);

  const onChange = useCallback((open: boolean) => {
    setNewBallotModalOpen(open);
  }, []);

  const value = useMemo(
    () => ({
      isCreatingNewBallot,
      setIsCreatingNewBallot,
      openNewBallotModal,
      closeNewBallotModal,
    }),
    [isCreatingNewBallot, openNewBallotModal, closeNewBallotModal]
  );

  return (
    <UiContext.Provider value={value}>
      {children}
      <input
        type="checkbox"
        id="new-ballot"
        className="modal-toggle"
        onChange={(e) => onChange(e.target.checked)}
        checked={newBallotModalOpen}
      />
      <div className="modal" role="dialog">
        <div className="modal-box">
          <NewBallot />
        </div>

        <label
          className={`modal-backdrop ${
            isCreatingNewBallot ? "pointer-events-none" : ""
          }`}
          htmlFor="new-ballot"
        ></label>
      </div>
    </UiContext.Provider>
  );
};
