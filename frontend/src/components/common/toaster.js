import React from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Success toast
export const showToast = (message, type = "success") => {
    toast[type](message, {
        position: "bottom-right",
        autoClose: 1800,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: { minHeight: "40px", padding: "6px 12px", fontSize: "14px" },
    });
};

// Error toast (custom style / position)
export const showErrorToast = (message) => {
    toast.error(message, {
        position: "bottom-right",        // ✅ use a valid value: "top-right", "top-center", "bottom-left", etc.
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: { minHeight: "30px", padding: "5px 10px", fontSize: "13px" },
    });
};

// ✅ ToastContainer (must be rendered once in app)
const Toaster = () => {
    return <ToastContainer />;
};

export default Toaster;
