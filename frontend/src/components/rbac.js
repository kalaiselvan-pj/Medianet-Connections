import React, { useState, useEffect } from "react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Paper,
    Tooltip,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogActions,
    Button
} from "@mui/material";
import "../styles/rbac.css";
import { canAccess } from "../rbac/canAccess";
import { showToast } from "./common/toaster";
import AddUserModal from "../rbac/addUserModal";
import EditRbacModal from "../rbac/editRbacModal";

const Rbac = () => {
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [openAdd, setOpenAdd] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    // Menu state for each row
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [menuUserId, setMenuUserId] = useState(null);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = () => {
        fetch(`${process.env.REACT_APP_LOCALHOST}/statistics/getAllUsersData`)
            .then((res) => res.json())
            .then((fetchedUserData) => setUsers(fetchedUserData))
            .catch((err) => console.error("Error fetching User Data:", err));
    };

    const handleAdd = () => setOpenAdd(true);

    const handleEdit = (user) => {
        setSelectedUser(user);
        setShowModal(true);
        handleMenuClose(); // Close menu after click
    };

    const handleDelete = (id) => {
        setSelectedId(id);
        setOpenDeleteDialog(true);
        handleMenuClose(); // Close menu after click
    };

    const handleConfirmDelete = () => {
        fetch(`${process.env.REACT_APP_LOCALHOST}/statistics/deleteUser/${selectedId}`, { method: "DELETE" })
            .then((res) => res.json())
            .then(() => {
                setUsers((prev) => prev.filter((user) => user.login_id !== selectedId));
                setOpenDeleteDialog(false);
                showToast("User deleted successfully!");
            })
            .catch((err) => console.error("Error deleting user:", err));
    };

    const handleMenuOpen = (event, userId) => {
        setMenuAnchorEl(event.currentTarget);
        setMenuUserId(userId);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
        setMenuUserId(null);
    };

    const handleSave = (updatedUser) => {
        setShowModal(false);
        fetchUserData(); // Refresh the user list
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <h2 style={{ margin: 0 }}>Role Based Access Control (RBAC)</h2>
                {canAccess("rbacManagement", "edit") && (
                    <button onClick={handleAdd} className="add-user-btn">
                        <AddIcon style={{ marginRight: "6px" }} />
                        Add User
                    </button>
                )}
            </div>

            <Paper sx={{ height: "84vh", overflow: "auto" }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell className="table-header" sx={{ width: "15vw" }}>Name</TableCell>
                            <TableCell className="table-header" sx={{ width: "23vw" }}>Email</TableCell>
                            <TableCell className="table-header" sx={{ width: "14vw" }}>Role</TableCell>
                            {canAccess("rbacManagement", "edit") && (
                                <TableCell className="table-header" sx={{ width: "9vw" }}>Actions</TableCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.login_id}>
                                <TableCell>{user.user_name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ""}</TableCell>
                                {canAccess("rbacManagement", "edit") && (
                                    <TableCell>
                                        <Tooltip title="Actions" arrow>
                                            <IconButton onClick={(e) => handleMenuOpen(e, user.login_id)}>
                                                <MoreVertIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>

                                        <Menu
                                            anchorEl={menuAnchorEl}
                                            open={Boolean(menuAnchorEl) && menuUserId === user.login_id}
                                            onClose={handleMenuClose}
                                            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                            transformOrigin={{ vertical: "top", horizontal: "right" }}
                                        >
                                            <MenuItem onClick={() => handleEdit(user)}>
                                                <EditIcon fontSize="small" style={{ marginRight: 8, color: "#1976d2" }} />
                                                Edit
                                            </MenuItem>
                                            <MenuItem onClick={() => handleDelete(user.login_id)}>
                                                <DeleteIcon fontSize="small" style={{ marginRight: 8, color: "#fd0d0dff" }} />
                                                Delete
                                            </MenuItem>
                                        </Menu>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>Are you sure you want to delete this user?</DialogTitle>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)} color="primary">Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error">Delete</Button>
                </DialogActions>
            </Dialog>

            {/* Add User Modal */}
            <AddUserModal open={openAdd} onClose={() => setOpenAdd(false)} onSave={handleSave} />

            {/* Edit User Modal - This is where selected user data is passed */}
            <EditRbacModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSave}
                userData={selectedUser}
            />
        </div>
    );
};

export default Rbac;