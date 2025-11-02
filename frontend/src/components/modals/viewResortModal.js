import React, { useState } from "react";
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
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    IconButton,
} from "@mui/material";
import {
    Business,
    Satellite,
    Tv,
    SignalCellularAlt,
    Description,
    PictureAsPdf,
    Image,
    People,
    AccessTime,
    SettingsEthernet,
    VpnKey,
} from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";

const ViewResortDialog = ({ viewDialogOpen, setViewDialogOpen, viewResort }) => {
    const [shake, setShake] = useState(false);

    const bufferToUrl = (bufferData, mimeType) => {
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

    const handleViewDocument = (bufferData, mimeType, documentType) => {
        const url = bufferToUrl(bufferData, mimeType);
        if (url) {
            window.open(url, "_blank", "noopener,noreferrer");
        } else {
            alert(`No ${documentType} available`);
        }
    };

    const renderDocumentLink = (bufferData, label, mimeType) => {
        const hasDocument = bufferData && bufferData.data;
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
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={
                            mimeType === "application/pdf" ? <PictureAsPdf /> : <Image />
                        }
                        onClick={() =>
                            handleViewDocument(bufferData, mimeType, label.toLowerCase())
                        }
                        sx={{
                            textTransform: "none",
                            justifyContent: "flex-start",
                            width: "100%",
                        }}
                    >
                        View {label}
                    </Button>
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

    return (
        <Dialog
            open={viewDialogOpen}
            onClose={(event, reason) => {
                if (reason === "backdropClick" || reason === "escapeKeyDown") {
                    setShake(true);
                    setTimeout(() => setShake(false), 500);
                    return;
                }
                setViewDialogOpen(false);
            }}
            PaperProps={{
                sx: {
                    animation: shake ? "shake 0.5s" : "none",
                    width: "95%",
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
                View Resort Details  - {viewResort?.resort_name || "N/A"}
                <IconButton
                    aria-label="close"
                    onClick={() => setViewDialogOpen(false)}
                    sx={{
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 3, backgroundColor: "#f9f9f9" }}>
                {viewResort && (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {/* === Row 1 === */}
                        <Grid container spacing={8} padding={3}>
                            {/* Resort Info */}
                            <Grid item xs={12} md={4} width={330}>
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
                                            Resort Information
                                        </Typography>
                                        <Box sx={{ display: "grid", gap: 5 }}>
                                            {/* Resort Name */}
                                            <TextField
                                                label="Resort Name"
                                                value={viewResort.resort_name || ""}
                                                fullWidth
                                                size="small"
                                                multiline
                                                minRows={3}
                                                maxRows={6}
                                                InputProps={{
                                                    sx: {
                                                        backgroundColor: "white",
                                                        borderRadius: 1,
                                                        alignItems: "flex-start",
                                                    },
                                                }}
                                                sx={{
                                                    '& .MuiInputBase-input': {
                                                        whiteSpace: 'pre-wrap',
                                                        wordBreak: 'break-word',
                                                    },
                                                }}
                                            />

                                            {/* Category */}
                                            <FormControl fullWidth size="small">
                                                <InputLabel>Category</InputLabel>
                                                <Select
                                                    value={viewResort.category || "medinaet" || "ooredoo" || "piracy"}
                                                    label="Category"
                                                    sx={{
                                                        backgroundColor: "white",
                                                        borderRadius: 1,
                                                    }}
                                                >
                                                    <MenuItem value="Medianet">Medianet</MenuItem>
                                                    <MenuItem value="Ooredoo">Ooredoo</MenuItem>
                                                    <MenuItem value="piracy">Piracy</MenuItem>
                                                </Select>
                                            </FormControl>

                                            {/* Island */}
                                            <TextField
                                                label="Atoll"
                                                value={viewResort.island || ""}
                                                fullWidth
                                                size="small"
                                                InputProps={{
                                                    sx: {
                                                        backgroundColor: "white",
                                                        borderRadius: 1,
                                                    }
                                                }}
                                            />

                                            {/* IPTV Vendor */}
                                            <TextField
                                                label="IPTV/Analog"
                                                value={viewResort.iptv_vendor || ""}
                                                fullWidth
                                                size="small"
                                                InputProps={{
                                                    sx: {
                                                        backgroundColor: "white",
                                                        borderRadius: 1,
                                                    }
                                                }}
                                            />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                            {/* TV Points & Distribution */}
                            <Grid item xs={12} md={6} width={290} height={420}>
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
                                            <Tv />
                                            TV Points & Distribution
                                        </Typography>
                                        <Box sx={{ display: "grid", gap: 4 }}>
                                            <TextField
                                                label="Staff Area TV"
                                                value={viewResort.staff_area_tv || ""}
                                                fullWidth
                                                size="small"
                                                InputProps={{
                                                    sx: {
                                                        backgroundColor: "white",
                                                        borderRadius: 1,
                                                    }
                                                }}
                                            />
                                            <TextField
                                                label="Guest Area TV"
                                                value={viewResort.guest_area_tv || ""}
                                                fullWidth
                                                size="small"
                                                InputProps={{
                                                    sx: {
                                                        backgroundColor: "white",
                                                        borderRadius: 1,
                                                    }
                                                }}
                                            />
                                            <Box>
                                                <Typography variant="subtitle2" color="textSecondary">
                                                    Total TV Points
                                                </Typography>
                                                <Typography
                                                    variant="body1"
                                                    sx={{ fontWeight: "bold", color: "primary.main" }}
                                                >
                                                    {(parseInt(viewResort.staff_area_tv) || 0) +
                                                        (parseInt(viewResort.guest_area_tv) || 0)}
                                                </Typography>
                                            </Box>
                                            <TextField
                                                label="Distribution Model"
                                                value={viewResort.distribution_model || ""}
                                                fullWidth
                                                size="small"
                                                InputProps={{
                                                    sx: {
                                                        backgroundColor: "white",
                                                        borderRadius: 1,
                                                    }
                                                }}
                                            />

                                            {/* Streamer Type - Only show if distribution model is medianet_streamer */}
                                            {viewResort.distribution_model === "medianet_streamer" && viewResort.streamer_types && (
                                                <TextField
                                                    label="Streamer Type"
                                                    value={viewResort.streamer_types || ""}
                                                    fullWidth
                                                    size="small"
                                                    InputProps={{
                                                        sx: {
                                                            backgroundColor: "white",
                                                            borderRadius: 1,
                                                        }
                                                    }}
                                                />
                                            )}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* IP Information */}
                            <Grid item xs={12} md={4} width={300}>
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
                                            IP Information
                                        </Typography>
                                        <Box sx={{ display: "grid", gap: 5 }}>
                                            <TextField
                                                label="Transmodelator IP"
                                                value={viewResort.transmodelator_ip || ""}
                                                fullWidth
                                                size="small"
                                                InputProps={{
                                                    sx: {
                                                        backgroundColor: "white",
                                                        borderRadius: 1,
                                                    }
                                                }}
                                            />
                                            <TextField
                                                label="Middleware IP"
                                                value={viewResort.middleware_ip || ""}
                                                fullWidth
                                                size="small"
                                                InputProps={{
                                                    sx: {
                                                        backgroundColor: "white",
                                                        borderRadius: 1,
                                                    }
                                                }}
                                            />
                                            <TextField
                                                label="Username"
                                                value={viewResort.username || ""}
                                                fullWidth
                                                size="small"
                                                InputProps={{
                                                    sx: {
                                                        backgroundColor: "white",
                                                        borderRadius: 1,
                                                    }
                                                }}
                                            />
                                            <TextField
                                                label="Password"
                                                value={viewResort.password || ""}
                                                fullWidth
                                                size="small"
                                                type="password"
                                                InputProps={{
                                                    sx: {
                                                        backgroundColor: "white",
                                                        borderRadius: 1,
                                                    }
                                                }}
                                            />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>




                        </Grid>

                        {/* === Row 2 === */}
                        <Grid container spacing={8} p={3}>
                            {/* TVRO Info */}
                            <Grid item xs={12} md={4} width={330}>
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
                                            <Satellite />
                                            TVRO Information
                                        </Typography>
                                        <Box sx={{ display: "grid", gap: 5 }}>
                                            <TextField
                                                label="TVRO Type"
                                                value={viewResort.tvro_type || ""}
                                                fullWidth
                                                size="small"
                                                InputProps={{
                                                    sx: {
                                                        backgroundColor: "white",
                                                        borderRadius: 1,
                                                    }
                                                }}
                                            />
                                            <TextField
                                                label="Dish Type"
                                                value={viewResort.dish_type || ""}
                                                fullWidth
                                                size="small"
                                                InputProps={{
                                                    sx: {
                                                        backgroundColor: "white",
                                                        borderRadius: 1,
                                                    }
                                                }}
                                            />
                                            <TextField
                                                label="Dish Brand"
                                                value={viewResort.dish_brand || ""}
                                                fullWidth
                                                size="small"
                                                InputProps={{
                                                    sx: {
                                                        backgroundColor: "white",
                                                        borderRadius: 1,
                                                    }
                                                }}
                                            />
                                            <TextField
                                                label=" Dish Antenna Size"
                                                value={viewResort.tvro_dish || ""}
                                                fullWidth
                                                size="small"
                                                InputProps={{
                                                    sx: {
                                                        backgroundColor: "white",
                                                        borderRadius: 1,
                                                    }
                                                }}
                                            />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Signal Levels */}
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
                                            <SignalCellularAlt />
                                            Signal Levels
                                        </Typography>
                                        <Box sx={{ display: "grid", gap: 2 }}>
                                            {[
                                                {
                                                    label: "Horizontal Signal",
                                                    value: viewResort.horizontal_signal,
                                                    field: "horizontal_signal"
                                                },
                                                {
                                                    label: "Vertical Signal",
                                                    value: viewResort.vertical_signal,
                                                    field: "vertical_signal"
                                                },
                                                {
                                                    label: "Horizontal Link Margin",
                                                    value: viewResort.horizontal_link_margin,
                                                    field: "horizontal_link_margin"
                                                },
                                                {
                                                    label: "Vertical Link Margin",
                                                    value: viewResort.vertical_link_margin,
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
                            {/* Timestamp & Documents */}
                            <Grid item xs={12} md={4} width={300}>
                                <Card sx={{ mb: 5 }}>
                                    <CardContent>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                mb: 4,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                                color: "primary.main",
                                            }}
                                        >
                                            <AccessTime />
                                            Last Updated
                                        </Typography>
                                        <Box sx={{ display: "grid", gap: 4 }}>
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
                                                    {viewResort.updated_at
                                                        ? new Date(viewResort.updated_at).toLocaleString()
                                                        : "N/A"}
                                                </Typography>
                                            </Box>
                                            {viewResort.signal_level_timestamp && (
                                                <Box
                                                    sx={{
                                                        p: 1.5,
                                                        border: "1px solid #e0e0e0",
                                                        borderRadius: 1,
                                                        backgroundColor: "#fafafa",
                                                    }}
                                                >
                                                    <Typography variant="subtitle2" color="textSecondary">
                                                        Signal Levels Updated
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{ fontWeight: "medium" }}
                                                    >
                                                        {new Date(
                                                            viewResort.signal_level_timestamp
                                                        ).toLocaleString()}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </CardContent>
                                </Card>


                            </Grid>

                        </Grid>

                        {/* === Row 3 === */}
                        <Grid container spacing={8} p={3} >
                            {/* Documents */}
                            <Grid item xs={12} md={4} width={330}>
                                <Card>
                                    <CardContent>
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                mb: 2,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 3,
                                                color: "primary.main",
                                            }}
                                        >
                                            <Description />
                                            Documents & Images
                                        </Typography>
                                        <Grid container spacing={5} >
                                            <Grid item xs={12} >
                                                {renderDocumentLink(
                                                    viewResort.dish_antena_image,
                                                    "Dish Antenna Image",
                                                    "image/jpeg"
                                                )}
                                                {renderDocumentLink(
                                                    viewResort.survey_form,
                                                    "Survey Form",
                                                    "application/pdf"
                                                )}
                                                {renderDocumentLink(
                                                    viewResort.service_acceptance_form,
                                                    "Service Acceptance",
                                                    "application/pdf"
                                                )}
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Contact Info */}
                            <Grid item xs={12} md={8} width={650}>
                                <Card sx={{ height: "100%", width: '100%' }}>
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
                                            Resort Contacts
                                        </Typography>
                                        {viewResort.contact_details &&
                                            viewResort.contact_details.length > 0 ? (
                                            <TableContainer sx={{ maxHeight: 260 }}>
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                                                            <TableCell sx={{ fontWeight: "bold" }}>
                                                                Name
                                                            </TableCell>
                                                            <TableCell sx={{ fontWeight: "bold" }}>
                                                                Designation
                                                            </TableCell>
                                                            <TableCell sx={{ fontWeight: "bold" }}>
                                                                Email
                                                            </TableCell>
                                                            <TableCell sx={{ fontWeight: "bold" }}>
                                                                Phone
                                                            </TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {viewResort.contact_details.map(
                                                            (contact, index) => (
                                                                <TableRow key={index} hover>
                                                                    <TableCell
                                                                        sx={{
                                                                            wordWrap: "break-word",
                                                                            whiteSpace: "normal",
                                                                            maxWidth: "120px",
                                                                        }}
                                                                    >
                                                                        {contact.name}
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
                                                                        {contact.email}
                                                                    </TableCell>
                                                                    <TableCell
                                                                        sx={{
                                                                            wordWrap: "break-word",
                                                                            whiteSpace: "normal",
                                                                            maxWidth: "100px",
                                                                        }}
                                                                    >
                                                                        {contact.phone}
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
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button
                    onClick={() => setViewDialogOpen(false)}
                    color="primary"
                    variant="outlined"
                    sx={{ minWidth: '100px' }}
                >
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ViewResortDialog;