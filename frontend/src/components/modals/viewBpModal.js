import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Card,
    CardContent,
    TextField,
    IconButton,
} from "@mui/material";
import {
    Business,
    Description,
    People,
    AccessTime,
    SettingsEthernet,
    Download,
    Visibility,
    SatelliteAlt,
    SignalCellularAlt,
} from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";

const ViewBpModal = ({ open, onClose, bpData }) => {
    const [shake, setShake] = useState(false);
    const [islands, setIslands] = useState([]);
    const [islandName, setIslandName] = useState("");

    // Fetch islands data
    useEffect(() => {
        const fetchIslands = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_LOCALHOST}/statistics/getIslandInformations`);
                if (response.ok) {
                    const data = await response.json();
                    setIslands(data);
                }
            } catch (error) {
                console.error("Error fetching islands:", error);
            }
        };

        if (open) {
            fetchIslands();
        }
    }, [open]);

    // Set island name for display
    useEffect(() => {
        if (bpData?.island_id && islands.length > 0) {
            const island = islands.find(item => item.island_id === bpData.island_id);
            if (island) {
                setIslandName(island.island_name);
            }
        } else if (bpData?.island_name) {
            setIslandName(bpData.island_name);
        } else {
            setIslandName("");
        }
    }, [bpData?.island_id, bpData?.island_name, islands]);

    // Format date to local string
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";

        try {
            const date = new Date(dateString);

            // Check if date is valid
            if (isNaN(date.getTime())) {
                return "Invalid Date";
            }

            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });
        } catch (error) {
            console.error("Error formatting date:", error);
            return "Invalid Date";
        }
    };

    // Enhanced buffer to URL conversion
    const bufferToUrl = (bufferData, mimeType) => {
        if (!bufferData) return null;

        try {
            let byteArray;

            // Handle different buffer data formats
            if (bufferData.data && Array.isArray(bufferData.data)) {
                // Case 1: Standard buffer with data array
                byteArray = new Uint8Array(bufferData.data);
            } else if (bufferData instanceof ArrayBuffer) {
                // Case 2: Direct ArrayBuffer
                byteArray = new Uint8Array(bufferData);
            } else if (Array.isArray(bufferData)) {
                // Case 3: Direct array of bytes
                byteArray = new Uint8Array(bufferData);
            } else if (typeof bufferData === 'string') {
                // Case 4: Base64 string
                const binaryString = atob(bufferData);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                byteArray = bytes;
            } else if (bufferData.buffer) {
                // Case 5: TypedArray with buffer property
                byteArray = new Uint8Array(bufferData.buffer);
            } else {
                console.error("Unsupported buffer data format:", bufferData);
                return null;
            }

            const blob = new Blob([byteArray], { type: mimeType });
            return URL.createObjectURL(blob);
        } catch (error) {
            console.error("Error converting buffer to URL:", error);
            return null;
        }
    };

    const handleViewDocument = (bufferData, mimeType, documentType, filename = "document") => {
        const url = bufferToUrl(bufferData, mimeType);
        if (url) {
            // For viewing in new tab
            const newWindow = window.open(url, "_blank", "noopener,noreferrer");
            if (!newWindow) {
                alert("Popup blocked! Please allow popups for this site to view documents.");
            }
        } else {
            alert(`No ${documentType} available or document format not supported`);
        }
    };

    const handleDownloadDocument = (bufferData, mimeType, filename = "document") => {
        const url = bufferToUrl(bufferData, mimeType);
        if (url) {
            const link = document.createElement('a');
            link.href = url;

            // Extract proper file extension from mimetype
            let extension = '.bin';
            if (mimeType === 'text/csv') extension = '.csv';
            else if (mimeType === 'application/pdf') extension = '.pdf';
            else if (mimeType.includes('image')) extension = '.' + mimeType.split('/')[1];
            else if (mimeType.includes('document')) extension = '.doc';

            link.download = `${filename}${extension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up URL object
            setTimeout(() => URL.revokeObjectURL(url), 100);
        } else {
            alert("Download failed: Document not available or format not supported");
        }
    };

    // Check if document exists and get its type
    const getDocumentInfo = (bufferData, defaultMimeType) => {
        const hasDocument = bufferData &&
            (bufferData.data ||
                bufferData instanceof ArrayBuffer ||
                Array.isArray(bufferData) ||
                typeof bufferData === 'string');

        let mimeType = defaultMimeType;
        let fileType = 'Unknown';

        if (hasDocument && bufferData.mimetype) {
            mimeType = bufferData.mimetype;
        }

        // Determine file type for display
        if (mimeType === 'text/csv') {
            fileType = 'CSV';
        } else if (mimeType === 'application/pdf') {
            fileType = 'PDF';
        } else if (mimeType.includes('image')) {
            fileType = 'Image';
        } else if (mimeType.includes('document')) {
            fileType = 'Document';
        }

        return { hasDocument, mimeType, fileType };
    };

    const renderDocumentLink = (bufferData, label, defaultMimeType, filename) => {
        const { hasDocument, mimeType, fileType } = getDocumentInfo(bufferData, defaultMimeType);

        return (
            <Box
                sx={{
                    mb: 1,
                    p: 1,
                    border: "1px solid #e0e0e0",
                    borderRadius: 1,
                    backgroundColor: "#fafafa",
                }}
            >
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    {label}
                </Typography>
                {hasDocument ? (
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Visibility />}
                            onClick={() => handleViewDocument(bufferData, mimeType, label.toLowerCase(), filename)}
                            sx={{
                                textTransform: "none",
                                justifyContent: "flex-start",
                            }}
                        >
                            View
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Download />}
                            onClick={() => handleDownloadDocument(bufferData, mimeType, filename)}
                            sx={{
                                textTransform: "none",
                                justifyContent: "flex-start",
                            }}
                        >
                            Download
                        </Button>
                    </Box>
                ) : (
                    <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{ fontStyle: "italic" }}
                    >
                        No document uploaded
                    </Typography>
                )}
            </Box>
        );
    };

    // Function to parse contact information
    const parseContactInformation = (contactInfo) => {
        if (!contactInfo) return [];

        // If it's already an array, return it directly
        if (Array.isArray(contactInfo)) {
            return contactInfo;
        }

        // If it's a string, try to parse it as JSON
        if (typeof contactInfo === 'string') {
            try {
                // Clean the string if needed
                let cleanString = contactInfo.trim();

                // Remove surrounding quotes if present
                if (cleanString.startsWith('"') && cleanString.endsWith('"')) {
                    cleanString = cleanString.slice(1, -1);
                }

                // Replace escaped quotes
                cleanString = cleanString.replace(/\\"/g, '"');
                const parsed = JSON.parse(cleanString);

                if (Array.isArray(parsed)) {
                    return parsed;
                }
            } catch (error) {
                console.error("Error parsing contact information as JSON:", error);

                // Fallback: Try to parse without cleaning
                try {
                    const parsed = JSON.parse(contactInfo);
                    if (Array.isArray(parsed)) {
                        return parsed;
                    }
                } catch (fallbackError) {
                    console.error("Fallback parsing also failed:", fallbackError);
                }
            }
        }

        // If all parsing fails, return empty array
        console.warn("Could not parse contact information, returning empty array");
        return [];
    };

    return (
        <Dialog
            open={open}
            onClose={(event, reason) => {
                if (reason === "backdropClick" || reason === "escapeKeyDown") {
                    setShake(true);
                    setTimeout(() => setShake(false), 500);
                    return;
                }
                onClose();
            }}
            PaperProps={{
                sx: {
                    animation: shake ? "shake 0.5s" : "none",
                    width: "85%",
                    maxWidth: "1200px",
                    minHeight: "auto",
                    borderRadius: 2,
                    maxHeight: "90vh",
                },
            }}
            maxWidth="xl"
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

            <DialogTitle
                sx={{
                    backgroundColor: "white",
                    color: "black",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    py: 2,
                }}
            >
                View BP Details - {bpData?.registerName || bpData?.register_name || "N/A"}
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 5, backgroundColor: "#f9f9f9" }}>
                {bpData && (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {/* === Row 1: BP Information, TVRO Information, Network Information === */}
                        <Grid container spacing={8} padding={2}>
                            {/* BP Information */}
                            <Grid item xs={12} md={4} width={270}>
                                <Card sx={{ height: "100%" }}>
                                    <CardContent>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                mb: 2,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                                color: "primary.main",
                                            }}
                                        >
                                            <Business />
                                            BP Information
                                        </Typography>
                                        <Box sx={{ display: "grid", gap: 5 }}>
                                            <TextField
                                                label="Register Name"
                                                value={bpData.registerName || bpData.register_name || ""}
                                                fullWidth
                                                size="small"
                                                InputProps={{
                                                    sx: { backgroundColor: "white", borderRadius: 1 },
                                                    readOnly: true,
                                                }}
                                            />
                                            <TextField
                                                label="Register Number"
                                                value={bpData.registerNumber || bpData.register_number || ""}
                                                fullWidth
                                                size="small"
                                                InputProps={{
                                                    sx: { backgroundColor: "white", borderRadius: 1 },
                                                    readOnly: true,
                                                }}
                                            />
                                            <TextField
                                                label="Service Provider"
                                                value={bpData.serviceProvider || bpData.service_provider || ""}
                                                fullWidth
                                                size="small"
                                                InputProps={{
                                                    sx: { backgroundColor: "white", borderRadius: 1 },
                                                    readOnly: true,
                                                }}
                                            />
                                            <TextField
                                                label="OLT Owner"
                                                value={bpData.oltOwner || bpData.olt_owner || ""}
                                                fullWidth
                                                size="small"
                                                InputProps={{
                                                    sx: { backgroundColor: "white", borderRadius: 1 },
                                                    readOnly: true,
                                                }}
                                            />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* TVRO Information */}
                            <Grid item xs={12} md={4} width={270}>
                                <Card sx={{ height: "100%" }}>
                                    <CardContent>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                mb: 2,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                                color: "primary.main",
                                            }}
                                        >
                                            <SatelliteAlt />
                                            TVRO Information
                                        </Typography>
                                        <Box sx={{ display: "grid", gap: 5 }}>
                                            <TextField
                                                label="TVRO Type"
                                                value={bpData.tvro_type || ""}
                                                fullWidth
                                                size="small"
                                                InputProps={{
                                                    sx: { backgroundColor: "white", borderRadius: 1 },
                                                    readOnly: true,
                                                }}
                                            />
                                            <TextField
                                                label="Dish Type"
                                                value={bpData.dish_type || ""}
                                                fullWidth
                                                size="small"
                                                InputProps={{
                                                    sx: { backgroundColor: "white", borderRadius: 1 },
                                                    readOnly: true,
                                                }}
                                            />
                                            <TextField
                                                label="Dish Brand"
                                                value={bpData.dish_brand || ""}
                                                fullWidth
                                                size="small"
                                                InputProps={{
                                                    sx: { backgroundColor: "white", borderRadius: 1 },
                                                    readOnly: true,
                                                }}
                                            />
                                            <TextField
                                                label="Dish Antenna Size"
                                                value={bpData.dish_antena_size || ""}
                                                fullWidth
                                                size="small"
                                                InputProps={{
                                                    sx: { backgroundColor: "white", borderRadius: 1 },
                                                    readOnly: true,
                                                }}
                                            />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Network Information */}
                            <Grid item xs={12} md={4} width={270}>
                                <Card sx={{ height: "100%" }}>
                                    <CardContent>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                mb: 2,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                                color: "primary.main",
                                            }}
                                        >
                                            <SettingsEthernet />
                                            Network Information
                                        </Typography>
                                        <Box sx={{ display: "grid", gap: 5 }}>
                                            <TextField
                                                label="Network Type"
                                                value={bpData.networkType || bpData.network_type || ""}
                                                fullWidth
                                                size="small"
                                                InputProps={{
                                                    sx: { backgroundColor: "white", borderRadius: 1 },
                                                    readOnly: true,
                                                }}
                                            />
                                            <TextField
                                                label="Fiber Coax Convertor"
                                                value={bpData.convertor || bpData.fiber_coax_convertor || ""}
                                                fullWidth
                                                size="small"
                                                InputProps={{
                                                    sx: { backgroundColor: "white", borderRadius: 1 },
                                                    readOnly: true,
                                                }}
                                            />
                                            <TextField
                                                label="Island Name"
                                                value={islandName || ""}
                                                fullWidth
                                                size="small"
                                                InputProps={{
                                                    sx: { backgroundColor: "white", borderRadius: 1 },
                                                    readOnly: true,
                                                }}
                                            />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* === Row 2: BP Contacts and Timestamp Information === */}
                        <Grid container spacing={8} padding={2}>
                            {/* BP Contacts */}
                            <Grid item xs={12} md={8} width={610}>
                                <Card sx={{ height: "100%" }}>
                                    <CardContent>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                mb: 2,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                                color: "primary.main",
                                            }}
                                        >
                                            <People />
                                            BP Contacts
                                        </Typography>
                                        {(() => {
                                            const contactData = parseContactInformation(
                                                bpData.contactInformation || bpData.contact_information
                                            );

                                            return contactData && contactData.length > 0 ? (
                                                <TableContainer sx={{ maxHeight: 260 }}>
                                                    <Table size="small">
                                                        <TableHead>
                                                            <TableRow sx={{ backgroundColor: "#1976d2" }}>
                                                                <TableCell sx={{
                                                                    fontWeight: "bold",
                                                                    color: "white",
                                                                    fontSize: "0.875rem"
                                                                }}>
                                                                    Name
                                                                </TableCell>
                                                                <TableCell sx={{
                                                                    fontWeight: "bold",
                                                                    color: "white",
                                                                    fontSize: "0.875rem"
                                                                }}>
                                                                    Designation
                                                                </TableCell>
                                                                <TableCell sx={{
                                                                    fontWeight: "bold",
                                                                    color: "white",
                                                                    fontSize: "0.875rem"
                                                                }}>
                                                                    Email
                                                                </TableCell>
                                                                <TableCell sx={{
                                                                    fontWeight: "bold",
                                                                    color: "white",
                                                                    fontSize: "0.875rem"
                                                                }}>
                                                                    Phone
                                                                </TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {contactData.map(
                                                                (contact, index) => (
                                                                    <TableRow key={index} hover>
                                                                        <TableCell
                                                                            sx={{
                                                                                wordWrap: "break-word",
                                                                                whiteSpace: "normal",
                                                                                maxWidth: "120px",
                                                                            }}
                                                                        >
                                                                            {contact.name || "N/A"}
                                                                        </TableCell>
                                                                        <TableCell
                                                                            sx={{
                                                                                wordWrap: "break-word",
                                                                                whiteSpace: "normal",
                                                                                maxWidth: "120px",
                                                                            }}
                                                                        >
                                                                            {contact.designation || "N/A"}
                                                                        </TableCell>
                                                                        <TableCell
                                                                            sx={{
                                                                                wordWrap: "break-word",
                                                                                whiteSpace: "normal",
                                                                                maxWidth: "150px",
                                                                            }}
                                                                        >
                                                                            {contact.email || "N/A"}
                                                                        </TableCell>
                                                                        <TableCell
                                                                            sx={{
                                                                                wordWrap: "break-word",
                                                                                whiteSpace: "normal",
                                                                                maxWidth: "100px",
                                                                            }}
                                                                        >
                                                                            {contact.phone || "N/A"}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            ) : (
                                                <Typography
                                                    variant="body2"
                                                    color="textSecondary"
                                                    sx={{ fontStyle: "italic" }}
                                                >
                                                    No contact details available
                                                </Typography>
                                            );
                                        })()}
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Timestamp Information */}
                            <Grid item xs={12} md={4}>
                                <Card sx={{ height: "100%" }}>
                                    <CardContent>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                mb: 2,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                                color: "primary.main",
                                            }}
                                        >
                                            <AccessTime />
                                            Timestamp Information
                                        </Typography>
                                        <Box sx={{ display: "grid", gap: 5 }}>

                                            {bpData.signal_level_update_time && (
                                                <Box
                                                    sx={{
                                                        p: 1.5,
                                                        border: "1px solid #e0e0e0",
                                                        borderRadius: 1,
                                                        backgroundColor: "#fafafa",
                                                    }}
                                                >
                                                    <Typography variant="subtitle2" color="textSecondary">
                                                        Signal Level Last Updated
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                                                        {formatDate(bpData.signal_level_update_time)}
                                                    </Typography>
                                                </Box>
                                            )}
                                            <Box
                                                sx={{
                                                    p: 1.5,
                                                    border: "1px solid #e0e0e0",
                                                    borderRadius: 1,
                                                    backgroundColor: "#fafafa",
                                                }}
                                            >
                                                <Typography variant="subtitle2" color="textSecondary">
                                                    Last Updated
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                                                    {formatDate(bpData.updatedAt || bpData.updated_at)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* === Row 3: Signal Levels and Documents === */}
                        <Grid container spacing={6} padding={2}>
                            {/* Signal Levels */}
                            <Grid item xs={12} md={6} width={290}>
                                <Card sx={{ height: "100%" }}>
                                    <CardContent>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                mb: 2,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                                color: "primary.main",
                                            }}
                                        >
                                            <SignalCellularAlt />
                                            Signal Levels
                                        </Typography>
                                        <Box sx={{ display: "grid", gap: 3 }}>
                                            {[
                                                {
                                                    label: "Horizontal Signal",
                                                    value: bpData.horizontal_signal,
                                                    field: "horizontal_signal"
                                                },
                                                {
                                                    label: "Vertical Signal",
                                                    value: bpData.vertical_signal,
                                                    field: "vertical_signal"
                                                },
                                                {
                                                    label: "Horizontal Link Margin",
                                                    value: bpData.horizontal_link_margin,
                                                    field: "horizontal_link_margin"
                                                },
                                                {
                                                    label: "Vertical Link Margin",
                                                    value: bpData.vertical_link_margin,
                                                    field: "vertical_link_margin"
                                                },
                                            ].map((item, index) => (
                                                <Box
                                                    key={index}
                                                    sx={{
                                                        p: 1.5,
                                                        border: "1px solid #e0e0e0",
                                                        borderRadius: 1,
                                                        backgroundColor: "#fafafa",
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <Typography
                                                        variant="subtitle2"
                                                        color="textSecondary"
                                                        sx={{
                                                            wordWrap: "break-word",
                                                            whiteSpace: "normal",
                                                            flex: 1,
                                                        }}
                                                    >
                                                        {item.label}
                                                    </Typography>
                                                    <TextField
                                                        value={item.value || ""}
                                                        size="small"
                                                        sx={{
                                                            width: "80px",
                                                            ml: 1,
                                                            '& .MuiInputBase-root': {
                                                                backgroundColor: "white",
                                                                borderRadius: 1,
                                                            }
                                                        }}
                                                        inputProps={{
                                                            style: {
                                                                textAlign: 'right',
                                                                fontWeight: 'bold',
                                                                color: item.value ? "primary.main" : "text.secondary"
                                                            }
                                                        }}
                                                    />
                                                </Box>
                                            ))}

                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Documents */}
                            <Grid item xs={12} md={6} gap={5} width={270}>
                                <Card sx={{ height: "100%", gap: 5, }}>
                                    <CardContent>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                mb: 2,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                                color: "primary.main",
                                            }}
                                        >
                                            <Description />
                                            Documents
                                        </Typography>
                                        <Grid container spacing={2} >
                                            <Grid item xs={12} gap={5}>
                                                {renderDocumentLink(
                                                    bpData.island_attach,
                                                    "Island Attach CSV",
                                                    bpData.island_attach_mimetype || "text/csv",
                                                    "island_attach"
                                                )}
                                                {renderDocumentLink(
                                                    bpData.survey_form,
                                                    "Survey Form",
                                                    bpData.survey_form_mimetype || "application/pdf",
                                                    "survey_form"
                                                )}
                                                {renderDocumentLink(
                                                    bpData.network_diagram,
                                                    "Network Diagram",
                                                    bpData.network_diagram_mimetype || "application/pdf",
                                                    "network_diagram"
                                                )}
                                                {renderDocumentLink(
                                                    bpData.dish_antena_image,
                                                    "Dish Antenna Image",
                                                    bpData.dish_antena_image_mimetype || "image/jpeg",
                                                    "dish_antenna_image"
                                                )}
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button
                    onClick={onClose}
                    color="primary"
                    variant="outlined"
                    sx={{ minWidth: '100px' }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ViewBpModal;