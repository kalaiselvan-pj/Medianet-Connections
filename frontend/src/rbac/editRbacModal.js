import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
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
    const [permissions, setPermissions] = useState({
        dashboard: { view: false, edit: false },
        resortList: { view: false, edit: false },
        resortIncidents: { view: false, edit: false },
        streamerConfig: { view: false, edit: false },
        rbacManagement: { view: false, edit: false },
    });
    const [originalData, setOriginalData] = useState(null);
    const [isChanged, setIsChanged] = useState(false); // track changes

    useEffect(() => {
        if (userData) {
            const initPermissions =
                userData.permission || {
                    dashboard: { view: false, edit: false },
                    resortList: { view: false, edit: false },
                    resortIncidents: { view: false, edit: false },
                    streamerConfig: { view: false, edit: false },
                    rbacManagement: { view: false, edit: false },
                };
            setPermissions(initPermissions);
            setOriginalData({ permissions: initPermissions });
            setIsChanged(false);
        }
    }, [userData]);

    // Detect changes in permissions
    useEffect(() => {
        if (!originalData) return;

        const hasChanged = JSON.stringify(permissions) !== JSON.stringify(originalData.permissions);

        setIsChanged(hasChanged);
    }, [permissions, originalData]);

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
        fetch(`${process.env.REACT_APP_LOCALHOST}/statistics/updateUser/${userData.login_id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
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
        <Dialog open={isOpen} onClose={onClose} fullWidth>
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

                <Typography variant="h6" gutterBottom>
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
                <Button onClick={onClose} color="primary">Cancel</Button>
                <Button onClick={handleSave} color="primary" variant="contained" disabled={!isChanged}>
                    UPDATE
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RbacUserModal;

