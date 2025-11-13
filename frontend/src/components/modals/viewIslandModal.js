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
    Card,
    CardContent,
    TextField,
    IconButton,
    Chip,
} from "@mui/material";
import {
    Tv,
    BusinessCenter,
    Person,
    Close as CloseIcon,
} from "@mui/icons-material";

const ViewIslandDialog = ({ viewDialogOpen, setViewDialogOpen, viewIsland }) => {
    const [shake, setShake] = useState(false);

    // Format timestamp with Indian/Maldives timezone - alternative robust version
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'N/A';
        try {
            const date = new Date(timestamp);

            // Use Intl.DateTimeFormat for more reliable timezone conversion
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: 'Indian/Maldives',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });

            return formatter.format(date);
        } catch (error) {
            console.error('Error formatting timestamp:', error);
            return 'Invalid Date';
        }
    };

    // Format register names display
    const formatRegisterNames = (registerNames) => {
        if (!registerNames || registerNames.length === 0) {
            return [
                <Typography
                    key="none"
                    variant="body2"
                    color="textSecondary"
                    sx={{ fontStyle: 'italic' }}
                >
                    No registrations
                </Typography>
            ];
        }

        return registerNames.map((name, index) => (
            <Chip
                key={index}
                label={name}
                variant="outlined"
                size="small"
                sx={{ m: 0.5 }}
            />
        ));
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
                    maxWidth: "1000px",
                    minHeight: "auto",
                    borderRadius: 2,
                    maxHeight: "90vh",
                },
            }}
            maxWidth="lg"
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
                View - {viewIsland?.island_name || "N/A"} Island Details
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
                {viewIsland && (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        {/* === Row 1: Basic Information - Full Width === */}
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Card>
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
                                            Basic Information
                                        </Typography>
                                        <Grid container spacing={3}>
                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    label="Island Name"
                                                    value={viewIsland.island_name || ""}
                                                    fullWidth
                                                    size="small"
                                                    InputProps={{
                                                        readOnly: true,
                                                        sx: {
                                                            backgroundColor: "white",
                                                            borderRadius: 1,
                                                        }
                                                    }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    label="Atoll"
                                                    value={viewIsland.atoll || ""}
                                                    fullWidth
                                                    size="small"
                                                    InputProps={{
                                                        readOnly: true,
                                                        sx: {
                                                            backgroundColor: "white",
                                                            borderRadius: 1,
                                                        }
                                                    }}
                                                />
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* === Row 2: Register Names - Full Width === */}
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Card>
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
                                            <Person />
                                            Register Names
                                        </Typography>
                                        <Box sx={{
                                            p: 2,
                                            border: "1px solid #e0e0e0",
                                            borderRadius: 1,
                                            backgroundColor: "#fafafa",
                                            minHeight: '60px'
                                        }}>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                {formatRegisterNames(viewIsland.register_names)}
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* === Row 3: DTV Market & Corporate Market - Side by Side === */}
                        <Grid container spacing={3}>
                            {/* DTV Market */}
                            <Grid item xs={12} md={6}>
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
                                            DTV Market
                                        </Typography>
                                        <Box sx={{ display: "grid", gap: 2 }}>
                                            <TextField
                                                label="Total DTV Markets"
                                                value={viewIsland.total_dtv_markets || ""}
                                                fullWidth
                                                size="small"
                                                InputProps={{
                                                    readOnly: true,
                                                    sx: {
                                                        backgroundColor: "white",
                                                        borderRadius: 1,
                                                    }
                                                }}
                                            />
                                            <TextField
                                                label="Active DTV Markets"
                                                value={viewIsland.active_dtv_markets || ""}
                                                fullWidth
                                                size="small"
                                                InputProps={{
                                                    readOnly: true,
                                                    sx: {
                                                        backgroundColor: "white",
                                                        borderRadius: 1,
                                                    }
                                                }}
                                            />
                                            {viewIsland.active_dtv_update_time && (
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
                                                        {formatTimestamp(viewIsland.active_dtv_update_time)}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Corporate Market */}
                            <Grid item xs={12} md={6}>
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
                                            <BusinessCenter />
                                            Corporate Market
                                        </Typography>
                                        <Box sx={{ display: "grid", gap: 2 }}>
                                            <TextField
                                                label="Total Corporate Markets"
                                                value={viewIsland.total_corporate_markets || ""}
                                                fullWidth
                                                size="small"
                                                InputProps={{
                                                    readOnly: true,
                                                    sx: {
                                                        backgroundColor: "white",
                                                        borderRadius: 1,
                                                    }
                                                }}
                                            />
                                            <TextField
                                                label="Active Corporate Markets"
                                                value={viewIsland.active_corporate_markets || ""}
                                                fullWidth
                                                size="small"
                                                InputProps={{
                                                    readOnly: true,
                                                    sx: {
                                                        backgroundColor: "white",
                                                        borderRadius: 1,
                                                    }
                                                }}
                                            />
                                            {viewIsland.active_corporate_update_time && (
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
                                                        {formatTimestamp(viewIsland.active_corporate_update_time)}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
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
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ViewIslandDialog;