import React, { useState, useEffect } from "react";
import AddBpModal from "../modals/addBpModal";
import ViewBpModal from '../modals/viewBpModal';

import {
    TableContainer,
    Button,
    Dialog,
    DialogTitle,
    DialogActions,
    IconButton,
    Menu,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Paper,
    MenuItem,
    InputAdornment,
    TextField,
    Stack,
    Pagination,
    Tooltip,
    Box,
    Typography
} from "@mui/material";
import { GetApp } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { showToast } from '../common/toaster';
import { canAccess } from '../../rbac/canAccess.js';

import jsPDF from "jspdf";

const BpDetails = () => {
    const [tableData, setTableData] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedBp, setSelectedBp] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [open, setOpen] = useState(false);
    const [selectedBpId, setSelectedBpId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [viewBp, setViewBp] = useState(null);
    const [shake, setShake] = useState(false);
    const [islands, setIslands] = useState([]);

    const [anchorEl, setAnchorEl] = useState(null);
    const [menuBpId, setMenuBpId] = useState(null);
    const openMenu = Boolean(anchorEl);

    const [downloadAnchorEl, setDownloadAnchorEl] = useState(null);
    const openDownloadMenu = Boolean(downloadAnchorEl);

    const itemsPerPage = 8;

    useEffect(() => {
        fetchBpDetails();
        fetchIslands();
        setCurrentPage(1);
    }, []);

    // Fetch islands data from API
    const fetchIslands = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_LOCALHOST}/statistics/getIslandInformations`);
            if (response.ok) {
                const data = await response.json();
                setIslands(data);
            } else {
                throw new Error('Failed to fetch islands');
            }
        } catch (error) {
            console.error("Error fetching islands:", error);
            showToast("Failed to load islands data", "error");
        }
    };

    // Get island name by island_id
    const getIslandName = (islandId) => {
        if (!islandId || islands.length === 0) return "Loading...";
        const island = islands.find(item => item.island_id === islandId);
        return island ? island.island_name : "Unknown Island";
    };

    const fetchBpDetails = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_LOCALHOST}/statistics/getAllBusinessRegisters`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Handle different response formats and map the data
            let extractedData = [];

            if (Array.isArray(data)) {
                extractedData = data;
            } else if (data && Array.isArray(data.data)) {
                extractedData = data.data;
            } else if (data && Array.isArray(data.businessRegisters)) {
                extractedData = data.businessRegisters;
            } else {
                console.warn('Unexpected data format:', data);
                extractedData = [];
            }

            // Map API data to table structure with all required fields
            const mappedData = extractedData.map(item => ({
                id: item.business_id || item.id,
                registerName: item.register_name || "",
                registerNumber: item.register_number || "",
                serviceProvider: item.service_provider || "",
                oltOwner: item.olt_owner || "",
                networkType: item.network_type || "",
                convertor: item.fiber_coax_convertor || "",
                contactInformation: item.contact_information || "",
                islandName: item.island_name || getIslandName(item.island_id),
                islandId: item.island_id,
                islandAttachFiles: item.island_attach_files || [],
                // Include the actual file buffer data and other original fields
                island_attach: item.island_attach,
                island_attach_name: item.island_attach_name,
                island_attach_type: item.island_attach_type,
                island_id: item.island_id,
                createdAt: item.created_at,
                updatedAt: item.updated_at,
                actions: item.actions,
                // TVRO fields
                tvro_type: item.tvro_type,
                dish_type: item.dish_type,
                dish_brand: item.dish_brand,
                dish_antena_size: item.dish_antena_size,
                // Signal fields
                horizontal_signal: item.horizontal_signal,
                vertical_signal: item.vertical_signal,
                horizontal_link_margin: item.horizontal_link_margin,
                vertical_link_margin: item.vertical_link_margin,
                signal_level_update_time: item.signal_level_update_time,
                // Include all original fields for backward compatibility
                ...item
            }));
            setTableData(mappedData);
        } catch (error) {
            console.error('Fetch failed:', error);
            setTableData([]);
        }
    };

    // Enhanced handleEdit function to properly handle file data
    const handleEdit = (bp) => {

        // Create a properly formatted object for the edit modal
        const editBpData = {
            // Core fields for the modal
            bp_id: bp.id || bp.business_id,
            register_name: bp.registerName || bp.register_name || "",
            register_number: bp.registerNumber || bp.register_number || "",
            service_provider: bp.serviceProvider || bp.service_provider || "",
            olt_owner: bp.oltOwner || bp.olt_owner || "",
            network_type: bp.networkType || bp.network_type || "",
            fiber_coax_convertor: bp.convertor || bp.fiber_coax_convertor || "",
            island_id: bp.island_id || bp.island || "",
            island: bp.island_id || bp.island || "",

            // Contact information - ensure it's properly formatted
            contact_information: bp.contactInformation || bp.contact_information || "",

            // File attachments - CRITICAL: Ensure file data is properly passed
            island_attach: bp.island_attach,
            island_attach_name: bp.island_attach_name,
            island_attach_type: bp.island_attach_type,
            island_attach_files: bp.islandAttachFiles || [],

            // TVRO fields
            tvro_type: bp.tvro_type,
            dish_type: bp.dish_type,
            dish_brand: bp.dish_brand,
            dish_antena_size: bp.dish_antena_size,

            // Signal fields
            horizontal_signal: bp.horizontal_signal,
            vertical_signal: bp.vertical_signal,
            horizontal_link_margin: bp.horizontal_link_margin,
            vertical_link_margin: bp.vertical_link_margin,
            signal_level_update_time: bp.signal_level_update_time,

            // Timestamps
            created_at: bp.createdAt || bp.created_at,
            updated_at: bp.updatedAt || bp.updated_at,

            // Include all original data for debugging
            ...bp
        };

        setSelectedBp(editBpData);
        setShowModal(true);
        handleCloseMenu();
    };

    const handleView = (bp) => {
        setViewBp(bp);
        setViewDialogOpen(true);
        handleCloseMenu();
    };

    const handleDelete = (id) => {
        setSelectedBpId(id);
        setOpen(true);
        handleCloseMenu();
    };

    const handleConfirmDelete = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_LOCALHOST}/statistics/deleteBusinessRegister/${selectedBpId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete BP details");
            }

            const result = await response.json();
            setTableData(tableData.filter((item) => item.id !== selectedBpId));
            showToast("BP details deleted successfully!", "success");
            setOpen(false);
            setSelectedBpId(null);
            fetchBpDetails(); // Refresh the data
        } catch (err) {
            console.error("Error deleting BP details:", err);
            showToast("Error deleting BP details!", "error");
        }
    };

    const handleCancelDelete = () => {
        setOpen(false);
        setSelectedBpId(null);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleClearSearch = () => {
        setSearchTerm("");
    };

    // Helper function to safely convert contact information to string for searching
    const formatContactInformationForSearch = (contactInfo) => {
        if (!contactInfo) return "";

        try {
            if (typeof contactInfo === 'string') {
                return contactInfo;
            } else if (typeof contactInfo === 'object' && contactInfo !== null) {
                return JSON.stringify(contactInfo);
            }
            return String(contactInfo);
        } catch (error) {
            console.error('Error formatting contact information for search:', error);
            return "";
        }
    };

    const filteredData = tableData.filter((item) => {
        const searchTermLower = searchTerm.toLowerCase();

        return (
            (item.registerName?.toString().toLowerCase() || "").includes(searchTermLower) ||
            (item.registerNumber?.toString().toLowerCase() || "").includes(searchTermLower) ||
            (item.serviceProvider?.toString().toLowerCase() || "").includes(searchTermLower) ||
            (item.islandName?.toString().toLowerCase() || "").includes(searchTermLower) ||
            (formatContactInformationForSearch(item.contactInformation).toLowerCase() || "").includes(searchTermLower) ||
            (item.oltOwner?.toString().toLowerCase() || "").includes(searchTermLower) ||
            (item.networkType?.toString().toLowerCase() || "").includes(searchTermLower) ||
            (item.convertor?.toString().toLowerCase() || "").includes(searchTermLower)
        );
    });

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const currentData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // CSV export function for BP details - UPDATED WITH ALL FIELDS
    const exportToCSV = () => {
        const headers = [
            "No.",
            "Register Name",
            "Register Number",
            "Service Provider",
            "OLT Owner",
            "Network Type",
            "Island Name", // CHANGED: Convertor to Island Name
            "Fiber Coax Convertor", // MOVED: Convertor to new position
            "TVRO Type",
            "Dish Type",
            "Dish Brand",
            "Dish Antenna Size",
            "Horizontal Signal",
            "Horizontal Link Margin",
            "Vertical Signal",
            "Vertical Link Margin",
            "Signal Last Updated",
            "Contact Information",


        ];

        const escapeCSV = (value) => {
            if (value == null) return "";
            const escaped = String(value).replace(/"/g, '""');
            return `"${escaped}"`;
        };

        const rows = filteredData.map((item, index) => {
            return [
                index + 1,
                escapeCSV(item.registerName),
                escapeCSV(item.registerNumber),
                escapeCSV(item.serviceProvider),
                escapeCSV(item.oltOwner),
                escapeCSV(item.networkType),
                escapeCSV(item.islandName), // CHANGED: Island Name instead of Convertor
                escapeCSV(item.convertor), // MOVED: Convertor to new position
                escapeCSV(item.tvro_type),
                escapeCSV(item.dish_type),
                escapeCSV(item.dish_brand),
                escapeCSV(item.dish_antena_size),
                escapeCSV(item.horizontal_signal),
                escapeCSV(item.horizontal_link_margin),
                escapeCSV(item.vertical_signal),
                escapeCSV(item.vertical_link_margin),
                escapeCSV(item.signal_level_update_time || ""),
                escapeCSV(formatContactInformationForSearch(item.contactInformation)),


            ];
        });

        const csvContent =
            "data:text/csv;charset=utf-8," +
            [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const link = document.createElement("a");
        link.href = encodeURI(csvContent);
        link.download = "bp_details_list.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("CSV downloaded successfully!", "success");
    };

    // Helper function to format contact information for PDF
    const formatContactInformation = (contactInfo) => {
        if (!contactInfo) return [];

        try {
            let contacts = [];

            if (Array.isArray(contactInfo)) {
                contacts = contactInfo;
            } else if (typeof contactInfo === 'string') {
                if (contactInfo.trim().startsWith('[') && contactInfo.trim().endsWith(']')) {
                    contacts = JSON.parse(contactInfo);
                } else if (contactInfo.trim().startsWith('{') && contactInfo.trim().endsWith('}')) {
                    contacts = [JSON.parse(contactInfo)];
                } else {
                    contacts = [{ name: contactInfo }];
                }
            } else if (typeof contactInfo === 'object' && contactInfo !== null) {
                contacts = [contactInfo];
            }

            return contacts;
        } catch (error) {
            console.error('Error parsing contact information:', error);
            return [];
        }
    };

    // PDF export function for BP details - UPDATED WITH ALL FIELDS
    const exportToPDF = () => {
        const doc = new jsPDF('portrait');

        const checkPageBreak = (currentY, requiredSpace = 20) => {
            const pageHeight = doc.internal.pageSize.height;
            if (currentY + requiredSpace > pageHeight - 20) {
                doc.addPage('portrait');
                return 20;
            }
            return currentY;
        };

        const drawContactTable = (contacts, startY) => {
            let yPosition = startY;

            doc.setFillColor(86, 159, 223);
            doc.rect(14, yPosition, 182, 8, 'F');
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(255, 255, 255);

            doc.text("Name", 20, yPosition + 5);
            doc.text("Designation", 60, yPosition + 5);
            doc.text("Email", 110, yPosition + 5);
            doc.text("Phone", 160, yPosition + 5);

            yPosition += 8;

            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(0, 0, 0);

            contacts.forEach((contact, index) => {
                yPosition = checkPageBreak(yPosition, 10);

                if (index % 2 === 0) {
                    doc.setFillColor(245, 245, 245);
                    doc.rect(14, yPosition, 182, 8, 'F');
                }

                const name = contact.name || "N/A";
                const designation = contact.designation || "N/A";
                const email = contact.email || "N/A";
                const phone = contact.phone || "N/A";

                const truncateText = (text, maxLength) => {
                    if (!text || text.length <= maxLength) return text;
                    return text.substring(0, maxLength - 3) + "...";
                };

                doc.text(truncateText(name, 25), 16, yPosition + 5);
                doc.text(truncateText(designation, 25), 62, yPosition + 5);
                doc.text(truncateText(email, 30), 112, yPosition + 5);
                doc.text(truncateText(phone, 20), 162, yPosition + 5);

                yPosition += 8;
            });

            return yPosition + 5;
        };

        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text("COMPLETE BP DETAILS REPORT", 105, 20, { align: "center" });

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Search: ${searchTerm || "None"} | Total Records: ${filteredData.length}`, 105, 30, { align: "center" });
        doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 105, 37, { align: "center" });

        filteredData.forEach((item, index) => {
            if (index > 0) {
                doc.addPage('portrait');
            }

            let yPosition = 50;

            doc.setFillColor(86, 159, 223);
            doc.rect(14, yPosition, 182, 12, 'F');
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text(`BP RECORD ${index + 1}: ${item.registerName || "N/A"}`, 105, yPosition + 8, { align: "center" });

            yPosition += 20;

            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(86, 159, 223);
            doc.text("BASIC INFORMATION", 14, yPosition);
            yPosition += 8;

            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(0, 0, 0);

            doc.text(`• Register Name: ${item.registerName || "N/A"}`, 20, yPosition);
            doc.text(`• Register Number: ${item.registerNumber || "N/A"}`, 20, yPosition + 7);
            doc.text(`• Service Provider: ${item.serviceProvider || "N/A"}`, 20, yPosition + 14);
            doc.text(`• OLT Owner: ${item.oltOwner || "N/A"}`, 20, yPosition + 21);

            doc.text(`• Network Type: ${item.networkType || "N/A"}`, 110, yPosition);
            doc.text(`• Island Name: ${item.islandName || "N/A"}`, 110, yPosition + 7); // CHANGED: Island Name
            doc.text(`• Fiber Coax Convertor: ${item.convertor || "N/A"}`, 110, yPosition + 14); // MOVED: Convertor

            yPosition += 28;

            yPosition = checkPageBreak(yPosition, 50);

            // TVRO Information Section - NEW
            doc.setFont(undefined, 'bold');
            doc.setTextColor(86, 159, 223);
            doc.text("TVRO INFORMATION", 14, yPosition);
            yPosition += 8;

            doc.setFont(undefined, 'normal');
            doc.setTextColor(0, 0, 0);

            doc.text(`• TVRO Type: ${item.tvro_type || "N/A"}`, 20, yPosition);
            doc.text(`• Dish Type: ${item.dish_type || "N/A"}`, 20, yPosition + 7);
            doc.text(`• Dish Brand: ${item.dish_brand || "N/A"}`, 20, yPosition + 14);
            doc.text(`• Dish Antenna Size: ${item.dish_antena_size || "N/A"}`, 20, yPosition + 21);

            yPosition += 28;

            yPosition = checkPageBreak(yPosition, 50);

            // Signal Levels Section - NEW
            doc.setFont(undefined, 'bold');
            doc.setTextColor(86, 159, 223);
            doc.text("SIGNAL LEVELS", 14, yPosition);
            yPosition += 8;

            doc.setFont(undefined, 'normal');
            doc.setTextColor(0, 0, 0);

            doc.text(`• Horizontal Signal: ${item.horizontal_signal || "N/A"}`, 20, yPosition);
            doc.text(`• Horizontal Link Margin: ${item.horizontal_link_margin || "N/A"}`, 20, yPosition + 7);
            doc.text(`• Vertical Signal: ${item.vertical_signal || "N/A"}`, 20, yPosition + 14);
            doc.text(`• Vertical Link Margin: ${item.vertical_link_margin || "N/A"}`, 20, yPosition + 21);

            if (item.signal_level_update_time) {
                doc.text(`• Last Updated: ${item.signal_level_update_time}`, 20, yPosition + 28);
                yPosition += 35;
            } else {
                yPosition += 28;
            }

            yPosition = checkPageBreak(yPosition, 50);

            doc.setFont(undefined, 'bold');
            doc.setTextColor(86, 159, 223);
            doc.text("CONTACT DETAILS", 14, yPosition);
            yPosition += 8;

            const contacts = formatContactInformation(item.contactInformation);

            if (contacts.length > 0) {
                yPosition = drawContactTable(contacts, yPosition);
            } else {
                doc.setFont(undefined, 'normal');
                doc.setTextColor(0, 0, 0);
                doc.text("No contact details available", 20, yPosition);
                yPosition += 15;
            }

            yPosition = checkPageBreak(yPosition, 30);

            if (item.islandAttachFiles && item.islandAttachFiles.length > 0) {
                doc.setFont(undefined, 'bold');
                doc.setTextColor(86, 159, 223);
                doc.text("FILE ATTACHMENTS", 14, yPosition);
                yPosition += 8;

                doc.setFont(undefined, 'normal');
                doc.setTextColor(0, 0, 0);

                item.islandAttachFiles.forEach((file, fileIndex) => {
                    yPosition = checkPageBreak(yPosition, 15);
                    doc.text(`• File ${fileIndex + 1}: ${file.originalName || file.filename || "Unnamed File"}`, 20, yPosition);

                    if (file.size) {
                        doc.text(`  Size: ${(file.size / 1024).toFixed(2)} KB`, 25, yPosition + 5);
                        yPosition += 10;
                    } else {
                        yPosition += 7;
                    }
                });

                yPosition += 5;
            }

            yPosition = checkPageBreak(yPosition, 30);

            doc.setFont(undefined, 'bold');
            doc.setTextColor(86, 159, 223);
            doc.text("TIMESTAMP INFORMATION", 14, yPosition);
            yPosition += 8;

            doc.setFont(undefined, 'normal');
            doc.setTextColor(0, 0, 0);

            if (item.createdAt) {
                doc.text(`• Created: ${new Date(item.createdAt).toLocaleString()}`, 20, yPosition);
            }
            if (item.updatedAt) {
                doc.text(`• Last Updated: ${new Date(item.updatedAt).toLocaleString()}`, 110, yPosition);
            }

            if (item.createdAt || item.updatedAt) {
                yPosition += 10;
            } else {
                doc.text("No timestamp information available", 20, yPosition);
                yPosition += 15;
            }

            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Page ${index + 1} of ${filteredData.length}`, 105, 290, { align: "center" });
        });

        doc.save(`bp_details_${new Date().toISOString().split('T')[0]}.pdf`);
        showToast("BP details PDF downloaded successfully!", "success");
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

    const handleOpenMenu = (event, bpId) => {
        setAnchorEl(event.currentTarget);
        setMenuBpId(bpId);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
        setMenuBpId(null);
    };

    const truncateText = (text, maxLength = 25) => {
        if (!text) return "";
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    };

    const getColumnWidth = (index) => {
        const widths = [
            "5%",   // No.
            "16%",  // Register Name
            "14%",  // Register Number
            "16%",  // Service Provider
            "12%",  // OLT Owner
            "12%",  // Network Type
            "15%",  // Island Name (CHANGED: Replaced Convertor with Island Name)
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

    // Handle Add BP
    const handleAddBp = () => {
        setSelectedBp(null);
        setShowModal(true);
    };

    // Enhanced Handle Save BP with proper file handling
    const handleSaveBp = async (savedData) => {

        try {
            // Refresh the table data
            await fetchBpDetails();
            setShowModal(false);
            setSelectedBp(null);

            // Show success message
            if (savedData && savedData.business_id) {

            } else {

            }
        } catch (error) {
            console.error('Error refreshing data after save:', error);
            showToast("BP details saved but there was an error refreshing the table.", "warning");
        }
    };

    return (
        <div>
            {/* Filters & Buttons */}
            <div className="incident-header" style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center', justifyContent: 'flex-end' }}>
                <TextField
                    variant="outlined"
                    size="small"
                    placeholder="Search by register name "
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
                    sx={{ width: '300px' }}
                />

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

                {canAccess("bpDetails", "edit") && (

                    <Button
                        variant="contained"
                        startIcon={<AddIcon fontSize="small" />}
                        onClick={handleAddBp}
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
                            width: "5rem",
                            '&:hover': { backgroundColor: '#1e5dbd' },
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
                                "Register Name",
                                "Register Number",
                                "Island Name",
                                " Provider",
                                "OLT Owner",
                                "Network Type",
                                // CHANGED: Convertor to Island Name
                                "Actions",
                            ].map((label, i) => (
                                <TableCell
                                    key={i}
                                    sx={{
                                        backgroundColor: "#0670a4",
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
                                    No BP details found matching the criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            currentData.map((item, index) => {
                                const sequentialNumber = (currentPage - 1) * itemsPerPage + index + 1;

                                return (
                                    <TableRow key={item.id} hover sx={{ height: 64.8 }}>
                                        <TableCell sx={getCellStyle(0)}>
                                            {sequentialNumber}
                                        </TableCell>

                                        <TableCell sx={getCellStyle(1)}>
                                            <Tooltip title={item.registerName || ""} arrow>
                                                <span>{truncateText(item.registerName, 20)}</span>
                                            </Tooltip>
                                        </TableCell>

                                        <TableCell sx={getCellStyle(2)}>
                                            <Tooltip title={item.registerNumber || ""} arrow>
                                                <span>{truncateText(item.registerNumber, 18)}</span>
                                            </Tooltip>
                                        </TableCell>

                                        <TableCell sx={getCellStyle(6)}>
                                            <Tooltip title={item.islandName || ""} arrow>
                                                <span>{truncateText(item.islandName, 20)}</span>
                                            </Tooltip>
                                        </TableCell>

                                        <TableCell sx={getCellStyle(3)}>
                                            <Tooltip title={item.serviceProvider || ""} arrow>
                                                <span>{truncateText(item.serviceProvider, 20)}</span>
                                            </Tooltip>
                                        </TableCell>

                                        <TableCell sx={getCellStyle(4)}>
                                            <Tooltip title={item.oltOwner || ""} arrow>
                                                <span>{item.oltOwner || ""}</span>
                                            </Tooltip>
                                        </TableCell>

                                        <TableCell sx={getCellStyle(5)}>
                                            <Tooltip title={item.networkType || ""} arrow>
                                                <span>{item.networkType || ""}</span>
                                            </Tooltip>
                                        </TableCell>



                                        <TableCell align="center" sx={{ width: "8%", padding: "8px 4px" }}>
                                            <IconButton onClick={(e) => handleOpenMenu(e, item.id)}>
                                                <MoreVertIcon />
                                            </IconButton>
                                            <Menu
                                                anchorEl={anchorEl}
                                                open={openMenu && menuBpId === item.id}
                                                onClose={handleCloseMenu}
                                                onClick={handleCloseMenu}
                                            >
                                                <MenuItem onClick={() => handleView(item)}>
                                                    <VisibilityIcon fontSize="small" style={{ marginRight: 8, color: "#1976d2" }} /> View
                                                </MenuItem>
                                                {canAccess("bpDetails", "edit") && (
                                                    <MenuItem onClick={() => handleEdit(item)}>
                                                        <EditIcon fontSize="small" style={{ marginRight: 8, color: "#1976d2" }} /> Edit
                                                    </MenuItem>
                                                )}
                                                {canAccess("bpDetails", "edit") && (
                                                    <MenuItem onClick={() => handleDelete(item.id)}>
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

            {/* Pagination with Count */}
            <Box sx={{ marginTop: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography
                    variant="body2"
                    sx={{
                        color: "text.secondary",
                        fontWeight: "medium",
                        marginLeft: 1
                    }}
                >
                    Total Registered: {filteredData.length}
                </Typography>

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
            </Box>

            {/* Updated AddBpModal with enhanced file handling */}
            <AddBpModal
                showModal={showModal}
                setShowModal={setShowModal}
                selectedBP={selectedBp}
                onSaveBP={handleSaveBp} // Pass the enhanced save handler
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
                <DialogTitle>Are you sure you want to delete these BP details?</DialogTitle>
                <DialogActions>
                    <Button onClick={handleCancelDelete} color="primary">Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error">Delete</Button>
                </DialogActions>
            </Dialog>

            <ViewBpModal
                open={viewDialogOpen}
                onClose={() => setViewDialogOpen(false)}
                bpData={viewBp}
            />
        </div>
    );
};

export default BpDetails;