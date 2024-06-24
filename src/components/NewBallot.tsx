import {
  faXmark,
  faFloppyDisk,
  faComment,
  faAlignJustify,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useMemo } from "react";
import { useForm, SubmitHandler, SubmitErrorHandler } from "react-hook-form";
import { NewBallotTimeline } from "./NewBallotTimeline";
import { useUiContext } from "../hooks/useUiContext";
import { useWeb3Context } from "../hooks/useWeb3Context";
import { fireToast } from "../functions/fire-toast.function";
import { useBallotsContext } from "../hooks/useBallotsContext";
import { PayableCallOptions } from "web3";

interface FormValues {
  title: string;
  description: string;
}

export const NewBallot = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
    getValues,
    setValue,
    trigger,
    reset,
  } = useForm<FormValues>();

  const { isCreatingNewBallot, setIsCreatingNewBallot, closeNewBallotModal } =
    useUiContext();

  const { selectedAccountAddress, getWeb3Provider } = useWeb3Context();
  const { getBallotsManager } = useBallotsContext();

  const markAsTouched = useCallback(
    (field: keyof FormValues) => {
      const value = getValues(field);
      setValue(field, value, { shouldTouch: true });
      trigger(field);
    },
    [getValues, setValue, trigger]
  );

  const onSubmit: SubmitHandler<FormValues> = useCallback(
    async ({ title, description }) => {
      const contract = getBallotsManager();
      const provider = getWeb3Provider();

      if (!provider || !contract || !selectedAccountAddress) return;

      try {
        setIsCreatingNewBallot(true);
        const gasPrice = await provider.eth.getGasPrice();

        const tx: PayableCallOptions = {
          from: selectedAccountAddress,
          gasPrice: String(gasPrice),
        };

        const txResult = await contract.methods
          .createBallot(title, description)
          .send(tx);

        let toastHtml = `<p><b>Hash:</b>${txResult.transactionHash}<p><br />`;
        toastHtml += `<p><b>Ballot Address: </b>${txResult.events?.NewBallot.address}</p>`;
        fireToast("Ballot created!", toastHtml, "success");
        reset();
        closeNewBallotModal();
      } catch (error) {
        fireToast(
          "Ballot couldn't be created",
          `Check your inputs and try again`,
          "error"
        );

        console.error({ error });
      } finally {
        setIsCreatingNewBallot(false);
      }
    },
    [
      reset,
      selectedAccountAddress,
      closeNewBallotModal,
      getBallotsManager,
      setIsCreatingNewBallot,
      getWeb3Provider,
    ]
  );

  const onIvalid: SubmitErrorHandler<FormValues> = useCallback(
    (errors) => {
      if ("title" in errors) {
        markAsTouched("title");
      }

      if ("description" in errors) {
        markAsTouched("description");
      }
    },
    [markAsTouched]
  );

  const displayTitleError = useMemo(
    () => "title" in errors && "title" in touchedFields,
    [Object.keys(errors).length, Object.keys(touchedFields).length]
  );

  const displayTitleSuccess = useMemo(
    () => !("title" in errors) && "title" in touchedFields,
    [Object.keys(errors).length, Object.keys(touchedFields).length]
  );

  const displayDescriptionError = useMemo(
    () => "description" in errors && "description" in touchedFields,
    [Object.keys(errors).length, Object.keys(touchedFields).length]
  );

  const displayDescriptionSuccess = useMemo(
    () => !("description" in errors) && "description" in touchedFields,
    [Object.keys(errors).length, Object.keys(touchedFields).length]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit, onIvalid)}>
      <div className="navbar bg-base-100 p-0 min-h-0 flex md:hidden">
        <div className="flex-none"></div>
        <div className="flex-1"></div>
        <div className="flex-none">
          <button
            className="btn btn-xs btn-circle btn-outline btn-error"
            onClick={closeNewBallotModal}
            disabled={isCreatingNewBallot}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-5">
        <label className="form-control w-full">
          <div className="label flex justify-start gap-2">
            <FontAwesomeIcon
              className={`w-4 h-4 opacity-70 ${
                displayTitleError ? "text-error" : ""
              }
                ${displayTitleSuccess ? "text-success" : ""}`}
              icon={faComment}
            />
            <span
              className={`label-text ${displayTitleError ? "text-error" : ""}
                ${displayTitleSuccess ? "text-success" : ""}`}
            >
              {displayTitleError ? errors["title"]?.message : "Title"}
            </span>
          </div>
          <input
            type="text"
            placeholder="e.g. Does 🍍 pineapple belong in 🍕 pizza?"
            className={`input input-bordered ${
              displayTitleError ? "input-error" : ""
            }
            
            ${displayTitleSuccess ? "input-success" : ""} w-full`}
            maxLength={50}
            {...register("title", {
              required: "Title is required",
              maxLength: {
                value: 50,
                message: "Title must have up to 50 characters",
              },
            })}
          />
        </label>

        <label className="form-control">
          <div className="label flex justify-start gap-2">
            <FontAwesomeIcon
              className={`w-4 h-4 opacity-70 ${
                displayDescriptionError ? "text-error" : ""
              } ${displayDescriptionSuccess ? "text-success" : ""}`}
              icon={faAlignJustify}
            />
            <span
              className={`label-text ${
                displayDescriptionError ? "text-error" : ""
              }
                ${displayDescriptionSuccess ? "text-success" : ""}`}
            >
              {displayDescriptionError
                ? errors["description"]?.message
                : "Description"}
            </span>
          </div>
          <textarea
            className={`textarea textarea-bordered h-24  ${
              displayDescriptionError ? "textarea-error" : ""
            } ${displayDescriptionSuccess ? "textarea-success" : ""}`}
            placeholder="e.g.: Every now and then, folks dare to put 🍍 pineapple in 🍕 pizza recipes. Should that be allowed, at all?"
            maxLength={200}
            {...register("description", {
              required: "Description is required",
              maxLength: {
                value: 200,
                message: "Description must have up to 200 characters",
              },
            })}
          ></textarea>
        </label>

        <NewBallotTimeline />
      </div>

      <div className="modal-action flex justify-between">
        <button
          className="btn btn-sm btn-outline btn-error invisible md:visible"
          onClick={closeNewBallotModal}
          disabled={isCreatingNewBallot}
        >
          Cancel
          <FontAwesomeIcon icon={faXmark} />
        </button>
        <button
          className="btn btn-sm btn-outline btn-success"
          type="submit"
          disabled={isCreatingNewBallot}
        >
          {isCreatingNewBallot ? (
            <>
              <span className="loading loading-dots loading-xs"></span>
              <span>Creating new Ballot</span>
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faFloppyDisk} />
              <span>Create Ballot</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
