import React, { useState, useEffect } from "react";
import AddResortModal from "../components/modals/addResortModal";
import ViewResortDialog from "../components/modals/viewResortModal";
import {
  TableContainer,
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
import jsPDF from "jspdf";

const ListView = () => {
  const [tableData, setTableData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedResort, setSelectedResort] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterLinkMargin, setFilterLinkMargin] = useState("All");
  const [open, setOpen] = useState(false);
  const [selectedResortId, setSelectedResortId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewResort, setViewResort] = useState(null);
  const [shake, setShake] = useState(false);

  const [anchorEl, setAnchorEl] = useState(null);
  const [menuResortId, setMenuResortId] = useState(null);
  const openMenu = Boolean(anchorEl);

  const [downloadAnchorEl, setDownloadAnchorEl] = useState(null);
  const openDownloadMenu = Boolean(downloadAnchorEl);

  const itemsPerPage = 8;

  useEffect(() => {
    fetchResorts();
    setCurrentPage(1);
  }, []);

  const fetchResorts = () => {
    fetch(`${process.env.REACT_APP_LOCALHOST}/statistics/getAllResorts`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTableData(data);
        } else if (data.rows && Array.isArray(data.rows)) {
          setTableData(data.rows);
        } else {
          setTableData([]);
          console.warn("Unexpected API response format:", data);
        }
      })
      .catch((err) => {
        console.error("Error fetching resorts:", err);
        setTableData([]);
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

  const checkLinkMargin = (item, criteria) => {
    const horizontal = parseFloat(item.horizontal_link_margin);
    const vertical = parseFloat(item.vertical_link_margin);

    switch (criteria) {
      case "Above 3":
        return (horizontal > 3 && vertical > 3);
      case "Below 3":
        return (horizontal < 3 || vertical < 3);
      case "All":
      default:
        return true;
    }
  };

  const filteredData = tableData
    .filter((item) =>
      filterCategory === "All" || item.category === filterCategory
    )
    .filter((item) =>
      item.resort_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((item) =>
      filterLinkMargin === "All" || checkLinkMargin(item, filterLinkMargin)
    );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const medianetCount = tableData.filter((r) => r.category === "Medianet").length;
  const ooredooCount = tableData.filter((r) => r.category === "Ooredoo").length;

  // CSV export function - simplified without document links
  const exportToCSV = () => {
    const headers = [
      "No.",
      "Resort Name",
      "Category",
      "Island",
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
      "Streamer Types",
      "Transmodulator IP",
      "Middleware IP",
      "Username",
      "Password",
    ];

    const escapeCSV = (value) => {
      if (value == null) return "";
      const escaped = String(value).replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const rows = filteredData.map((item, index) => {
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
        escapeCSV(item.streamer_types),
        escapeCSV(item.transmodelator_ip),
        escapeCSV(item.middleware_ip),
        escapeCSV(item.username),
        escapeCSV(item.password),
      ];
    });

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

  // PDF export function - simplified without document section
  const exportToPDF = () => {
    const doc = new jsPDF('portrait');

    // Helper function to add new page if needed
    const checkPageBreak = (currentY, requiredSpace = 20) => {
      const pageHeight = doc.internal.pageSize.height;
      if (currentY + requiredSpace > pageHeight - 20) {
        doc.addPage('portrait');
        return 20; // Return new Y position after page break
      }
      return currentY;
    };

    // Title for first page
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text("COMPLETE RESORT DETAILS REPORT", 105, 20, { align: "center" });

    // Report info
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 105, 30, { align: "center" });
    doc.text(`Category Filter: ${filterCategory} | Search: ${searchTerm || "None"} | Total Records: ${filteredData.length}`, 105, 37, { align: "center" });

    // Add each resort's data
    filteredData.forEach((item, index) => {
      if (index > 0) {
        doc.addPage('portrait');
      }

      let yPosition = 50;

      // Resort header
      doc.setFillColor(86, 159, 223);
      doc.rect(14, yPosition, 182, 12, 'F');
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(`RESORT ${index + 1}: ${item.resort_name || "N/A"}`, 105, yPosition + 8, { align: "center" });

      yPosition += 20;

      // Basic Information Section - Two Column Layout
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(86, 159, 223);
      doc.text("BASIC INFORMATION", 14, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);

      // Left column
      doc.text(`• Category: ${item.category || "N/A"}`, 20, yPosition);
      doc.text(`• Island: ${item.island || "N/A"}`, 20, yPosition + 7);
      doc.text(`• IPTV Vendor: ${item.iptv_vendor || "N/A"}`, 20, yPosition + 14);
      doc.text(`• Distribution Model: ${item.distribution_model || "N/A"}`, 20, yPosition + 21);

      // Right column
      doc.text(`• TVRO Type: ${item.tvro_type || "N/A"}`, 110, yPosition);
      doc.text(`• TVRO Dish: ${item.tvro_dish || "N/A"}`, 110, yPosition + 7);
      doc.text(`• Dish Type: ${item.dish_type || "N/A"}`, 110, yPosition + 14);
      doc.text(`• Dish Brand: ${item.dish_brand || "N/A"}`, 110, yPosition + 21);

      yPosition += 35;

      // TV Counts
      doc.text(`• Staff Area TVs: ${item.staff_area_tv || "N/A"}`, 20, yPosition);
      doc.text(`• Guest Area TVs: ${item.guest_area_tv || "N/A"}`, 110, yPosition);

      yPosition += 15;

      // Check page break before next section
      yPosition = checkPageBreak(yPosition, 30);

      // Streamer and Network Information Section
      const hasStreamerInfo = item.streamer_types || item.transmodelator_ip || item.middleware_ip || item.username || item.password;
      if (hasStreamerInfo) {
        doc.setFont(undefined, 'bold');
        doc.setTextColor(86, 159, 223);
        doc.text("STREAMER & NETWORK INFORMATION", 14, yPosition);
        yPosition += 8;

        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);

        if (item.streamer_types) {
          doc.text(`• Streamer Types: ${item.streamer_types}`, 20, yPosition);
          yPosition += 7;
        }
        if (item.transmodelator_ip) {
          doc.text(`• Transmodulator IP: ${item.transmodelator_ip}`, 20, yPosition);
          yPosition += 7;
        }
        if (item.middleware_ip) {
          doc.text(`• Middleware IP: ${item.middleware_ip}`, 20, yPosition);
          yPosition += 7;
        }
        if (item.username) {
          doc.text(`• Username: ${item.username}`, 20, yPosition);
          yPosition += 7;
        }
        if (item.password) {
          doc.text(`• Password: ${item.password}`, 20, yPosition);
          yPosition += 7;
        }

        yPosition += 5;
        yPosition = checkPageBreak(yPosition, 30);
      }

      // Signal Information Section
      if (item.category === "Medianet") {
        doc.setFont(undefined, 'bold');
        doc.setTextColor(86, 159, 223);
        doc.text("SIGNAL INFORMATION", 14, yPosition);
        yPosition += 8;

        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);

        // Two column layout for signal info
        doc.text(`• Horizontal Signal: ${item.horizontal_signal || "N/A"}`, 20, yPosition);
        doc.text(`• Vertical Signal: ${item.vertical_signal || "N/A"}`, 110, yPosition);
        doc.text(`• Horizontal Link Margin: ${item.horizontal_link_margin || "N/A"}`, 20, yPosition + 7);
        doc.text(`• Vertical Link Margin: ${item.vertical_link_margin || "N/A"}`, 110, yPosition + 7);

        if (item.signal_level_timestamp) {
          doc.text(`• Signal Timestamp: ${item.signal_level_timestamp}`, 20, yPosition + 14);
          yPosition += 21;
        } else {
          yPosition += 14;
        }

        yPosition = checkPageBreak(yPosition, 40);
      }

      // Contact Details Section - PROPERLY STRUCTURED
      doc.setFont(undefined, 'bold');
      doc.setTextColor(86, 159, 223);
      doc.text("CONTACT DETAILS", 14, yPosition);
      yPosition += 8;

      if (item.contact_details && item.contact_details.length > 0) {
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);

        item.contact_details.forEach((contact, contactIndex) => {
          // Check if we need a new page for this contact
          yPosition = checkPageBreak(yPosition, 25);

          doc.setFont(undefined, 'bold');
          doc.text(`Contact ${contactIndex + 1}:`, 20, yPosition);
          doc.setFont(undefined, 'normal');

          doc.text(`  Name: ${contact.name || "N/A"}`, 25, yPosition + 5);
          doc.text(`  Designation: ${contact.designation || "N/A"}`, 25, yPosition + 10);
          doc.text(`  Email: ${contact.email || "N/A"}`, 25, yPosition + 15);
          doc.text(`  Phone: ${contact.phone || "N/A"}`, 25, yPosition + 20);

          yPosition += 28;
        });
      } else {
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text("No contact details available", 20, yPosition);
        yPosition += 15;
      }

      // Additional Notes Section
      const additionalFields = [
        { label: 'LNB Type', value: item.lnb_type },
        { label: 'Modulation', value: item.modulation },
        { label: 'Frequency', value: item.frequency },
        { label: 'Symbol Rate', value: item.symbol_rate },
        { label: 'Polarization', value: item.polarization }
      ].filter(field => field.value);

      if (additionalFields.length > 0) {
        yPosition = checkPageBreak(yPosition, 30);

        doc.setFont(undefined, 'bold');
        doc.setTextColor(86, 159, 223);
        doc.text("ADDITIONAL INFORMATION", 14, yPosition);
        yPosition += 8;

        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);

        additionalFields.forEach(field => {
          yPosition = checkPageBreak(yPosition, 10);
          doc.text(`• ${field.label}: ${field.value}`, 20, yPosition);
          yPosition += 6;
        });
      }

      // Page footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${index + 1} of ${filteredData.length}`, 105, 290, { align: "center" });
    });

    // Save PDF
    doc.save(`resort_details_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast("Resort details PDF downloaded successfully!", "success");
  };

  const handleOpenDownloadMenu = (event) => {
    setDownloadAnchorEl(event.currentTarget);
  };

  const handleCloseDownloadMenu = () => {
    setDownloadAnchorEl(null);
  };

  const handleCSVDownload = () => {
    exportToCSV();
    handleCloseDownloadMenu();
  };

  const handlePDFDownload = () => {
    exportToPDF();
    handleCloseDownloadMenu();
  };

  const handleOpenMenu = (event, resortId) => {
    setAnchorEl(event.currentTarget);
    setMenuResortId(resortId);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuResortId(null);
  };

  const truncateText = (text, maxLength = 25) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

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

        {/* Category Filter */}
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

        {/* Link Margin Filter */}
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
            value={filterLinkMargin}
            onChange={(e) => {
              setFilterLinkMargin(e.target.value);
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
            <MenuItem value="All"><em>All Link Margins</em></MenuItem>
            <MenuItem value="Above 3">Above Three</MenuItem>
            <MenuItem value="Below 3">Below Three</MenuItem>
          </Select>
        </FormControl>

        {/* Download Button with Menu */}
        <Button
          variant="contained"
          startIcon={<GetApp />}
          onClick={handleOpenDownloadMenu}
          sx={{ borderRadius: "9px", textTransform: "none", backgroundColor: "green" }}
        >
          Download
        </Button>
        <Menu
          anchorEl={downloadAnchorEl}
          open={openDownloadMenu}
          onClose={handleCloseDownloadMenu}
        >
          <MenuItem onClick={handlePDFDownload}>
            Download as PDF
          </MenuItem>
          <MenuItem onClick={handleCSVDownload}>
            Download as CSV
          </MenuItem>
        </Menu>

        {canAccess("resortList", "edit") && (
          <Button
            variant="contained"
            startIcon={<AddIcon fontSize="small" />}
            onClick={() => { setSelectedResort(null); setShowModal(true); }}
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

      <TableContainer component={Paper} sx={{ height: "76.1vh" }}>
        <Table stickyHeader sx={{ width: "100%", tableLayout: "fixed", }}>
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
                    height: 32,
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

                    fontSize: "16px",
                    color: "text.secondary",
                    fontStyle: "italic"
                  }}
                >
                  No resorts found matching the criteria.
                </TableCell>
              </TableRow>
            ) : (
              currentData.map((item, index) => {
                const sequentialNumber = (currentPage - 1) * itemsPerPage + index + 1;

                return (
                  <TableRow key={item.resort_id} hover sx={{ height: 64.8 }}>
                    <TableCell sx={getCellStyle(0)}>
                      {sequentialNumber}
                    </TableCell>

                    <TableCell sx={getCellStyle(1)}>
                      <Tooltip title={item.resort_name || ""} arrow>
                        <span>{truncateText(item.resort_name, 20)}</span>
                      </Tooltip>
                    </TableCell>

                    <TableCell sx={getCellStyle(2)}>
                      {item.category}
                    </TableCell>

                    <TableCell sx={getCellStyle(3)}>
                      <Tooltip title={item.island || ""} arrow>
                        <span>{truncateText(item.island, 15)}</span>
                      </Tooltip>
                    </TableCell>

                    <TableCell sx={getCellStyle(4)}>
                      <Tooltip title={item.contact_details?.map(c => c.name).join(", ") || ""} arrow>
                        <span>{truncateText(item.contact_details?.map(c => c.name).join(", "), 18)}</span>
                      </Tooltip>
                    </TableCell>

                    <TableCell sx={getCellStyle(5)}>
                      <Tooltip title={item.contact_details?.map(c => c.email).join(", ") || ""} arrow>
                        <span>{truncateText(item.contact_details?.map(c => c.email).join(", "), 22)}</span>
                      </Tooltip>
                    </TableCell>

                    <TableCell sx={getCellStyle(6)}>
                      <Tooltip title={item.contact_details?.map(c => c.phone).join(", ") || ""} arrow>
                        <span>{truncateText(item.contact_details?.map(c => c.phone).join(", "), 15)}</span>
                      </Tooltip>
                    </TableCell>

                    <TableCell align="center" sx={{ width: "8%", padding: "8px 4px" }}>
                      <IconButton onClick={(e) => handleOpenMenu(e, item.resort_id)}>
                        <MoreVertIcon />
                      </IconButton>
                      <Menu
                        anchorEl={anchorEl}
                        open={openMenu && menuResortId === item.resort_id}
                        onClose={handleCloseMenu}
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
                );
              })
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