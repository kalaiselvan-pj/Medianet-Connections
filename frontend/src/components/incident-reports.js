import { Dialog, DialogTitle, DialogActions, Button, DialogContent, Menu } from "@mui/material";
import React, { useState, useEffect } from "react";
import "../styles/incidentReports.css"
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import Chip from '@mui/material/Chip';
import dayjs from "dayjs";
import IncidentModal from "./modals/incidentModal";
import { FormControl, Select, MenuItem, IconButton } from "@mui/material";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter } from '@fortawesome/free-solid-svg-icons';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from "@mui/icons-material/Edit";
import { canAccess } from "../rbac/canAccess";
import { showToast } from "./common/toaster";
import { GetApp } from "@mui/icons-material";
import VisibilityIcon from '@mui/icons-material/Visibility';
import MoreVertIcon from "@mui/icons-material/MoreVert";



const IncidentReports = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [incidents, setIncidents] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [incidentsPerPage] = useState(5);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedIncidentId, setSelectedIncidentId] = useState(null);
    const [statusFilter, setStatusFilter] = useState(""); // "" means no filter
    const [viewOpen, setViewOpen] = useState(false);           // Dialog visibility
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuIncident, setMenuIncident] = useState(null); // Track which row's menu is open



    const filteredIncidents = incidents
        .filter(item =>
            item.resort_name &&
            item.resort_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .filter(item =>
            statusFilter ? item.status === statusFilter : true
        );

    const exportToCSV = () => {
        const headers = ["No.", "Resort Name", "Category", "Incident", "Status", "Date"];
        const rows = filteredIncidents.map((item, index) => [
            index + 1,
            `"${item.resort_name}"`,
            item.category,
            `"${item.notes}"`,
            item.status,
            dayjs(item.incident_date).format("DD MMM YYYY"),
        ]);

        const csvContent = "data:text/csv;charset=utf-8," +
            [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const link = document.createElement("a");
        link.href = encodeURI(csvContent);
        link.download = "incident_reports.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast("CSV downloaded successfully!", "success");
    };



    const indexOfLastIncident = currentPage * incidentsPerPage;
    const indexOfFirstIncident = indexOfLastIncident - incidentsPerPage;
    const currentIncidents = filteredIncidents.slice(indexOfFirstIncident, indexOfLastIncident);

    const totalPages = Math.ceil(filteredIncidents.length / incidentsPerPage);

    const newCount = incidents.filter((r) => r.status === "New").length;
    const pendingCount = incidents.filter((r) => r.status === "Pending").length;
    const completedCount = incidents.filter((r) => r.status === "Completed").length;
    const totalCount = incidents.length;

    const goToPreviousPage = () => {
        setCurrentPage(prevPage => Math.max(prevPage - 1, 1));
    };

    const goToNextPage = () => {
        setCurrentPage(prevPage => Math.min(prevPage + 1, totalPages));
    };

    const handleAdd = () => {
        setModalOpen(true);
    };

    const handleClose = () => {
        setSelectedIncident(null);
        setModalOpen(false);
    }

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setCurrentPage(1);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setCurrentPage(1);
    };

    const handleStatusFilterChange = (event) => {
        setStatusFilter(event.target.value);
        setCurrentPage(1); // reset to first page
    };

    const handleEdit = (incident) => {
        setSelectedIncident(incident);
        // Open the modal
        setModalOpen(true);
    };

    const confirmDelete = (incident_id) => {
        setSelectedIncidentId(incident_id);
        setOpenDeleteDialog(true);
    };

    const handleDelete = async () => {
        try {
            const response = await fetch(`http://localhost:5000/statistics/deleteResortIncident/${selectedIncidentId}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                throw new Error("Failed to delete incident");
            }
            showToast("Incident deleted successfully!", "success");
            setOpenDeleteDialog(false);
            setSelectedIncidentId(null);

            // Refresh list after delete
            fetchResortIncidentReports();
        } catch (err) {
            console.error("Delete failed:", err);
            showToast("Failed to delete the incident. Please try again.", "error");
        }
    };


    useEffect(() => {
        fetchResortIncidentReports();
    }, []);

    const fetchResortIncidentReports = () => {
        fetch("http://localhost:5000/statistics/getAllIncidentReports")
            .then((res) => res.json())
            .then((fetchedIncidents) => setIncidents(fetchedIncidents))
            .catch((err) => console.error("Error fetching incidents:", err));
    };

    const handleMenuOpen = (event, incident) => {
        setAnchorEl(event.currentTarget);
        setMenuIncident(incident);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuIncident(null);
    };

    const handleViewClick = (incident) => {
        setSelectedIncident(incident);
        setViewOpen(true);
    };

    const handleCloseView = () => {
        setViewOpen(false);
        setSelectedIncident(null);
    };

    return (
        <div className="incident-container">
            <div className="incident-header">
                <div className="search-wrapper">
                    <SearchIcon className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by resort name..."
                        className="search-input"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                    />
                    {searchTerm && (
                        <div className="clear-icon" onClick={handleClearSearch} style={{ cursor: "pointer" }}>
                            <CloseIcon style={{ fontSize: 20 }} />
                        </div>
                    )}
                </div>

                {/* Status Filter Dropdown */}
                <div style={{ position: "sticky", display: "inline-block" }}>
                    {/* Filter Icon */}
                    <FontAwesomeIcon
                        icon={faFilter}
                        style={{
                            position: "absolute",
                            left: "10px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            pointerEvents: "none",
                            color: "rgb(43 142 228)",
                            fontSize: "20px",
                            zIndex: 1,
                        }}
                    />

                    {/* Status Filter */}
                    <FormControl size="small" sx={{ width: "9.5rem" }}>
                        <Select
                            value={statusFilter}
                            onChange={handleStatusFilterChange}
                            displayEmpty
                            sx={{
                                pl: 4, // space for the icon
                                borderRadius: "10px",
                                fontWeight: "bold",
                                fontSize: "14px",
                                backgroundColor: "#f0f0f0",
                                height: "2.3rem",
                            }}
                        >
                            <MenuItem value="" className="status-all"><em>All</em></MenuItem>
                            <MenuItem value="New" className="status-new">New</MenuItem>
                            <MenuItem value="Pending" className="status-pending">Pending</MenuItem>
                            <MenuItem value="Completed" className="status-completed">Completed</MenuItem>

                        </Select>
                    </FormControl>
                </div>

                <Button
                    variant="contained"
                    startIcon={<GetApp />}
                    onClick={exportToCSV}
                    style={{ borderRadius: "9px", textTransform: "none", backgroundColor: "green" }}
                >
                    Download
                </Button>

                {canAccess("resortIncidents", "edit") && (
                    <button className="add-btn" onClick={handleAdd}>
                        <AddIcon fontSize="small" />
                        Add
                    </button>
                )}

            </div>

            <table className="incident-table">
                <thead>
                    <tr style={{ backgroundColor: "#569fdfff" }}>
                        <th>No.</th>
                        <th>Resort Name</th>
                        <th>Category</th>
                        <th>Incident</th>
                        <th>Status</th>
                        <th>Date</th>
                        {canAccess("resortIncidents", "edit") && <th>Actions</th>}

                    </tr>
                </thead>

                <tbody>
                    {currentIncidents.map((incident, index) => (
                        <tr
                            key={index}
                            style={{ height: "1vh", cursor: "pointer" }}
                        >
                            <td>{indexOfFirstIncident + index + 1}</td>

                            <td>
                                {incident.resort_name.length > 25
                                    ? incident.resort_name.slice(0, 25) + "..."
                                    : incident.resort_name}
                            </td>
                            <td>{incident.category}</td>
                            {/* Notes with limit */}
                            <td>
                                {incident.notes.length > 20
                                    ? incident.notes.slice(0, 20) + "..."
                                    : incident.notes}
                            </td>
                            <td>
                                <Chip
                                    label={incident.status}

                                    size="small"
                                    sx={{
                                        backgroundColor:
                                            incident.status === "Completed"
                                                ? " #27ae60" //Green
                                                : incident.status === "New"
                                                    ? "#1976d2" // Blue (Primary)
                                                    : incident.status === "Pending"
                                                        ? "#ff9800" // Orange (Warning)
                                                        : "#9e9e9e", // Default Grey
                                        color: "#fff", // White text
                                        fontWeight: 500,
                                    }}
                                />
                            </td>
                            <td>{dayjs(incident.incident_date).format("DD MMM YYYY")}</td>
                            {canAccess("resortIncidents", "edit") && (
                                <td style={{ textAlign: "center" }}>
                                    <IconButton onClick={(e) => handleMenuOpen(e, incident)}>
                                        <MoreVertIcon />
                                    </IconButton>

                                    <Menu
                                        anchorEl={anchorEl}
                                        open={Boolean(anchorEl) && menuIncident?.incident_id === incident.incident_id}
                                        onClose={handleMenuClose}
                                    >
                                        <MenuItem
                                            onClick={() => {
                                                handleViewClick(menuIncident);
                                                handleMenuClose();
                                            }}
                                        >
                                            <VisibilityIcon fontSize="small" style={{ marginRight: "8px", color: "#1976d2" }} />
                                            View
                                        </MenuItem>

                                        <MenuItem
                                            onClick={() => {
                                                handleEdit(menuIncident);
                                                handleMenuClose();
                                            }}
                                        >
                                            <EditIcon fontSize="small" style={{ marginRight: "8px", color: "#1976d2" }} />
                                            Edit
                                        </MenuItem>

                                        <MenuItem
                                            onClick={() => {
                                                confirmDelete(menuIncident.incident_id);
                                                handleMenuClose();
                                            }}
                                        >
                                            <DeleteIcon fontSize="small" style={{ marginRight: "8px", color: "#fd0d0d" }} />
                                            Delete
                                        </MenuItem>
                                    </Menu>
                                </td>

                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Popup */}
            <Dialog open={viewOpen} onClose={handleCloseView}
                PaperProps={{
                    sx: {
                        width: "600px",   // set your desired width
                        maxWidth: "90%",  // optional, keeps it responsive
                    }
                }}>
                <DialogTitle>Incident Details</DialogTitle>
                <DialogContent dividers>
                    {selectedIncident && (
                        <div>
                            <p><strong>Resort Name:</strong> {selectedIncident.resort_name}</p>
                            <p><strong>Category:</strong> {selectedIncident.category}</p>
                            <p><strong>Incident:</strong> {selectedIncident.notes}</p>
                            <p><strong>Status:</strong> {selectedIncident.status}</p>
                            <p><strong>Date:</strong> {dayjs(selectedIncident.incident_date).format("DD MMM YYYY")}</p>
                        </div>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseView} variant="contained" color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>


            <div
                style={{
                    marginTop: "20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px"
                }}
            >
                <div>
                    <span style={{ color: "#1976d2", marginRight: "15px" }}>
                        New: {newCount}
                    </span>
                    <span style={{ color: "#ed6c02", marginRight: "15px" }}>
                        Pending: {pendingCount}
                    </span>
                    <span style={{ color: "#2e7d32", marginRight: "15px" }}>
                        Completed: {completedCount}
                    </span>
                    <span style={{ color: "#638499ff" }}>Total: {totalCount}</span>
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px"
                    }}
                >
                    <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "10px",
                            border: "none",
                            backgroundColor: "#569fdfff",
                            color: "white",
                            fontSize: "15px",
                            width: "50px",
                            height: "30px",
                            cursor: currentPage === 1 ? "not-allowed" : "pointer"
                        }}
                    >
                        ◁
                    </button>
                    <span style={{ marginTop: "3px" }}>
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "10px",
                            border: "none",
                            backgroundColor: "#569fdfff",
                            color: "white",
                            fontSize: "15px",
                            width: "50px",
                            height: "30px",
                            cursor: currentPage === totalPages ? "not-allowed" : "pointer"
                        }}
                    >
                        ▷
                    </button>
                </div>
            </div>

            <IncidentModal
                open={modalOpen}
                onClose={handleClose}
                onSave={() => {
                    fetchResortIncidentReports();
                    setModalOpen(false);
                }}
                incidentData={selectedIncident}
                dialogWidth="90%"
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>Are you sure you want to delete this incident?</DialogTitle>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleDelete} color="error">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>


        </div>
    );
};

export default IncidentReports;

