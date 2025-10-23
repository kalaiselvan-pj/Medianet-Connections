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
  TextField,
  Stack,
  Pagination,
  Tooltip,
} from "@mui/material";
import { GetApp } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter } from "@fortawesome/free-solid-svg-icons";
import { showToast } from "./common/toaster";
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
      .then((data) => {

        // Ensure data is always an array
        if (Array.isArray(data)) {
          setTableData(data);
        } else if (data.rows && Array.isArray(data.rows)) {
          // in case your API returns { rows: [...] }
          setTableData(data.rows);
        } else {
          // fallback to empty array
          setTableData([]);
          console.warn("Unexpected API response format:", data);
        }
      })
      .catch((err) => {
        console.error("Error fetching resorts:", err);
        setTableData([]); // fallback to empty array
      });
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
    // FIXED: Added missing slash in API URL
    fetch(`${process.env.REACT_APP_LOCALHOST}/statistics/deleteResort/${selectedResortId}`, {
      method: "DELETE",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to delete resort");
        }
        return res.json();
      })
      .then(() => {
        setTableData(tableData.filter((item) => item.resort_id !== selectedResortId));
        showToast("Resort deleted successfully!", "success");
        setOpen(false);
        setSelectedResortId(null);
      })
      .catch((err) => {
        console.error("Error deleting resort:", err);
        showToast("Error deleting resort!", "error");
      });
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

  // Function to convert buffer data to download URL
  const bufferToDownloadUrl = (bufferData, filename, mimeType) => {
    if (!bufferData || !bufferData.data) return null;
    try {
      const byteArray = new Uint8Array(bufferData.data);
      const blob = new Blob([byteArray], { type: mimeType });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Error converting buffer to URL:", error);
      return null;
    }
  };

  // Function to generate document download links for CSV
  const generateDocumentLinks = (resort) => {
    const baseUrl = window.location.origin;
    const resortId = resort.resort_id;

    const links = {
      survey_form: resort.survey_form && resort.survey_form.data
        ? `${baseUrl}/api/documents/survey_form/${resortId}`
        : "Not Available",
      service_acceptance_form: resort.service_acceptance_form && resort.service_acceptance_form.data
        ? `${baseUrl}/api/documents/service_acceptance_form/${resortId}`
        : "Not Available",
      dish_antenna_image: resort.dish_antena_image && resort.dish_antena_image.data
        ? `${baseUrl}/api/documents/dish_antenna_image/${resortId}`
        : "Not Available",
      signal_image: resort.signal_image && resort.signal_image.data
        ? `${baseUrl}/api/documents/signal_image/${resortId}`
        : "Not Available"
    };

    return links;
  };

  const exportToCSV = () => {
    const headers = [
      "No.",
      "Resort Name",
      "Category",
      "Atoll",
      "Contact Name",
      "Contact Email",
      "Contact Phone",
      "IPTV Vendor",
      "Distribution Model",
      "TVRO Type",
      "TVRO Dish",
      "Staff Area TV",
      "Guest Area TV",
      "Horizontal Signal",
      "Vertical Signal",
      "Horizontal Link Margin",
      "Vertical Link Margin",
      "Signal Level Timestamp",
      "Survey Form Link",
      "Service Acceptance Form Link",
      "Dish Antenna Image Link",
      "Signal Image Link"
    ];

    const escapeCSV = (value) => {
      if (value == null) return "";
      const escaped = String(value).replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const rows = filteredData.map((item, index) => {
      const documentLinks = generateDocumentLinks(item);

      return [
        index + 1,
        escapeCSV(item.resort_name),
        escapeCSV(item.category),
        escapeCSV(item.island),
        escapeCSV(item.contact_details?.map(c => c.name).join(", ")),
        escapeCSV(item.contact_details?.map(c => c.email).join(", ")),
        escapeCSV(item.contact_details?.map(c => c.phone).join(", ")),
        escapeCSV(item.iptv_vendor),
        escapeCSV(item.distribution_model),
        escapeCSV(item.tvro_type),
        escapeCSV(item.tvro_dish),
        escapeCSV(item.staff_area_tv),
        escapeCSV(item.guest_area_tv),
        escapeCSV(item.horizontal_signal),
        escapeCSV(item.vertical_signal),
        escapeCSV(item.horizontal_link_margin),
        escapeCSV(item.vertical_link_margin),
        escapeCSV(item.signal_level_timestamp),
        escapeCSV(documentLinks.survey_form),
        escapeCSV(documentLinks.service_acceptance_form),
        escapeCSV(documentLinks.dish_antenna_image),
        escapeCSV(documentLinks.signal_image)
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "resorts_list_with_documents.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV with document links downloaded successfully!", "success");
  };

  // Function to download individual documents
  const downloadDocument = (bufferData, filename, mimeType) => {
    const url = bufferToDownloadUrl(bufferData, filename, mimeType);
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Clean up the URL object
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } else {
      showToast("Document not available for download", "error");
    }
  };

  // Enhanced export function that includes document download options
  const handleExportWithDocuments = () => {
    exportToCSV();
  };

  const handleOpenMenu = (event, resortId) => {
    setAnchorEl(event.currentTarget);
    setMenuResortId(resortId);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuResortId(null);
  };

  // Function to truncate text with ellipsis
  const truncateText = (text, maxLength = 25) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Updated proportional widths for better content display
  const getColumnWidth = (index) => {
    const widths = [
      "5%",   // No.
      "16%",  // Resort Name
      "10%",  // Category
      "12%",  // Island
      "14%",  // Contact Name
      "18%",  // Contact Email
      "12%",  // Contact Phone
      "8%",   // Actions
    ];
    return widths[index] || "10%";
  };

  // Cell style for truncated content
  const getCellStyle = (index) => ({
    textAlign: "center",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    width: getColumnWidth(index),
    maxWidth: getColumnWidth(index),
    padding: "8px 4px",
  });

  return (
    <div>
      {/* Filters & Buttons */}
      <div className="incident-header" style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center', justifyContent: 'flex-end' }}>

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
              pl: 4,
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

        <Button
          variant="contained"
          startIcon={<GetApp />}
          onClick={handleExportWithDocuments}
          sx={{ borderRadius: "9px", textTransform: "none", backgroundColor: "green" }}
        >
          Download
        </Button>

        {canAccess("resortList", "edit") && (
          <Button
            variant="contained"
            startIcon={<AddIcon fontSize="small" />}
            onClick={() => { setSelectedResort(null); setShowModal(true); }}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              backgroundColor: "#1976d2",
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

      <TableContainer component={Paper} sx={{ height: "75vh" }}>
        <Table stickyHeader sx={{ width: "100%", tableLayout: "fixed" }}>
          <TableHead>
            <TableRow>
              {[
                "No.",
                "Resort Name",
                "Category",
                "Atoll",
                "Contact Name",
                "Contact Email",
                "Contact Phone",
                "Actions",
              ].map((label, i) => (
                <TableCell
                  key={i}
                  sx={{
                    backgroundColor: "#569fdfff",
                    color: "white",
                    fontWeight: "bold",
                    textAlign: "center",
                    padding: "12px 4px",
                    width: getColumnWidth(i),
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    tableLayout: "fixed",
                  }}
                >
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {currentData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  align="center"
                  sx={{
                    height: "200px",
                    fontSize: "16px",
                    color: "text.secondary",
                    fontStyle: "italic"
                  }}
                >
                  No resorts found matching the criteria.
                </TableCell>
              </TableRow>
            ) : (
              currentData.map((item, index) => (
                <TableRow key={item.resort_id} hover sx={{ height: 64.8 }}>
                  {/* No. */}
                  <TableCell sx={getCellStyle(0)}>
                    {index + 1}
                  </TableCell>

                  {/* Resort Name */}
                  <TableCell sx={getCellStyle(1)}>
                    <Tooltip title={item.resort_name || ""} arrow>
                      <span>{truncateText(item.resort_name, 20)}</span>
                    </Tooltip>
                  </TableCell>

                  {/* Category */}
                  <TableCell sx={getCellStyle(2)}>
                    {item.category}
                  </TableCell>

                  {/* Island */}
                  <TableCell sx={getCellStyle(3)}>
                    <Tooltip title={item.island || ""} arrow>
                      <span>{truncateText(item.island, 15)}</span>
                    </Tooltip>
                  </TableCell>

                  {/* Contact Name */}
                  <TableCell sx={getCellStyle(4)}>
                    <Tooltip title={item.contact_details?.map(c => c.name).join(", ") || ""} arrow>
                      <span>{truncateText(item.contact_details?.map(c => c.name).join(", "), 18)}</span>
                    </Tooltip>
                  </TableCell>

                  {/* Contact Email */}
                  <TableCell sx={getCellStyle(5)}>
                    <Tooltip title={item.contact_details?.map(c => c.email).join(", ") || ""} arrow>
                      <span>{truncateText(item.contact_details?.map(c => c.email).join(", "), 22)}</span>
                    </Tooltip>
                  </TableCell>

                  {/* Contact Phone */}
                  <TableCell sx={getCellStyle(6)}>
                    <Tooltip title={item.contact_details?.map(c => c.phone).join(", ") || ""} arrow>
                      <span>{truncateText(item.contact_details?.map(c => c.phone).join(", "), 15)}</span>
                    </Tooltip>
                  </TableCell>

                  {/* Actions */}
                  <TableCell align="center" sx={{ width: "8%", padding: "8px 4px" }}>
                    <IconButton onClick={(e) => handleOpenMenu(e, item.resort_id)}>
                      <MoreVertIcon />
                    </IconButton>
                    <Menu
                      anchorEl={anchorEl}
                      open={openMenu && menuResortId === item.resort_id}
                      onClose={handleCloseMenu}
                      // ADDED: Close menu when clicked outside
                      onClick={handleCloseMenu}
                    >
                      <MenuItem onClick={() => handleView(item)}>
                        <VisibilityIcon fontSize="small" style={{ marginRight: 8, color: "#1976d2" }} /> View
                      </MenuItem>
                      {canAccess("resortList", "edit") && (
                        <MenuItem onClick={() => handleEdit(item)}>
                          <EditIcon fontSize="small" style={{ marginRight: 8, color: "#1976d2" }} /> Edit
                        </MenuItem>
                      )}
                      {canAccess("resortList", "edit") && (
                        <MenuItem onClick={() => handleDelete(item.resort_id)}>
                          <DeleteIcon fontSize="small" style={{ marginRight: 8, color: "#fd0d0d" }} /> Delete
                        </MenuItem>
                      )}
                    </Menu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 10, fontWeight: "bold", padding: "10px", borderRadius: 10 }}>
          <span style={{ color: "#569fdfff" }}>Medianet: {medianetCount}</span>
          <span style={{ color: "#569fdfff" }}>Ooredoo: {ooredooCount}</span>
          <span style={{ color: "#638499ff" }}>Total: {tableData.length}</span>
        </div>
        <Stack spacing={2}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(e, value) => setCurrentPage(value)}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Stack>
      </div>

      <AddResortModal
        showModal={showModal}
        setShowModal={setShowModal}
        selectedResort={selectedResort}
        onClose={() => setSelectedResort(null)}
        onSaveResort={() => { fetchResorts(); setShowModal(false); }}
      />

      {/* DELETE CONFIRMATION DIALOG */}
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
          <Button onClick={handleCancelDelete} color="primary">Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      <ViewResortDialog
        viewDialogOpen={viewDialogOpen}
        setViewDialogOpen={setViewDialogOpen}
        viewResort={viewResort}
      />
    </div>
  );
};

export default ListView;