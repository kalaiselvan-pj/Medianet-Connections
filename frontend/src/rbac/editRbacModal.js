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
    Tooltip,
    IconButton,
} from "@mui/material";
import { showToast } from "../components/common/toaster";
import CloseIcon from "@mui/icons-material/Close";

const RbacUserModal = ({ isOpen, onClose, onSave, userData }) => {

    // Define default permissions structure
    const defaultPermissions = {
        dashboard: { view: false, edit: false },
        resortList: { view: false, edit: false },
        resortIncidents: { view: false, edit: false },
        streamerConfig: { view: false, edit: false },
        rbacManagement: { view: false, edit: false },
        islandInformations: { view: false, edit: false },
        bpDetails: { view: false, edit: false },
    };

    const [permissions, setPermissions] = useState(defaultPermissions);
    const [originalData, setOriginalData] = useState(null);
    const [isChanged, setIsChanged] = useState(false);

    useEffect(() => {
        if (userData) {
            // Merge user permissions with default permissions to ensure all modules are included
            const userPermissions = userData.permission || {};

            // Create merged permissions that includes all default modules
            const mergedPermissions = { ...defaultPermissions };

            // Override with user's existing permissions
            Object.keys(userPermissions).forEach(module => {
                if (mergedPermissions.hasOwnProperty(module)) {
                    mergedPermissions[module] = {
                        ...mergedPermissions[module],
                        ...userPermissions[module]
                    };
                } else {
                    // If there's a module in userPermissions that's not in default, add it
                    mergedPermissions[module] = userPermissions[module];
                }
            });

            setPermissions(mergedPermissions);
            setOriginalData({ permissions: mergedPermissions });
            setIsChanged(false);
        }
    }, [userData]);

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
        const payload = {
            user_id: userData.user_id,
            permissions: permissions,
        };

        fetch(`${process.env.REACT_APP_LOCALHOST}/statistics/updateUser/${userData.user_id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
            .then((res) => res.json())
            .then((data) => {
                onSave(data);
                onClose();
                showToast("updated successfully!", "success");
            })
            .catch((err) => console.error("Error updating user:", err));
    };

    const formatModuleName = (module) => {
        const nameMap = {
            dashboard: "Dashboard",
            resortList: "Resort List",
            resortIncidents: "Resort Incidents",
            streamerConfig: "Streamer Config",
            rbacManagement: "RBAC Management",
            islandInformations: "Island Informations",
            bpDetails: "BP Details",
        };
        return nameMap[module] || module;
    };

    return (
        <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle
                sx={{
                    m: 0,
                    p: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                {userData ? "Edit User Permissions" : "Add User Permissions"}
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
                                <TableCell sx={{ fontWeight: 'medium' }}>
                                    {formatModuleName(section)}
                                </TableCell>
                                <TableCell align="center">
                                    <Checkbox
                                        checked={permissions[section].view || false}
                                        onChange={() => handleToggle(section, "view")}
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Checkbox
                                        checked={permissions[section].edit || false}
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