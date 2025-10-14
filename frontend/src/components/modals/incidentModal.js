import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormLabel,
    TextField,
    RadioGroup,
    FormControlLabel,
    Radio,
    Stack,
    Chip,
    Autocomplete,
    Tooltip,
    IconButton
} from "@mui/material";
import dayjs from "dayjs";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import CloseIcon from "@mui/icons-material/Close";
import { showToast } from "../common/toaster";


const IncidentModal = ({ open, onClose, onSave, incidentData, dialogWidth }) => {
    const [resorts, setResorts] = useState([]);
    const [resortName, setResortName] = useState("");
    const [category, setCategory] = useState("Medianet");
    const [notes, setIncident] = useState("");
    const [status, setStatus] = useState("New");
    const [date, setDate] = useState(dayjs());
    const [isFormDirty, setIsFormDirty] = useState(false); // track changes

    // Fetch resorts on mount
    useEffect(() => {
        fetch("http://localhost:5000/statistics/getAllResorts")
            .then(res => res.json())
            .then(data => setResorts(data))
            .catch(err => console.error(err));
    }, []);


    // assume you have incidentData?.status coming from your API
    const dbStatus = incidentData?.status;

    useEffect(() => {
        if (open) {
            if (incidentData) {
                // Editing existing incident
                setResortName(incidentData.resort_name || "");
                setCategory(incidentData.category || "Medianet");
                setIncident(incidentData.notes || "");
                setStatus(incidentData.status || "New");
                setDate(dayjs(incidentData.incident_date));
            } else {
                // Adding new incident → reset all fields
                setResortName("");
                setCategory("Medianet");
                setIncident("");
                setStatus("New");
                setDate(dayjs());
            }
            setIsFormDirty(false); // reset change tracker
        }
    }, [open, incidentData]);


    // Check if any field has changed compared to original incidentData
    useEffect(() => {
        if (!incidentData) {
            // For new incident, enable save if any field has value
            setIsFormDirty(resortName || notes || category !== "Medianet" || status !== "New");
        } else {
            setIsFormDirty(
                resortName !== incidentData.resort_name ||
                category !== incidentData.category ||
                notes !== incidentData.notes ||
                status !== incidentData.status ||
                !dayjs(incidentData.incident_date).isSame(date, "day")
            );
        }
    }, [resortName, category, notes, status, date, incidentData]);

    const handleSave = async () => {
        // if (!resortName) {
        //     showToast("Please select a resort", "error");
        //     return;
        // }

        let hasError = false;

        if (!resortName || resortName.trim() === "") {
            showToast("Resort name is required", "error");
            hasError = true;
        }

        if (!category || category.trim() === "") {
            showToast("Category is required", "error");
            hasError = true;
        }

        if (!date || !dayjs(date).isValid()) {
            showToast("Valid date is required", "error");
            hasError = true;
        }

        if (!notes || notes.trim() === "") {
            showToast("Incident description is required", "error");
            hasError = true;
        }

        if (hasError) return; // Stop if any field missing

        // Find the resort object from the name
        let selectedResort = resorts.find(r => r.resort_name === resortName);

        // If editing and resort is not in the list, still allow saving
        if (!selectedResort && incidentData) {
            selectedResort = {
                resort_id: incidentData.resort_id,
                resort_name: resortName
            };
        }


        // const selectedResort = resorts.find(r => r.resort_name === resortName);
        if (!selectedResort) {
            showToast("Selected resort is invalid", "error");
            return;
        }

        const incidentToSave = {
            resort_id: selectedResort.resort_id,
            resort_name: resortName,
            category,
            notes,
            status,
            incident_date: date.format("YYYY-MM-DD"),
        };

        let method = "POST";
        let url = "http://localhost:5000/statistics/resortIncidentReports";

        if (incidentData && incidentData.incident_id) {
            method = "PUT";
            url = `http://localhost:5000/statistics/updateIncidentReport/${incidentData.incident_id}`;
            incidentToSave.incident_id = incidentData.incident_id;
        }

        try {
            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(incidentToSave),
            });

            if (!response.ok) throw new Error("Failed to save incident");
            const result = await response.json();
            onSave(result);

            // Show toaster for success
            if (method === "POST") {
                showToast("Incident created successfully!", "success");
            } else {
                showToast("Incident updated successfully!", "success");
            }

            // Reset fields after save (only for new incident)
            if (!incidentData) {
                setResortName("");
                setCategory("Medianet");
                setIncident("");
                setStatus("New");
                setDate(dayjs());
            }
            onClose();
        } catch (error) {
            console.error("Error saving incident:", error);
            showToast("Error saving incident", "error");
        }
    };

    const rowStyle = { display: "flex", gap: "2rem" };
    const fieldStyle = { flex: 1, display: "flex", flexDirection: "column" };
    const notesStyle = { marginTop: "1rem", display: "flex", flexDirection: "column" };
    const chipStackStyle = { flexDirection: "row", gap: "0.5rem", marginTop: "0.5rem" };

    return (
        <Dialog
            open={open}
            onClose={(event, reason) => reason !== "backdropClick" && onClose()}
            PaperProps={{
                style: { width: dialogWidth, maxHeight: "90vh", maxWidth: "56vw" }
            }}
        >
            <DialogTitle sx={{
                m: 0,
                p: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
            }}>{incidentData ? "Edit Incident Report" : "Add New Incident Report"}  <Tooltip title="Close" arrow>
                    <IconButton
                        aria-label="close"
                        onClick={onClose}
                        sx={{
                            color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Tooltip>
            </DialogTitle>
            <DialogContent dividers>

                {/* Row 1: Resort Name + Category */}
                <div style={rowStyle}>
                    <div style={fieldStyle}>
                        <FormLabel>Resort Name</FormLabel>
                        <Autocomplete
                            options={resorts.map(r => r.resort_name)}
                            value={resortName}
                            onChange={(event, newValue) => setResortName(newValue || "")}
                            renderInput={(params) => (
                                <TextField {...params} placeholder="Select or type resort" fullWidth margin="dense" />
                            )}
                        />
                    </div>
                    <div style={fieldStyle}>
                        <FormLabel>Category</FormLabel>
                        <RadioGroup row value={category} onChange={(e) => setCategory(e.target.value)}>
                            <FormControlLabel value="Medianet" control={<Radio />} label="Medianet" />
                            <FormControlLabel value="Ooredoo" control={<Radio />} label="Ooredoo" />
                        </RadioGroup>
                    </div>
                </div>

                {/* Row 2: Date + Status */}
                <div style={rowStyle}>
                    <div style={fieldStyle}>
                        <FormLabel>Date</FormLabel>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                value={date}
                                onChange={(newValue) => setDate(newValue)}
                                renderInput={(params) => <TextField {...params} fullWidth margin="dense" />}
                            />
                        </LocalizationProvider>
                    </div>
                    <div style={fieldStyle}>
                        <FormLabel>Status</FormLabel>
                        <Stack style={chipStackStyle}>
                            <Chip
                                label="New"
                                color={status === "New" ? "primary" : "default"}
                                onClick={() => setStatus("New")}
                                clickable={!!incidentData}
                                disabled={dbStatus === "Completed"} // disable when completed
                            />
                            <Chip
                                label="Pending"
                                color={status === "Pending" ? "warning" : "default"}
                                onClick={() => setStatus("Pending")}
                                clickable={!!incidentData}
                                // disabled={!incidentData}
                                disabled={!incidentData || dbStatus === "Completed"} // disable when completed

                            />
                            <Chip
                                label="Completed"
                                color={status === "Completed" ? "success" : "default"}
                                onClick={() => setStatus("Completed")}
                                clickable={!!incidentData}
                                disabled={!incidentData}
                            />
                        </Stack>
                    </div>
                </div>

                {/* Row 3: Notes */}
                <div style={notesStyle}>
                    <FormLabel>Incident</FormLabel>
                    <TextField
                        placeholder="Enter Incidents"
                        multiline
                        rows={4}
                        variant="outlined"
                        // fullWidth
                        height="30vh"
                        margin="dense"
                        value={notes}
                        // onChange={(e) => setIncident(e.target.value)}
                        onChange={(e) => {
                            const value = e.target.value;
                            // Capitalize the first letter only
                            const capitalized =
                                value.charAt(0).toUpperCase() + value.slice(1);
                            setIncident(capitalized);
                        }}
                    />
                </div>

            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} color="primary">Cancel</Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    color="primary"
                    disabled={!isFormDirty} // disabled if no changes
                >
                    {incidentData ? "Update" : "Save"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default IncidentModal;

