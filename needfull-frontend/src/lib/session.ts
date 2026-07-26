import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

let isHandlingExpiry = false;

export function handleSessionExpired() {
  if (isHandlingExpiry) return;
  isHandlingExpiry = true;

  toast.error("Your session has expired. Please log in again.", {
    duration: 4000,
  });

  useAuthStore.getState().logout();

  const returnTo = window.location.pathname + window.location.search;
  if (returnTo !== "/login" && returnTo !== "/register") {
    sessionStorage.setItem("nf_return_to", returnTo);
  }

  setTimeout(() => {
    window.location.href = "/login?reason=session_expired";
    isHandlingExpiry = false;
  }, 1200);
}
