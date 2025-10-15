import React, { useState, useEffect } from "react";
import AddResortModal from "../components/modals/addResortModal";
import { Button, Dialog, DialogTitle, DialogActions, FormControl, Select, MenuItem, IconButton, DialogContent, Menu } from "@mui/material";
import { GetApp } from "@mui/icons-material";
import AddIcon from '@mui/icons-material/Add';
import "react-toastify/dist/ReactToastify.css";
import { showToast } from "./common/toaster";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter } from '@fortawesome/free-solid-svg-icons';
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from "@mui/icons-material/Edit";
import { canAccess } from "../rbac/canAccess";
import VisibilityIcon from '@mui/icons-material/Visibility';
import MoreVertIcon from "@mui/icons-material/MoreVert";

const ListView = () => {
  const [tableData, setTableData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedResort, setSelectedResort] = useState(null); // for add/edit
  const [currentPage, setCurrentPage] = useState(1);
  const [filterCategory, setFilterCategory] = useState("All");
  const [selectedResortId, setSelectedResortId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRow, setSelectedRow] = useState(null); // Track selected row
  const [viewOpen, setViewOpen] = useState(false);      // For viewing details
  const [deleteOpen, setDeleteOpen] = useState(false);  // For delete confirmation
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);


  const itemsPerPage = 5;

  useEffect(() => {
    fetchResorts();
    setCurrentPage(1);
  }, []);

  const fetchResorts = () => {
    fetch("http://localhost:5000/statistics/getAllResorts")
      .then((res) => res.json())
      .then((data) => setTableData(data))
      .catch((err) => console.error("Error fetching resorts:", err));
  };

  const handleEdit = (resort) => {
    setSelectedResort(resort); // set resort to edit
    setShowModal(true);        // open modal
  };

  const handleDelete = (resort_id) => {
    setSelectedResortId(resort_id);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    fetch(`http://localhost:5000/statistics/deleteResort/${selectedResortId}`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then(() => {
        setTableData(tableData.filter((item) => item.resort_id !== selectedResortId));
        showToast("Resort deleted successfully!", "success");
        setDeleteOpen(false);
        setSelectedResortId(null);
      })
      .catch((err) => console.error("Error deleting resort:", err));
  };

  const handleCancelDelete = () => {
    setDeleteOpen(false);
    setSelectedResortId(null);
  };

  // Handler for search input
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // reset to first page on search
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const filteredData = tableData
    .filter((item) =>
      filterCategory === "All" || item.category === filterCategory
        ? true
        : item.category === filterCategory
    )
    .filter((item) =>
      item.resort_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const goToPreviousPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

  const medianetCount = tableData.filter((r) => r.category === "Medianet").length;
  const ooredooCount = tableData.filter((r) => r.category === "Ooredoo").length;

  const exportToCSV = () => {
    const headers = ["No.", "Resort Name", "Category", "Island", "Phone Number", "Email"];
    const rows = filteredData.map((item, index) => [
      index + 1,
      `"${item.resort_name}"`,
      item.category,
      item.island || "",
      item.phone_number || "",
      item.email || "",
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "resorts_list.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV downloaded successfully!", "success");
  };

  const handleMenuOpen = (event, row) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuRow(row);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuRow(null);
  };

  const handleViewClick = (item) => {
    setSelectedRow(item);
    setViewOpen(true);
  };
  const handleCloseView = () => {
    setViewOpen(false);
    setSelectedRow(null);
  };

  return (
    <div style={{ padding: "10px" }}>
      {/* Filters & Buttons */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
        {/* Search Bar */}
        <div className="search-wrapper" style={{ marginRight: "15px" }}>
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
        <div style={{ position: "relative", display: "inline-block", marginRight: "15px" }}>
          <FontAwesomeIcon
            icon={faFilter}
            style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "rgb(43 142 228)", fontSize: "20px", zIndex: 1 }}
          />
          <FormControl size="small" sx={{ width: "9.3rem" }}>
            <Select
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
              displayEmpty
              sx={{ pl: 4, borderRadius: "10px", fontWeight: "bold", fontSize: "14px", backgroundColor: "#f0f0f0", height: "2.3rem" }}
            >
              <MenuItem value="All"><em>All</em></MenuItem>
              <MenuItem value="Medianet">Medianet</MenuItem>
              <MenuItem value="Ooredoo">Ooredoo</MenuItem>
            </Select>
          </FormControl>
        </div>

        <Button
          variant="contained"
          startIcon={<GetApp />}
          onClick={exportToCSV}
          style={{ marginRight: "15px", borderRadius: "9px", textTransform: "none", backgroundColor: "green" }}
        >
          Download
        </Button>

        {canAccess("resortList", "edit") && (<button
          onClick={() => { setSelectedResort(null); setShowModal(true); }}
          style={{ width: "5rem", backgroundColor: "#2e86de", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "8px 12px" }}
        >
          <AddIcon fontSize="small" /> Add
        </button>
        )}
      </div>

      {/* Table */}
      <table
        style={{
          borderCollapse: "collapse",
          width: "100%",
          borderTop: "1px solid #ddd",
          borderBottom: "1px solid #ddd",
          height: "72vh"
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#569fdfff", color: "white" }}>
            <th style={{ padding: "10px", borderBottom: "1px solid #ddd", textAlign: "left" }}>No.</th>
            <th style={{ padding: "10px", borderBottom: "1px solid #ddd", textAlign: "left" }}>Resort Name</th>
            <th style={{ padding: "10px", borderBottom: "1px solid #ddd", textAlign: "left" }}>Category</th>
            <th style={{ padding: "10px", borderBottom: "1px solid #ddd", textAlign: "left" }}>Island</th>
            <th style={{ padding: "10px", borderBottom: "1px solid #ddd", textAlign: "left" }}>Phone</th>
            <th style={{ padding: "10px", borderBottom: "1px solid #ddd", textAlign: "left" }}>Email</th>
            {canAccess("resortList", "edit") && <th style={{ padding: "10px", borderBottom: "1px solid #ddd", textAlign: "center" }}>Actions</th>}

          </tr>
        </thead>

        <tbody style={{ backgroundColor: "white" }}>
          {currentData.map((item, index) => (
            <tr key={item.resort_id}>
              <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
                {(currentPage - 1) * itemsPerPage + index + 1}
              </td>
              <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
                {item.resort_name?.length > 20
                  ? item.resort_name.slice(0, 20) + "..."
                  : item.resort_name}
              </td>

              <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
                {item.category}
              </td>

              <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
                {item.island?.length > 16
                  ? item.island.slice(0, 16) + "..."
                  : item.island}
              </td>

              <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>{item.phone_number}</td>
              <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
                {item.email?.length > 23
                  ? item.email.slice(0, 23) + "..."
                  : item.email}
              </td>

              {canAccess("resortList", "edit") && (
                <td style={{ padding: "10px", borderBottom: "1px solid #eee", textAlign: "center" }}>
                  {canAccess("resortList", "edit") && (
                    <>
                      <IconButton onClick={(e) => handleMenuOpen(e, item)}>
                        <MoreVertIcon />
                      </IconButton>

                      <Menu
                        anchorEl={menuAnchorEl}
                        open={Boolean(menuAnchorEl) && menuRow?.resort_id === item.resort_id}
                        onClose={handleMenuClose}
                        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                        transformOrigin={{ vertical: "top", horizontal: "right" }}
                      >
                        <MenuItem
                          onClick={() => {
                            handleViewClick(item);
                            handleMenuClose();
                          }}
                        >
                          <VisibilityIcon fontSize="small" style={{ marginRight: "8px", color: "#1976d2" }} />
                          View
                        </MenuItem>

                        <MenuItem
                          onClick={() => {
                            handleEdit(item);
                            handleMenuClose();
                          }}
                        >
                          <EditIcon fontSize="small" style={{ marginRight: "8px", color: "#1976d2" }} />
                          Edit
                        </MenuItem>

                        <MenuItem
                          onClick={() => {
                            handleDelete(item.resort_id);
                            handleMenuClose();
                          }}
                        >
                          <DeleteIcon fontSize="small" style={{ marginRight: "8px", color: "#fd0d0dff" }} />
                          Delete
                        </MenuItem>
                      </Menu>
                    </>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Popup Dialog */}
      <Dialog open={viewOpen} onClose={handleCloseView}
        PaperProps={{
          sx: {
            width: "500px",   // set your desired width
            maxWidth: "90%",  // optional, keeps it responsive
          }
        }}>
        <DialogTitle>Resort Details</DialogTitle>
        <DialogContent dividers>
          {selectedRow && (
            <div>
              <p><strong>Resort Name:</strong> {selectedRow.resort_name}</p>
              <p><strong>Category:</strong> {selectedRow.category}</p>
              <p><strong>Island:</strong> {selectedRow.island}</p>
              <p><strong>Phone:</strong> {selectedRow.phone_number}</p>
              <p><strong>Email:</strong> {selectedRow.email}</p>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseView} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>


      {/* Pagination */}
      <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "10px", borderRadius: "10px", fontWeight: "bold" }}>
          <span style={{ color: "#569fdfff", marginRight: "10px" }}>Medianet: {medianetCount}</span>
          <span style={{ color: "#569fdfff", marginInline: "10px" }}>Ooredoo: {ooredooCount}</span>
          <span style={{ color: "#638499ff", marginInline: "10px" }}>Total: {tableData.length}</span>
        </div>
        <button onClick={goToPreviousPage} disabled={currentPage === 1} style={{ padding: "8px 16px", borderRadius: "10px", border: "none", backgroundColor: "#569fdfff", color: "white !important", fontSize: "15px", width: "50px", height: "30px", cursor: currentPage === 1 ? "not-allowed" : "pointer" }}>◁</button>
        <span style={{ marginTop: "3px" }}>Page {currentPage} of {totalPages}</span>
        <button onClick={goToNextPage} disabled={currentPage === totalPages} style={{ padding: "8px 16px", borderRadius: "10px", border: "none", backgroundColor: "#569fdfff", color: "white", fontSize: "15px", width: "50px", height: "30px", cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}>▷</button>
      </div>

      {/* Add/Edit Modal */}
      <AddResortModal
        showModal={showModal}
        setShowModal={setShowModal}
        selectedResort={selectedResort}
        onClose={() => setSelectedResort(null)}
        onSaveResort={() => {
          fetchResorts(); //  Refresh table after save
          setShowModal(false); // close modal
        }}
      />


      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onClose={handleCancelDelete}>
        <DialogTitle>Are you sure you want to delete this resort?</DialogTitle>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ListView;



