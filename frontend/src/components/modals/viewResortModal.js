import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, Typography } from "@mui/material";

const ViewResortDialog = ({ viewDialogOpen, setViewDialogOpen, viewResort }) => {
    const [shake, setShake] = useState(false);

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
                    width: "100%",
                    maxWidth: "92%",
                    minHeight: "auto",
                },
            }}
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

            <DialogTitle>Resort Details</DialogTitle>

            <DialogContent
                dividers
                sx={{
                    backgroundColor: "#f9f9f9",
                    p: 3,
                    overflow: "visible",
                }}
            >
                {viewResort && (
                    <Grid container spacing={4}>
                        {/* Column 1 */}
                        <Grid
                            item
                            xs={12}
                            md={4}
                            sx={{ display: "flex", flexDirection: "column", gap: 2, minWidth: "390px" }}
                        >
                            {["Resort Name", "Category", "Island", "Phone Number", "Email"].map((label, i) => (
                                <div key={i}>
                                    <Typography variant="subtitle2" color="textSecondary">{label}</Typography>
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            wordBreak: "break-word",
                                            whiteSpace: "normal",
                                            mt: 0.5,
                                        }}
                                    >
                                        {
                                            label === "Resort Name" ? viewResort.resort_name :
                                                label === "Category" ? viewResort.category :
                                                    label === "Island" ? viewResort.island :
                                                        label === "Phone Number" ? viewResort.phone_number :
                                                            viewResort.email
                                        }
                                    </Typography>
                                </div>
                            ))}
                        </Grid>

                        {/* Column 2 */}
                        <Grid
                            item
                            xs={12}
                            md={4}
                            sx={{ display: "flex", flexDirection: "column", gap: 2, minWidth: "370px" }}
                        >
                            {["IPTV Vendor", "Distribution Model", "TVRO Type", "TVRO Dish", "TV Points"].map((label, i) => (
                                <div key={i}>
                                    <Typography variant="subtitle2" color="textSecondary">{label}</Typography>
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            wordBreak: "break-word",
                                            whiteSpace: "normal",
                                            mt: 0.5,
                                        }}
                                    >
                                        {
                                            label === "IPTV Vendor" ? viewResort.iptv_vendor :
                                                label === "Distribution Model" ? viewResort.distribution_model :
                                                    label === "TVRO Type" ? viewResort.tvro_type :
                                                        label === "TVRO Dish" ? viewResort.tvro_dish :
                                                            viewResort.tv_points
                                        }
                                    </Typography>
                                    {label === "Distribution Model" && viewResort.distribution_model_timestamp && (
                                        <Typography variant="caption" color="textSecondary">
                                            Last updated: {new Date(viewResort.distribution_model_timestamp).toLocaleString()}
                                        </Typography>
                                    )}
                                </div>
                            ))}
                        </Grid>

                        {/* Column 3 */}
                        <Grid
                            item
                            xs={12}
                            md={4}
                            sx={{ display: "flex", flexDirection: "column", gap: 2, minWidth: "250px" }}
                        >
                            {["Horizontal Signal", "Vertical Signal", "Horizontal Link Margin", "Vertical Link Margin"].map((label, i) => (
                                <div key={i}>
                                    <Typography variant="subtitle2" color="textSecondary">{label}</Typography>
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            wordBreak: "break-word",
                                            whiteSpace: "normal",
                                            mt: 0.5,
                                        }}
                                    >
                                        {
                                            label === "Horizontal Signal" ? viewResort.horizontal_signal :
                                                label === "Vertical Signal" ? viewResort.vertical_signal :
                                                    label === "Horizontal Link Margin" ? viewResort.horizontal_link_margin :
                                                        viewResort.vertical_link_margin
                                        }
                                    </Typography>

                                    {label === "Horizontal Signal" && viewResort.horizontal_signal_timestamp && (
                                        <Typography variant="caption" color="textSecondary">
                                            Last updated: {new Date(viewResort.horizontal_signal_timestamp).toLocaleString()}
                                        </Typography>
                                    )}
                                    {label === "Vertical Signal" && viewResort.vertical_signal_timestamp && (
                                        <Typography variant="caption" color="textSecondary">
                                            Last updated: {new Date(viewResort.vertical_signal_timestamp).toLocaleString()}
                                        </Typography>
                                    )}
                                    {label === "Horizontal Link Margin" && viewResort.horizontal_link_margin_timestamp && (
                                        <Typography variant="caption" color="textSecondary">
                                            Last updated: {new Date(viewResort.horizontal_link_margin_timestamp).toLocaleString()}
                                        </Typography>
                                    )}
                                    {label === "Vertical Link Margin" && viewResort.vertical_link_margin_timestamp && (
                                        <Typography variant="caption" color="textSecondary">
                                            Last updated: {new Date(viewResort.vertical_link_margin_timestamp).toLocaleString()}
                                        </Typography>
                                    )}
                                </div>
                            ))}
                        </Grid>
                    </Grid>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={() => setViewDialogOpen(false)} color="primary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ViewResortDialog;