import * as React from "react";
import PropTypes from "prop-types";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import OutlinedInput from "@mui/material/OutlinedInput";
import CircularProgress from "@mui/material/CircularProgress";
import { showToast } from "./common/toaster";

function ForgotPassword({ open, handleClose }) {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.REACT_APP_LOCALHOST}/statistics/login/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to send reset email");
      }
      showToast("A reset link has been sent! Please check your inbox.", "success");
      setEmail("");

      // Close dialog after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      showToast(err.message || "Something went wrong, please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      slotProps={{
        paper: {
          component: "form",
          onSubmit: handleSubmit,
          sx: { backgroundImage: "none" },
        },
      }}
    >
      <DialogTitle>Reset Password</DialogTitle>

      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        <DialogContentText>
          Enter the email address associated with your account. We&apos;ll send
          you a link to create a new password.
        </DialogContentText>


        <OutlinedInput
          autoFocus
          required
          margin="dense"
          id="email"
          name="email"
          placeholder="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
        />
      </DialogContent>

      <DialogActions sx={{ pb: 3, px: 3 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{
            backgroundColor: "#ececec",
            color: "#000",
            textTransform: "none",
            "&:hover": { backgroundColor: "#dcdcdc" },
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          type="submit"
          disabled={loading}
          sx={{ textTransform: "none" }}
        >
          {loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            "Send Reset Link"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ForgotPassword.propTypes = {
  handleClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};

export default ForgotPassword;
