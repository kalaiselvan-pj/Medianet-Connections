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
import Alert from "@mui/material/Alert";

function ForgotPassword({ open, handleClose }) {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(
        "http://localhost:5000/statistics/login/forgot-password",
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

      setSuccess("A reset link has been sent! Please check your inbox.");
      setEmail("");

      // Close dialog after 2 seconds
      setTimeout(() => {
        handleClose();
        setSuccess("");
      }, 2000);
    } catch (err) {
      setError(err.message);
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
        sx={{ display: "flex", flexDirection: "column", gap: 2, width: "40vw" }}
      >
        <DialogContentText>
          Enter the email address associated with your account. We&apos;ll send
          you a link to create a new password.
        </DialogContentText>

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

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
