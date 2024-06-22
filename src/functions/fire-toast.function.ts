import { SweetAlertIcon } from "sweetalert2";
import { Toast } from "../const/toast-mixin.const";

export const fireToast = (
  title: string,
  html: string,
  icon?: SweetAlertIcon
) => {
  Toast.fire(title, html, icon);
};
