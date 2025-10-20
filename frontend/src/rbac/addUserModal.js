import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    IconButton,
    InputAdornment,
    Tooltip,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { SHA256 } from "crypto-js";
import { showToast } from "../components/common/toaster";
import CloseIcon from "@mui/icons-material/Close";

const AddUserModal = ({ open, onClose, onSave }) => {
    const [form, setForm] = useState({
        user_name: "",
        email: "",
        password: "",
        role: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isFormDirty, setIsFormDirty] = useState(false); // only for enabling submit

    const handleTogglePassword = () => setShowPassword((prev) => !prev);

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    //  Input change handler with first-letter capitalization for user_name
    const handleChange = (e) => {
        const { name, value } = e.target;
        let formattedValue = value;

        if (name === "user_name" && value.length > 0) {
            formattedValue = value.charAt(0).toUpperCase() + value.slice(1);
        }

        setForm((prev) => ({ ...prev, [name]: formattedValue }));

        // ✅ Enable submit button as soon as user types anything
        if (!isFormDirty && value.trim() !== "") {
            setIsFormDirty(true);
        }
    };

    // ✅ Reset form when modal opens
    useEffect(() => {
        if (open) {
            setForm({
                user_name: "",
                email: "",
                password: "",
                role: "",
            });
            setShowPassword(false);
            setIsFormDirty(false);
        }
    }, [open]);

    // ✅ Handle Submit
    const handleSubmit = () => {
        let hasError = false;

        if (!form.user_name.trim()) {
            showToast("User name is required", "error");
            hasError = true;
        }

        if (!form.email.trim()) {
            showToast("Email is required", "error");
            hasError = true;
        } else if (!validateEmail(form.email)) {
            showToast("Invalid email format", "error");
            hasError = true;
        }

        if (!form.password.trim()) {
            showToast("Password is required", "error");
            hasError = true;
        }

        if (!form.role.trim()) {
            showToast("Role is required", "error");
            hasError = true;
        }

        if (hasError) return;

        const hashedPassword = SHA256(form.password).toString();
        const payload = { ...form, password: hashedPassword };

        fetch(`${process.env.REACT_APP_LOCALHOST}/statistics/addUser`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
            .then((res) => res.json())
            .then((data) => {
                showToast("User added successfully!", "success");
                onSave(data);
                onClose();
            })
            .catch((err) => {
                console.error("Error adding user:", err);
                showToast("Failed to add user. Please try again.", "error");
            });
    };

    return (
        <Dialog open={open} onClose={() => { }} disableEscapeKeyDown>
            <DialogTitle
                sx={{
                    m: 0,
                    p: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                Add New User
                <Tooltip title="Close" arrow>
                    <IconButton
                        aria-label="close"
                        onClick={onClose}
                        sx={{ color: (theme) => theme.palette.grey[500] }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Tooltip>
            </DialogTitle>

            <DialogContent dividers>
                <TextField
                    label="User Name"
                    name="user_name"
                    fullWidth
                    margin="dense"
                    value={form.user_name}
                    onChange={handleChange}
                    required
                    sx={{ width: "25vw" }}
                />

                <TextField
                    label="Email"
                    name="email"
                    fullWidth
                    margin="dense"
                    value={form.email}
                    onChange={handleChange}
                    required
                    helperText={
                        form.email && !validateEmail(form.email)
                            ? "Invalid email"
                            : ""
                    }
                    sx={{ width: "25vw" }}
                />

                <TextField
                    label="Password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    fullWidth
                    margin="dense"
                    value={form.password}
                    onChange={handleChange}
                    required
                    sx={{ width: "25vw" }}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={handleTogglePassword}
                                    edge="end"
                                    aria-label="toggle password visibility"
                                >
                                    {showPassword ? (
                                        <VisibilityOff />
                                    ) : (
                                        <Visibility />
                                    )}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                <TextField
                    select
                    label="User Role"
                    name="role"
                    fullWidth
                    margin="dense"
                    value={form.role}
                    onChange={handleChange}
                    required
                    sx={{ width: "25vw" }}
                >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="manager">Manager</MenuItem>
                    <MenuItem value="sales">Sales</MenuItem>
                    <MenuItem value="finance">Finance</MenuItem>
                </TextField>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    color="success"
                    variant="contained"
                    disabled={!isFormDirty} // ✅ only enabled after user types something
                >
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddUserModal;

