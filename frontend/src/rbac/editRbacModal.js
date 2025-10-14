import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Checkbox,
    Typography,
    Tooltip,
    IconButton,
} from "@mui/material";
import { showToast } from "../components/common/toaster";
import CloseIcon from "@mui/icons-material/Close";



const RbacUserModal = ({ isOpen, onClose, onSave, userData }) => {
    const [role, setRole] = useState("");
    const [permissions, setPermissions] = useState({
        dashboard: { view: false, edit: false },
        resortList: { view: false, edit: false },
        resortIncidents: { view: false, edit: false },
    });
    const [originalData, setOriginalData] = useState(null);
    const [isChanged, setIsChanged] = useState(false); // track changes

    useEffect(() => {
        if (userData) {
            const initRole = userData.role || "";
            const initPermissions =
                userData.permission || {
                    dashboard: { view: false, edit: false },
                    resortList: { view: false, edit: false },
                    resortIncidents: { view: false, edit: false },
                };
            setRole(initRole);
            setPermissions(initPermissions);
            setOriginalData({ role: initRole, permissions: initPermissions });
            setIsChanged(false);
        }
    }, [userData]);

    // Detect changes in role or permissions
    useEffect(() => {
        if (!originalData) return;

        const hasChanged =
            role !== originalData.role ||
            JSON.stringify(permissions) !== JSON.stringify(originalData.permissions);

        setIsChanged(hasChanged);
    }, [role, permissions, originalData]);

    const handleToggle = (section, type) => {
        setPermissions((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [type]: !prev[section][type],
            },
        }));
    };

    const handleSave = () => {
        if (!role) {
            // Toast for error
            showToast("Please select a role!", "error");
            return;
        }

        fetch(`http://localhost:5000/statistics/updateUser/${userData.login_id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                role: role,
                permissions: permissions
            }),

        })
            .then((res) => res.json())
            .then((data) => {
                // Call parent save handler
                onSave(data);
                // Close modal
                onClose();
                // Toast for success
                showToast("updated successfully!", "success");
            })
            .catch((err) => console.error("Error updating user:", err));
    };


    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle
                sx={{
                    m: 0,
                    p: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >{userData ? "Edit User" : "Add User"}
                <Tooltip title="Close" arrow>
                    <IconButton
                        aria-label="close"
                        onClick={onClose}
                        sx={{
                            color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Tooltip>
            </DialogTitle>
            <DialogContent dividers>
                {/* Role Selection */}
                {/* <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Role
                </Typography>

                <FormControl fullWidth={false} sx={{ width: "20vw", marginBottom: "10px" }}>
                    <InputLabel>Role</InputLabel>
                    <Select labelId="role-label"
                        value={role} label="Role" onChange={(e) => setRole(e.target.value)}>

                        <MenuItem value="admin">Admin</MenuItem>
                        <MenuItem value="manager">Manager</MenuItem>
                        <MenuItem value="sales">Sales</MenuItem>
                        <MenuItem value="finance">Finance</MenuItem>
                    </Select>
                </FormControl> */}

                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Permissions
                </Typography>

                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ backgroundColor: "#5a98cf", color: "white" }}>Module</TableCell>
                            <TableCell sx={{ backgroundColor: "#5a98cf", color: "white" }} align="center">View</TableCell>
                            <TableCell sx={{ backgroundColor: "#5a98cf", color: "white" }} align="center">Edit</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody sx={{ backgroundColor: "aliceblue" }}>
                        {Object.keys(permissions).map((section) => (
                            <TableRow key={section}>
                                <TableCell>{section}</TableCell>
                                <TableCell align="center">
                                    <Checkbox
                                        checked={permissions[section].view}
                                        onChange={() => handleToggle(section, "view")}
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Checkbox
                                        checked={permissions[section].edit}
                                        onChange={() => handleToggle(section, "edit")}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} color="secondary" variant="outlined">
                    Cancel
                </Button>
                <Button onClick={handleSave} color="primary" variant="contained" disabled={!isChanged}>
                    UPDATE
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RbacUserModal;

