import {
    Dialog,
    DialogTitle,
    DialogActions,
    Button,
    DialogContent,
    Menu,
    TableContainer,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Pagination,
    Paper,
} from "@mui/material";
import React, { useState, useEffect } from "react";
import "../styles/incidentReports.css"
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import Chip from '@mui/material/Chip';
import dayjs from "dayjs";
import IncidentModal from "./modals/incidentModal";
import { FormControl, Select, MenuItem, IconButton, TextField, InputAdornment } from "@mui/material"; // Added TextField, InputAdornment
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
    // State variables remain the same
    const [modalOpen, setModalOpen] = useState(false);
    const [incidents, setIncidents] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [incidentsPerPage] = useState(8);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedIncidentId, setSelectedIncidentId] = useState(null);
    const [statusFilter, setStatusFilter] = useState(""); // "" means no filter
    const [viewOpen, setViewOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuIncident, setMenuIncident] = useState(null);

    // Filters and Pagination logic remains the same
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


    // Handler function for the MUI Pagination component
    const handlePageChange = (event, value) => {
        // 'value' is the new page number selected by the user
        setCurrentPage(value);
    };

    // Handler functions remain the same (handleAdd, handleClose, handleSearchChange, handleClearSearch, etc.)
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
        setModalOpen(true);
    };

    const confirmDelete = (incident_id) => {
        setSelectedIncidentId(incident_id);
        setOpenDeleteDialog(true);
    };

    const handleDelete = async () => {
        try {
            // Note: Keep the API call as is, as it's backend-dependent
            const response = await fetch(`${process.env.REACT_APP_LOCALHOST}/statistics/deleteResortIncident/${selectedIncidentId}`, {
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
        fetch(`${process.env.REACT_APP_LOCALHOST}/statistics/getAllIncidentReports`)
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

    // Define table column headers
    const columns = [
        { id: 'no', label: 'No.', minWidth: 50 },
        { id: 'resort_name', label: 'Resort Name', minWidth: 150 },
        { id: 'category', label: 'Category', minWidth: 100 },
        { id: 'incident', label: 'Incident', minWidth: 150 },
        { id: 'status', label: 'Status', minWidth: 100 },
        { id: 'date', label: 'Date', minWidth: 100 },
    ];


    return (
        <div >
            {/* --- Header/Controls Section --- */}
            <div className="incident-header" style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center' }}>
                {/* Search Bar*/}
                <TextField
                    variant="outlined"
                    size="small"
                    placeholder="Search by resort name..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="mui-search-input"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon className="mui-search-icon" />
                            </InputAdornment>
                        ),
                        endAdornment: searchTerm && (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={handleClearSearch}
                                    edge="end"
                                    size="small"
                                    className="mui-clear-icon"
                                >
                                    <CloseIcon />
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                {/* Status Filter Dropdown */}
                <FormControl size="small" sx={{ width: "9.5rem" }}>
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
                        <MenuItem value=""><em>All</em></MenuItem>
                        <MenuItem value="New" className="status-new">New</MenuItem>
                        <MenuItem value="Pending" className="status-pending">Pending</MenuItem>
                        <MenuItem value="Completed" className="status-completed">Completed</MenuItem>
                    </Select>
                </FormControl>

                {/* Download Button */}
                <Button
                    variant="contained"
                    startIcon={<GetApp />}
                    onClick={exportToCSV}
                    style={{ borderRadius: "9px", textTransform: "none", backgroundColor: "green" }}
                >
                    Download
                </Button>

                {/* Add Button */}
                {canAccess("resortIncidents", "edit") && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon fontSize="small" />}
                        onClick={handleAdd}
                        className="add-btn"
                    // style={{ borderRadius: "9px", textTransform: "none", backgroundColor: "#569fdfff" }}
                    >
                        Add
                    </Button>
                )}

            </div>

            {/* --- Table Section (MUI Table) --- */}
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer className="table-container-custom">
                    <Table stickyHeader aria-label="incident reports table">
                        <TableHead>
                            <TableRow>
                                {columns.map((column) => (
                                    <TableCell
                                        key={column.id}
                                        style={{ minWidth: column.minWidth, backgroundColor: "#569fdfff", color: "white", fontWeight: 'bold' }}
                                    >
                                        {column.label}
                                    </TableCell>
                                ))}
                                <TableCell
                                    style={{ minWidth: 80, backgroundColor: "#569fdfff", color: "white", fontWeight: 'bold', textAlign: "center" }}
                                >
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {currentIncidents.map((incident, index) => (
                                <TableRow hover role="checkbox" tabIndex={-1} key={incident.incident_id || index}>
                                    <TableCell>{indexOfFirstIncident + index + 1}</TableCell>
                                    <TableCell>
                                        {incident.resort_name.length > 25
                                            ? incident.resort_name.slice(0, 25) + "..."
                                            : incident.resort_name}
                                    </TableCell>
                                    <TableCell>{incident.category}</TableCell>
                                    <TableCell>
                                        {incident.notes.length > 20
                                            ? incident.notes.slice(0, 20) + "..."
                                            : incident.notes}
                                    </TableCell>
                                    <TableCell>
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
                                                color: "#fff",
                                                fontWeight: 500,
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>{dayjs(incident.incident_date).format("DD MMM YYYY")}</TableCell>

                                    <TableCell align="center">
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
                                            {canAccess("resortIncidents", "edit") && (
                                                <MenuItem
                                                    onClick={() => {
                                                        handleEdit(menuIncident);
                                                        handleMenuClose();
                                                    }}
                                                >
                                                    <EditIcon fontSize="small" style={{ marginRight: "8px", color: "#1976d2" }} />
                                                    Edit
                                                </MenuItem>
                                            )}
                                            {canAccess("resortIncidents", "edit") && (
                                                <MenuItem
                                                    onClick={() => {
                                                        confirmDelete(menuIncident.incident_id);
                                                        handleMenuClose();
                                                    }}
                                                >
                                                    <DeleteIcon fontSize="small" style={{ marginRight: "8px", color: "#fd0d0d" }} />
                                                    Delete
                                                </MenuItem>
                                            )}
                                        </Menu>
                                    </TableCell>

                                </TableRow>
                            ))}
                            {currentIncidents.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={canAccess("resortIncidents", "edit") ? 7 : 6} align="center">
                                        No incidents found matching the criteria.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* --- Footer/Stats and Pagination --- */}
            <div
                style={{
                    marginTop: "20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: 'wrap'
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
                    {/* --- Pagination Controls (MUI Component) --- */}
                    <Pagination
                        count={totalPages} // Total number of pages
                        page={currentPage} // Current page number (controlled)
                        onChange={handlePageChange} // Function to call when a page is clicked
                        color="primary"
                        size="medium" // or 'large', 'small'
                        showFirstButton
                        showLastButton
                    />
                </div>
            </div>

            {/* --- Modals (Keep as is) --- */}
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

            {/* View Dialog */}
            <Dialog open={viewOpen} onClose={handleCloseView}
                PaperProps={{ sx: { width: "600px", maxWidth: "90%" } }}>
                <DialogTitle>Incident Details</DialogTitle>
                <DialogContent dividers sx={{ backgroundColor: "#f9f9f9" }}>
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

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>Are you sure you want to delete this incident?</DialogTitle>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleDelete} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default IncidentReports;