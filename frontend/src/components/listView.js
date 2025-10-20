import React, { useState, useEffect } from "react";
import AddResortModal from "../components/modals/addResortModal";
import ViewResortDialog from "../components/modals/viewResortModal";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogActions,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Menu,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
  TextField
} from "@mui/material";
import { GetApp } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import "react-toastify/dist/ReactToastify.css";
import { showToast } from "./common/toaster";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter } from "@fortawesome/free-solid-svg-icons";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Pagination, Stack } from "@mui/material";
import { canAccess } from "../rbac/canAccess";


const ListView = () => {
  const [tableData, setTableData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedResort, setSelectedResort] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterCategory, setFilterCategory] = useState("All");
  const [open, setOpen] = useState(false);
  const [selectedResortId, setSelectedResortId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewResort, setViewResort] = useState(null);
  const [shake, setShake] = useState(false);

  const [anchorEl, setAnchorEl] = useState(null);
  const [menuResortId, setMenuResortId] = useState(null);
  const openMenu = Boolean(anchorEl);

  const itemsPerPage = 8;

  useEffect(() => {
    fetchResorts();
    setCurrentPage(1);
  }, []);

  const fetchResorts = () => {
    fetch(`${process.env.REACT_APP_LOCALHOST}/statistics/getAllResorts`)
      .then((res) => res.json())
      .then((data) => setTableData(data))
      .catch((err) => console.error("Error fetching resorts:", err));
  };

  const handleEdit = (resort) => {
    setSelectedResort(resort);
    setShowModal(true);
    handleCloseMenu();
  };

  const handleView = (resort) => {
    setViewResort(resort);
    setViewDialogOpen(true);
    handleCloseMenu();
  };

  const handleDelete = (resort_id) => {
    setSelectedResortId(resort_id);
    setOpen(true);
    handleCloseMenu();
  };

  const handleConfirmDelete = () => {
    fetch(`${process.env.REACT_APP_LOCALHOST}statistics/deleteResort/${selectedResortId}`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then(() => {
        setTableData(tableData.filter((item) => item.resort_id !== selectedResortId));
        showToast("Resort deleted successfully!", "success");
        setOpen(false);
        setSelectedResortId(null);
      })
      .catch((err) => console.error("Error deleting resort:", err));
  };

  const handleCancelDelete = () => {
    setOpen(false);
    setSelectedResortId(null);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const filteredData = tableData
    .filter((item) =>
      filterCategory === "All" || item.category === filterCategory
    )
    .filter((item) =>
      item.resort_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const medianetCount = tableData.filter((r) => r.category === "Medianet").length;
  const ooredooCount = tableData.filter((r) => r.category === "Ooredoo").length;

  const exportToCSV = () => {
    const headers = [
      "No.",
      "Resort Name",
      "Category",
      "Island",
      "Phone Number",
      "Email",
      "IPTV Vendor",
      "Distribution Model",
      "TVRO Type",
      "TVRO Dish",
      "TV Points",
      "Horizontal Signal",
      "Vertical Signal",
      "Horizontal Link_margin",
      "Vertical Link_margin",
    ];
    const rows = filteredData.map((item, index) => [
      index + 1,
      `"${item.resort_name}"`,
      item.category,
      item.island || "",
      item.phone_number || "",
      item.email || "",
      item.iptv_vendor || "",
      item.distribution_model || "",
      item.tvro_type || "",
      item.tvro_dish || "",
      item.tv_points || "",
      item.horizontal_signal || "",
      item.vertical_signal || "",
      item.horizontal_link_margin || "",
      item.vertical_link_margin || "",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "resorts_list.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV downloaded successfully!", "success");
  };

  const handleOpenMenu = (event, resortId) => {
    setAnchorEl(event.currentTarget);
    setMenuResortId(resortId);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuResortId(null);
  };

  const getColumnMinWidth = (index) => {
    const widths = [
      20,   // No.
      200,  // Resort Name
      120,  // Category
      150,  // Island
      120,  // Phone
      200,  // Email
      150,  // IPTV Vendor
      180,  // Distribution Model
      120,  // TVRO Type
      120,  // TVRO Dish
      100,  // TV Points
      140,  // Horizontal Signal
      140,  // Vertical Signal
      160,  // Horizontal Link Margin
      160,  // Vertical Link Margin
      150,  // Actions
    ];
    return widths[index] || 120; // default width
  };


  return (
    <div>
      {/* Filters & Buttons */}
      <div className="incident-header" style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center', justifyContent: 'flex-end' }}>

        {/* Search Field */}
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
                <IconButton onClick={handleClearSearch} edge="end" size="small">
                  <CloseIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ width: '250px' }}
        />

        {/* Filter Dropdown */}
        <FormControl size="small" sx={{ width: "9.5rem", position: "relative" }}>
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
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setCurrentPage(1);
            }}
            displayEmpty
            sx={{
              pl: 4, // space for icon
              borderRadius: "10px",
              fontWeight: "bold",
              fontSize: "14px",
              backgroundColor: "#f0f0f0",
              height: "2.3rem",
            }}
          >
            <MenuItem value="All"><em>All</em></MenuItem>
            <MenuItem value="Medianet">Medianet</MenuItem>
            <MenuItem value="Ooredoo">Ooredoo</MenuItem>
          </Select>
        </FormControl>

        {/* Download Button */}
        <Button
          variant="contained"
          startIcon={<GetApp />}
          onClick={exportToCSV}
          sx={{
            borderRadius: "9px",
            textTransform: "none",
            backgroundColor: "green",
          }}
        >
          Download
        </Button>

        {/* Add Button */}
        {canAccess("resortList", "edit") && (
          <Button
            variant="contained"
            startIcon={<AddIcon fontSize="small" />}
            onClick={() => {
              setSelectedResort(null);
              setShowModal(true);
            }}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              backgroundColor: "#2e86de",
              color: "white",
              fontWeight: "bold",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 12px",
              height: "2.3rem",
              width: "5rem"
            }}
          >
            Add
          </Button>
        )}
      </div>
      {/* 📊 Resort Table */}
      <TableContainer
        component={Paper}
        sx={{
          height: "75vh", // Fixed container height
          overflowX: "auto",
          overflowY: "auto",
        }}
      >
        <Table
          stickyHeader
          sx={{
            width: "100%",
            minWidth: 2200,        // Wider than before for more columns
            tableLayout: "fixed",  // Keep column widths stable
          }}
        >
          <TableHead>
            <TableRow>
              {[
                "No.", "Resort Name", "Category", "Island", "Phone", "Email",
                "IPTV Vendor", "Distribution Model", "TVRO Type", "TVRO Dish",
                "TV Points", "Horizontal Signal", "Vertical Signal",
                "Horizontal Link Margin", "Vertical Link Margin", "Actions",
              ].map((label, i) => (
                <TableCell
                  key={i}
                  sx={{
                    backgroundColor: "#569fdfff",
                    color: "white",
                    fontWeight: "bold",
                    textAlign: "center",
                    padding: "20px 16px", // ← increase vertical padding for taller header
                    minWidth: getColumnMinWidth(i),
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>


          <TableBody>
            {currentData.map((item, index) => (
              <TableRow
                key={item.resort_id}
                hover
                sx={{
                  height: 75, // ← adjust this number for the row height you want
                }}
              >

                {[
                  (currentPage - 1) * itemsPerPage + index + 1,
                  item.resort_name,
                  item.category,
                  item.island,
                  item.phone_number,
                  item.email,
                  item.iptv_vendor,
                  item.distribution_model,
                  item.tvro_type,
                  item.tvro_dish,
                  item.tv_points,
                  item.horizontal_signal,
                  item.vertical_signal,
                  item.horizontal_link_margin,
                  item.vertical_link_margin,
                ].map((value, i) => (
                  <TableCell
                    key={i}
                    sx={{
                      textAlign: "center",
                      padding: "19px", // ← more padding gives "extra space" inside cells
                      minWidth: getColumnMinWidth(i),
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {value}
                  </TableCell>

                ))}

                {/* Actions */}
                <TableCell align="center" sx={{ minWidth: 150, padding: "8px 16px" }}>
                  <IconButton onClick={(e) => handleOpenMenu(e, item.resort_id)}>
                    <MoreVertIcon />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={openMenu && menuResortId === item.resort_id}
                    onClose={handleCloseMenu}
                  >
                    <MenuItem onClick={() => handleView(item)}>
                      <VisibilityIcon fontSize="small" style={{ marginRight: "8px", color: "#1976d2" }} /> View
                    </MenuItem>
                    {canAccess("resortList", "edit") && (
                      <MenuItem onClick={() => handleEdit(item)}>
                        <EditIcon fontSize="small" style={{ marginRight: "8px", color: "#1976d2" }} /> Edit
                      </MenuItem>
                    )}
                    {canAccess("resortList", "edit") && (
                      <MenuItem onClick={() => handleDelete(item.resort_id)}>
                        <DeleteIcon fontSize="small" style={{ marginRight: "8px", color: "#fd0d0d" }} /> Delete
                      </MenuItem>

                    )}
                  </Menu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>





      {/*  Pagination Section */}
      <div
        style={{
          marginTop: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Stats */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "10px",
            borderRadius: "10px",
            fontWeight: "bold",
            gap: "10px",
          }}
        >
          <span style={{ color: "#569fdfff" }}>Medianet: {medianetCount}</span>
          <span style={{ color: "#569fdfff" }}>Ooredoo: {ooredooCount}</span>
          <span style={{ color: "#638499ff" }}>Total: {tableData.length}</span>
        </div>

        {/* MUI Pagination */}
        <Stack spacing={2}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(event, value) => setCurrentPage(value)}
            color="primary"
            size="medium" // or 'large', 'small'
            showFirstButton
            showLastButton
          />
        </Stack>
      </div>


      {/* Add/Edit Modal */}
      <AddResortModal
        showModal={showModal}
        setShowModal={setShowModal}
        selectedResort={selectedResort}
        onClose={() => setSelectedResort(null)}
        onSaveResort={() => {
          fetchResorts();
          setShowModal(false);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={open}
        onClose={(event, reason) => {
          if (reason === "backdropClick" || reason === "escapeKeyDown") {
            setShake(true);
            setTimeout(() => setShake(false), 500);
            return;
          }
          handleCancelDelete();
        }}
        PaperProps={{ sx: { animation: shake ? "shake 0.5s" : "none" } }}
      >
        <style>{`
          @keyframes shake {
            0% { transform: translateX(0); }
            25% { transform: translateX(-8px); }
            50% { transform: translateX(8px); }
            75% { transform: translateX(-8px); }
            100% { transform: translateX(0); }
          }
        `}</style>
        <DialogTitle>Are you sure you want to delete this resort?</DialogTitle>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Resort Dialog */}
      <ViewResortDialog
        viewDialogOpen={viewDialogOpen}
        setViewDialogOpen={setViewDialogOpen}
        viewResort={viewResort}
      />
    </div>
  );
};

export default ListView;