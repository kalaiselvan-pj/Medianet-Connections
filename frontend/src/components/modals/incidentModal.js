import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormLabel,
    TextField,
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
    const [incident, setIncident] = useState("");
    const [status, setStatus] = useState("New");
    const [date, setDate] = useState(dayjs());
    const [isFormDirty, setIsFormDirty] = useState(false); // track changes
    const [assignedTo, setAssignedTo] = useState("");
    const [ContactName, setContactName] = useState("");
    const [ContactNumber, setContactNumber] = useState("");


    // Fetch resorts on mount
    useEffect(() => {
        fetch(`${process.env.REACT_APP_LOCALHOST}/statistics/getAllResorts`)
            .then(res => res.json())
            .then(data => setResorts(data))
            .catch(err => console.error(err));
    }, []);

    // Helper function for capitalizing the first letter
    const capitalizeFirstLetter = (value) => {
        if (!value) return "";
        return value.charAt(0).toUpperCase() + value.slice(1);
    };

    // assume you have incidentData?.status coming from your API
    const dbStatus = incidentData?.status;

    useEffect(() => {
        if (open) {
            if (incidentData) {
                // Editing existing incident
                setResortName(incidentData.resort_name || "");
                setIncident(incidentData.incident || "");
                setStatus(incidentData.status || "New");
                setDate(dayjs(incidentData.incident_date));
                setAssignedTo(incidentData.assigned_to || "");
                setContactName(incidentData.contact_name || "");
                setContactNumber(incidentData.contact_number || "");
            } else {
                // Adding new incident → reset all fields
                setResortName("");
                setIncident("");
                setStatus("New");
                setDate(dayjs());
                setAssignedTo("");
                setContactName("");
                setContactNumber("");
            }
            setIsFormDirty(false); // reset change tracker
        }
    }, [open, incidentData]);


    // Check if any field has changed compared to original incidentData
    useEffect(() => {
        if (!incidentData) {
            // For new incident, enable save if any required field has value
            setIsFormDirty(
                resortName || incident || assignedTo || ContactName || ContactNumber
            );
        } else {
            // Check for changes in existing fields
            const existingResortName = incidentData.resort_name || "";
            const existingIncident = incidentData.incident || "";
            const existingStatus = incidentData.status || "New";
            const existingAssignedTo = incidentData.assigned_to || "";
            const existingContactName = incidentData.contact_name || "";
            const existingContactNumber = incidentData.contact_number || "";

            setIsFormDirty(
                resortName !== existingResortName ||
                incident !== existingIncident ||
                status !== existingStatus ||
                assignedTo !== existingAssignedTo ||
                ContactName !== existingContactName ||
                ContactNumber !== existingContactNumber ||
                !dayjs(incidentData.incident_date).isSame(date, "day")
            );
        }
    }, [resortName, incident, status, date, incidentData, assignedTo, ContactName, ContactNumber]);

    const handleSave = async () => {
        let hasError = false;

        // --- MANDATORY FIELDS VALIDATION ---

        if (!resortName || resortName.trim() === "") {
            showToast("Resort name is required", "error");
            hasError = true;
        }

        if (!date || !dayjs(date).isValid()) {
            showToast("Valid date is required", "error");
            hasError = true;
        }

        if (!incident || incident.trim() === "") {
            showToast("Incident description is required", "error");
            hasError = true;
        }

        if (!assignedTo || assignedTo.trim() === "") {
            showToast("Assigned To is required", "error");
            hasError = true;
        }

        if (!ContactName || ContactName.trim() === "") {
            showToast("Contact Name is required", "error");
            hasError = true;
        }

        if (!ContactNumber || ContactNumber.trim() === "") {
            showToast("Contact Number is required", "error");
            hasError = true;
        }

        if (hasError) return; // Stop if any mandatory field is missing

        // Find the resort object from the name
        let selectedResort = resorts.find(r => r.resort_name === resortName);

        // If editing and resort is not in the list, still allow saving
        if (!selectedResort && incidentData) {
            selectedResort = {
                resort_id: incidentData.resort_id,
                resort_name: resortName
            };
        }


        if (!selectedResort) {
            showToast("Selected resort is invalid", "error");
            return;
        }

        const incidentToSave = {
            resort_id: selectedResort.resort_id,
            resort_name: resortName,
            incident,
            status,
            incident_date: date.format("YYYY-MM-DD"),
            assigned_to: assignedTo,
            contact_name: ContactName,
            contact_number: ContactNumber,
        };

        let method = "POST";
        let url = `${process.env.REACT_APP_LOCALHOST}/statistics/addIncidentReports`;

        if (incidentData && incidentData.incident_id) {
            method = "PUT";
            url = `${process.env.REACT_APP_LOCALHOST}/statistics/updateIncidentReport/${incidentData.incident_id}`;
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
                setIncident("");
                setStatus("New");
                setDate(dayjs());
                setAssignedTo("");
                setContactName("");
                setContactNumber("");
            }
            onClose();
        } catch (error) {
            console.error("Error saving incident:", error);
            showToast("Error saving incident", "error");
        }
    };

    const rowStyle = { display: "flex", gap: "2rem", marginBottom: "1rem" };
    const fieldStyle = { flex: 1, display: "flex", flexDirection: "column" };
    const IncidentStyle = { marginTop: "1rem", display: "flex", flexDirection: "column" };
    const chipStackStyle = { flexDirection: "row", gap: "0.5rem", marginTop: "0.5rem" };

    return (
        <Dialog
            open={open}
            onClose={(event, reason) => reason !== "backdropClick" && onClose()}
            PaperProps={{
                style: { width: dialogWidth, maxHeight: "92vh", maxWidth: "56vw" }
            }}
        >
            <DialogTitle sx={{
                m: 0,
                p: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
            }}>{incidentData ? "Edit Incident Report" : "Add New Incident Report"}
                <Tooltip title="Close" arrow>
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

                {/* Row 1: Resort Name + Assigned To */}
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
                        <FormLabel>Assigned To</FormLabel>
                        <TextField
                            placeholder="Enter Name"
                            fullWidth
                            margin="dense"
                            value={assignedTo}
                            onChange={(e) => setAssignedTo(capitalizeFirstLetter(e.target.value))}

                        />
                    </div>
                </div>

                {/* Row 2: Resort Contact Name + Number */}
                <div style={rowStyle}>
                    <div style={fieldStyle}>
                        <FormLabel>Contact Name</FormLabel>
                        <TextField
                            placeholder="Enter contact name"
                            fullWidth
                            margin="dense"
                            value={ContactName}
                            onChange={(e) => setContactName(capitalizeFirstLetter(e.target.value))}
                        />
                    </div>
                    <div style={fieldStyle}>
                        <FormLabel>Contact Number</FormLabel>
                        <TextField
                            placeholder="Enter contact number"
                            fullWidth
                            margin="dense"
                            value={ContactNumber}
                            onChange={(e) => setContactNumber(e.target.value)}
                        />
                    </div>
                </div>

                {/* Row 3: Date + Status */}
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
                                disabled={dbStatus === "Completed"}
                            />
                            <Chip
                                label="Pending"
                                color={status === "Pending" ? "warning" : "default"}
                                onClick={() => setStatus("Pending")}
                                clickable={!!incidentData}
                                disabled={!incidentData || dbStatus === "Completed"}
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

                {/* Row 4: incident (Incident Description) */}
                <div style={IncidentStyle}>
                    <FormLabel>Incident</FormLabel>
                    <TextField
                        placeholder="Enter Incidents"
                        multiline
                        rows={4}
                        variant="outlined"
                        margin="dense"
                        value={incident}
                        onChange={(e) => setIncident(capitalizeFirstLetter(e.target.value))} />
                </div>

            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} color="primary">Cancel</Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    color="primary"
                    disabled={!isFormDirty}
                >
                    {incidentData ? "Update" : "Save"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default IncidentModal;