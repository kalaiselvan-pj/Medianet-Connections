import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  IconButton,
  TextField,
  Typography,
  FormControl,
  MenuItem,
  Select,
  Grid,
  Box,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import ImageIcon from "@mui/icons-material/Image";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { showToast } from "../common/toaster";

const AddResortModal = ({ showModal, setShowModal, selectedResort, onSaveResort }) => {
  const isEditMode = !!selectedResort;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    resort_name: "",
    category: "",
    island: "",
    iptv_vendor: "",
    staff_area_tv: "",
    guest_area_tv: "",
    distribution_model: "",
    tvro_type: "",
    tvro_dish: "",
    horizontal_signal: "",
    vertical_signal: "",
    horizontal_link_margin: "",
    vertical_link_margin: "",
  });

  const [contacts, setContacts] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", email: "", phone: "" });
  const [signalTimestamp, setSignalTimestamp] = useState("");

  // File upload states
  const [surveyFormFile, setSurveyFormFile] = useState(null);
  const [serviceAcceptanceFile, setServiceAcceptanceFile] = useState(null);
  const [signalImageFile, setSignalImageFile] = useState(null);
  const [dishAntennaImageFile, setDishAntennaImageFile] = useState(null);

  // Existing file URLs for edit mode
  const [surveyFormUrl, setSurveyFormUrl] = useState(null);
  const [serviceAcceptanceUrl, setServiceAcceptanceUrl] = useState(null);
  const [dishAntennaImageUrl, setDishAntennaImageUrl] = useState(null);
  const [signalImageUrl, setSignalImageUrl] = useState(null);

  // Track if files have been changed or removed
  const [filesChanged, setFilesChanged] = useState({
    survey_form: false,
    service_acceptance_form: false,
    signal_image: false,
    dish_antena_image: false
  });

  // Track removed files
  const [removedFiles, setRemovedFiles] = useState({
    survey_form: false,
    service_acceptance_form: false,
    signal_image: false,
    dish_antena_image: false
  });

  // Reset form when modal opens/closes or when switching between add/edit
  useEffect(() => {
    if (showModal) {
      if (selectedResort) {
        // Edit mode - populate with existing data
        setFormData({
          resort_name: selectedResort.resort_name || "",
          category: selectedResort.category || "",
          island: selectedResort.island || "",
          iptv_vendor: selectedResort.iptv_vendor || "",
          staff_area_tv: selectedResort.staff_area_tv || "",
          guest_area_tv: selectedResort.guest_area_tv || "",
          distribution_model: selectedResort.distribution_model || "",
          tvro_type: selectedResort.tvro_type || "",
          tvro_dish: selectedResort.tvro_dish || "",
          horizontal_signal: selectedResort.horizontal_signal || "",
          vertical_signal: selectedResort.vertical_signal || "",
          horizontal_link_margin: selectedResort.horizontal_link_margin || "",
          vertical_link_margin: selectedResort.vertical_link_margin || "",
        });
        setContacts(selectedResort.contact_details || []);
        setSignalTimestamp(selectedResort.signal_level_timestamp || "");

        // Set URLs for existing files
        setSurveyFormUrl(bufferToUrl(selectedResort.survey_form, 'application/pdf'));
        setServiceAcceptanceUrl(bufferToUrl(selectedResort.service_acceptance_form, 'application/pdf'));
        setDishAntennaImageUrl(bufferToUrl(selectedResort.dish_antena_image, 'image/jpeg'));
        setSignalImageUrl(bufferToUrl(selectedResort.signal_image, 'image/jpeg'));

        // Reset file change tracking
        setFilesChanged({
          survey_form: false,
          service_acceptance_form: false,
          signal_image: false,
          dish_antena_image: false
        });

        setRemovedFiles({
          survey_form: false,
          service_acceptance_form: false,
          signal_image: false,
          dish_antena_image: false
        });

        // Clear any new file selections in edit mode
        setSurveyFormFile(null);
        setServiceAcceptanceFile(null);
        setSignalImageFile(null);
        setDishAntennaImageFile(null);
      } else {
        // Add mode - reset everything
        setFormData({
          resort_name: "",
          category: "",
          island: "",
          iptv_vendor: "",
          staff_area_tv: "",
          guest_area_tv: "",
          distribution_model: "",
          tvro_type: "",
          tvro_dish: "",
          horizontal_signal: "",
          vertical_signal: "",
          horizontal_link_margin: "",
          vertical_link_margin: "",
        });
        setContacts([]);
        setSignalTimestamp("");
        setSurveyFormFile(null);
        setServiceAcceptanceFile(null);
        setSignalImageFile(null);
        setDishAntennaImageFile(null);
        setSurveyFormUrl(null);
        setServiceAcceptanceUrl(null);
        setDishAntennaImageUrl(null);
        setSignalImageUrl(null);
        setFilesChanged({
          survey_form: false,
          service_acceptance_form: false,
          signal_image: false,
          dish_antena_image: false
        });
        setRemovedFiles({
          survey_form: false,
          service_acceptance_form: false,
          signal_image: false,
          dish_antena_image: false
        });
      }
    }
  }, [selectedResort, showModal]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (["horizontal_signal", "vertical_signal", "horizontal_link_margin", "vertical_link_margin"].includes(name)) {
      setSignalTimestamp(new Date().toLocaleString());
    }
  };

  // --- File Upload Handlers ---
  const handleSurveyFormUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setSurveyFormFile(file);
        setFilesChanged(prev => ({ ...prev, survey_form: true }));
        setRemovedFiles(prev => ({ ...prev, survey_form: false }));
        showToast("Survey form uploaded successfully!", "success");
      } else {
        showToast("Please upload a PDF file", "error");
      }
    }
  };

  const handleServiceAcceptanceUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setServiceAcceptanceFile(file);
        setFilesChanged(prev => ({ ...prev, service_acceptance_form: true }));
        setRemovedFiles(prev => ({ ...prev, service_acceptance_form: false }));
        showToast("Service acceptance form uploaded successfully!", "success");
      } else {
        showToast("Please upload a PDF file", "error");
      }
    }
  };

  const handleSignalImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSignalImageFile(file);
        setFilesChanged(prev => ({ ...prev, signal_image: true }));
        setRemovedFiles(prev => ({ ...prev, signal_image: false }));
        showToast("Signal image uploaded successfully!", "success");
      } else {
        showToast("Please upload an image file", "error");
      }
    }
  };

  const handleDishAntennaImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setDishAntennaImageFile(file);
        setFilesChanged(prev => ({ ...prev, dish_antena_image: true }));
        setRemovedFiles(prev => ({ ...prev, dish_antena_image: false }));
        showToast("Dish antenna image uploaded successfully!", "success");
      } else {
        showToast("Please upload an image file", "error");
      }
    }
  };

  // --- File Remove Handlers ---
  const handleRemoveSurveyForm = () => {
    setSurveyFormFile(null);
    setSurveyFormUrl(null);
    setFilesChanged(prev => ({ ...prev, survey_form: true }));
    setRemovedFiles(prev => ({ ...prev, survey_form: true }));
    showToast("Survey form removed!", "info");
  };

  const handleRemoveServiceAcceptance = () => {
    setServiceAcceptanceFile(null);
    setServiceAcceptanceUrl(null);
    setFilesChanged(prev => ({ ...prev, service_acceptance_form: true }));
    setRemovedFiles(prev => ({ ...prev, service_acceptance_form: true }));
    showToast("Service acceptance form removed!", "info");
  };

  const handleRemoveSignalImage = () => {
    setSignalImageFile(null);
    setSignalImageUrl(null);
    setFilesChanged(prev => ({ ...prev, signal_image: true }));
    setRemovedFiles(prev => ({ ...prev, signal_image: true }));
    showToast("Signal image removed!", "info");
  };

  const handleRemoveDishAntennaImage = () => {
    setDishAntennaImageFile(null);
    setDishAntennaImageUrl(null);
    setFilesChanged(prev => ({ ...prev, dish_antena_image: true }));
    setRemovedFiles(prev => ({ ...prev, dish_antena_image: true }));
    showToast("Dish antenna image removed!", "info");
  };

  // --- Contacts Table Logic ---
  const handleAddContact = () => {
    setAdding(true);
    setNewContact({ name: "", email: "", phone: "" });
  };

  const handleSaveNewContact = () => {
    if (!newContact.name || !newContact.email || !newContact.phone) {
      showToast("Please fill all contact fields", "error");
      return;
    }

    const updatedContacts = [...contacts, newContact];
    setContacts(updatedContacts);
    setAdding(false);
    setNewContact({ name: "", email: "", phone: "" });
    showToast("Contact added successfully!", "success");
  };

  const handleEditContact = (index) => setEditingIndex(index);

  const handleSaveEdit = (index) => {
    const editedContact = contacts[index];
    if (!editedContact.name || !editedContact.email || !editedContact.phone) {
      showToast("All contact fields are required", "error");
      return;
    }

    setEditingIndex(null);
    showToast("Contact updated successfully!", "success");
  };

  const handleDeleteContact = (index) => {
    const updatedContacts = contacts.filter((_, i) => i !== index);
    setContacts(updatedContacts);
    showToast("Contact deleted successfully!", "success");
  };

  const handleDialogClose = (event, reason) => {
    if (reason === "backdropClick") return;
    setShowModal(false);
  };

  // Function to truncate long text with ellipsis
  const truncateText = (text, maxLength = 20) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Function to convert buffer to blob for sending to backend
  const bufferToBlob = (bufferData, mimeType) => {
    if (!bufferData || !bufferData.data) return null;
    try {
      const byteArray = new Uint8Array(bufferData.data);
      return new Blob([byteArray], { type: mimeType });
    } catch (error) {
      console.error("Error converting buffer to blob:", error);
      return null;
    }
  };

  // Main save function - UPDATED: Handles both new files and existing files in edit mode
  const handleSaveResort = async () => {
    if (!formData.resort_name || !formData.category || !formData.iptv_vendor || !formData.island) {
      return showToast("Please fill all required fields", "error");
    }

    const options = {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    };

    const formattedDate = new Date().toLocaleString("en-GB", options).replace(",", "");

    // Create FormData for file uploads
    const formDataToSend = new FormData();

    // Append regular form data
    formDataToSend.append('resort_name', formData.resort_name);
    formDataToSend.append('category', formData.category);
    formDataToSend.append('island', formData.island);
    formDataToSend.append('iptv_vendor', formData.iptv_vendor);
    formDataToSend.append('staff_area_tv', formData.staff_area_tv);
    formDataToSend.append('guest_area_tv', formData.guest_area_tv);
    formDataToSend.append('distribution_model', formData.distribution_model);
    formDataToSend.append('tvro_type', formData.tvro_type);
    formDataToSend.append('tvro_dish', formData.tvro_dish);
    formDataToSend.append('horizontal_signal', formData.horizontal_signal);
    formDataToSend.append('vertical_signal', formData.vertical_signal);
    formDataToSend.append('horizontal_link_margin', formData.horizontal_link_margin);
    formDataToSend.append('vertical_link_margin', formData.vertical_link_margin);
    formDataToSend.append('contact_details', JSON.stringify(contacts));
    formDataToSend.append('signal_level_timestamp', formattedDate);

    // Handle file uploads - NEW LOGIC
    if (isEditMode) {
      // Add removal flags for backend
      formDataToSend.append('removed_survey_form', removedFiles.survey_form.toString());
      formDataToSend.append('removed_service_acceptance_form', removedFiles.service_acceptance_form.toString());
      formDataToSend.append('removed_signal_image', removedFiles.signal_image.toString());
      formDataToSend.append('removed_dish_antena_image', removedFiles.dish_antena_image.toString());

      // Survey Form
      if (filesChanged.survey_form && surveyFormFile && !removedFiles.survey_form) {
        // New file uploaded
        formDataToSend.append('survey_form', surveyFormFile);
      } else if (!filesChanged.survey_form && selectedResort.survey_form && !removedFiles.survey_form) {
        // Keep existing file - convert buffer to blob
        const existingFile = bufferToBlob(selectedResort.survey_form, 'application/pdf');
        if (existingFile) {
          formDataToSend.append('survey_form', existingFile, 'existing_survey_form.pdf');
        }
      }

      // Service Acceptance Form
      if (filesChanged.service_acceptance_form && serviceAcceptanceFile && !removedFiles.service_acceptance_form) {
        formDataToSend.append('service_acceptance_form', serviceAcceptanceFile);
      } else if (!filesChanged.service_acceptance_form && selectedResort.service_acceptance_form && !removedFiles.service_acceptance_form) {
        const existingFile = bufferToBlob(selectedResort.service_acceptance_form, 'application/pdf');
        if (existingFile) {
          formDataToSend.append('service_acceptance_form', existingFile, 'existing_service_acceptance.pdf');
        }
      }

      // Signal Image
      if (filesChanged.signal_image && signalImageFile && !removedFiles.signal_image) {
        formDataToSend.append('signal_image', signalImageFile);
      } else if (!filesChanged.signal_image && selectedResort.signal_image && !removedFiles.signal_image) {
        const existingFile = bufferToBlob(selectedResort.signal_image, 'image/jpeg');
        if (existingFile) {
          formDataToSend.append('signal_image', existingFile, 'existing_signal_image.jpg');
        }
      }

      // Dish Antenna Image
      if (filesChanged.dish_antena_image && dishAntennaImageFile && !removedFiles.dish_antena_image) {
        formDataToSend.append('dish_antena_image', dishAntennaImageFile);
      } else if (!filesChanged.dish_antena_image && selectedResort.dish_antena_image && !removedFiles.dish_antena_image) {
        const existingFile = bufferToBlob(selectedResort.dish_antena_image, 'image/jpeg');
        if (existingFile) {
          formDataToSend.append('dish_antena_image', existingFile, 'existing_dish_antenna.jpg');
        }
      }
    } else {
      // Add mode - just append new files if they exist
      if (surveyFormFile) formDataToSend.append('survey_form', surveyFormFile);
      if (serviceAcceptanceFile) formDataToSend.append('service_acceptance_form', serviceAcceptanceFile);
      if (signalImageFile) formDataToSend.append('signal_image', signalImageFile);
      if (dishAntennaImageFile) formDataToSend.append('dish_antena_image', dishAntennaImageFile);
    }

    setLoading(true);
    try {
      const url = isEditMode
        ? `${process.env.REACT_APP_LOCALHOST}/statistics/updateResort/${selectedResort.resort_id}`
        : `${process.env.REACT_APP_LOCALHOST}/statistics/addResort`;

      const response = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        body: formDataToSend,
      });

      if (!response.ok) throw new Error("Failed to save resort");

      showToast(isEditMode ? "Resort updated successfully!" : "Resort added successfully!", "success");

      // Call the onSaveResort callback to refresh the parent component's data
      if (onSaveResort) {
        onSaveResort();
      }

      // Close the modal after successful save
      setShowModal(false);

    } catch (err) {
      console.error(err);
      showToast("Something went wrong!", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSignalChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setSignalTimestamp(new Date().toLocaleString());
  };

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

  // Handle cancel for signal image
  const handleCancelSignalImage = () => {
    setSignalImageFile(null);
    setFilesChanged(prev => ({ ...prev, signal_image: false }));
    showToast("Signal image upload cancelled", "info");
  };

  // Handle cancel for dish antenna image
  const handleCancelDishAntennaImage = () => {
    setDishAntennaImageFile(null);
    setFilesChanged(prev => ({ ...prev, dish_antena_image: false }));
    showToast("Dish antenna image upload cancelled", "info");
  };

  // Handle cancel for PDF files
  const handleCancelSurveyForm = () => {
    setSurveyFormFile(null);
    setFilesChanged(prev => ({ ...prev, survey_form: false }));
    showToast("Survey form upload cancelled", "info");
  };

  const handleCancelServiceAcceptance = () => {
    setServiceAcceptanceFile(null);
    setFilesChanged(prev => ({ ...prev, service_acceptance_form: false }));
    showToast("Service acceptance form upload cancelled", "info");
  };

  if (!showModal) return null;

  return (
    <Dialog
      open={showModal}
      onClose={() => setShowModal(false)}
      maxWidth={false}
      PaperProps={{ sx: { width: "1300px", height: "700px", maxHeight: "95vh", p: 2 } }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 10 }}>
        {isEditMode ? "Edit Resort Details" : "Add New Resort"}
        <IconButton onClick={() => setShowModal(false)}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Grid container spacing={10}>
          {/* LHS */}
          <Grid item xs={12} md={6} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Resort Information Heading */}
            <Typography variant="h6" color="primary" sx={{ mb: 0, fontWeight: 'bold' }}>
              Resort Information
            </Typography>

            {/* Resort Info */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Resort Name"
                  name="resort_name"
                  value={formData.resort_name}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Atoll"
                  name="island"
                  value={formData.island}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="IPTV Vendor"
                  name="iptv_vendor"
                  value={formData.iptv_vendor}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <Select displayEmpty name="category" value={formData.category} onChange={handleChange}>
                    <MenuItem value="" disabled>
                      Category
                    </MenuItem>
                    <MenuItem value="Medianet">Medianet</MenuItem>
                    <MenuItem value="Ooredoo">Ooredoo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Signal Levels */}
            <Box sx={{ mb: 0 }}>
              <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                Signal Levels
              </Typography>

              <Grid container spacing={3}>
                {/* First Row */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    sx={{ width: "80%", maxWidth: 200 }}
                    size="small"
                    type="number"
                    label="Horizontal Signal"
                    name="horizontal_signal"
                    value={formData.horizontal_signal}
                    onChange={handleSignalChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    sx={{ width: "80%", maxWidth: 200 }}
                    size="small"
                    type="number"
                    label="Vertical Signal"
                    name="vertical_signal"
                    value={formData.vertical_signal}
                    onChange={handleSignalChange}
                  />
                </Grid>

                {/* Second Row */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    sx={{ width: "80%", maxWidth: 200 }}
                    size="small"
                    type="number"
                    label="Horizontal Link Margin"
                    name="horizontal_link_margin"
                    value={formData.horizontal_link_margin}
                    onChange={handleSignalChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    sx={{ width: "80%", maxWidth: 200 }}
                    size="small"
                    type="number"
                    label="Vertical Link Margin"
                    name="vertical_link_margin"
                    value={formData.vertical_link_margin}
                    onChange={handleSignalChange}
                  />
                </Grid>
              </Grid>

              {/* Timestamp */}
              <Box sx={{ height: signalTimestamp ? 'auto' : '24px', mt: 2, pl: 1 }}>
                {signalTimestamp && (
                  <Typography variant="body2" color="textSecondary">
                    Last Updated: {signalTimestamp}
                  </Typography>
                )}
              </Box>

              {/* Signal Image Upload */}
              <Box sx={{ mt: 2 }}>

                {signalImageFile && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Typography variant="body2" color="success.main">
                      ✓ {truncateText(signalImageFile.name, 25)}
                    </Typography>
                    <Button
                      variant="text"
                      size="small"
                      color="error"
                      onClick={handleCancelSignalImage}
                    >
                      Cancel
                    </Button>
                  </Box>
                )}
                {!signalImageFile && signalImageUrl && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <Button
                      variant="text"
                      size="small"
                      href={signalImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      startIcon={<ImageIcon />}
                    >
                      Download Signal Image
                    </Button>
                    <Button
                      variant="text"
                      size="small"
                      color="error"
                      onClick={handleRemoveSignalImage}
                      startIcon={<CancelIcon />}
                    >
                      Remove
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Contacts Table */}
            <Box sx={{ maxWidth: 835, position: "relative" }}>
              {/* Resort Contacts Heading with Add button on right */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                  Resort Contacts
                </Typography>
                <IconButton size="small" color="primary" onClick={handleAddContact}>
                  <AddIcon />
                </IconButton>
              </Box>

              <TableContainer
                sx={{
                  border: "1px solid #b7c6eeff",
                  borderRadius: 1,
                  overflowY: "auto",
                  maxHeight: 3 * 52,
                  minHeight: 3 * 52,
                  position: "relative",
                }}
              >
                <Table
                  size="small"
                  sx={{
                    tableLayout: "fixed",
                    width: "100%",
                  }}
                  stickyHeader
                >
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          backgroundColor: "#2e65a3",
                          color: "#fff",
                          fontWeight: "bold",
                          textAlign: "left",
                          width: "25%",
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                          borderBottom: "2px solid #1e4a7a"
                        }}
                      >
                        Name
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: "#2e65a3",
                          color: "#fff",
                          fontWeight: "bold",
                          textAlign: "left",
                          width: "25%",
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                          borderBottom: "2px solid #1e4a7a"
                        }}
                      >
                        Email
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: "#2e65a3",
                          color: "#fff",
                          fontWeight: "bold",
                          textAlign: "left",
                          width: "25%",
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                          borderBottom: "2px solid #1e4a7a"
                        }}
                      >
                        Phone
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: "#2e65a3",
                          color: "#fff",
                          fontWeight: "bold",
                          textAlign: "center",
                          width: "25%",
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                          borderBottom: "2px solid #1e4a7a"
                        }}
                      >
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contacts.map((contact, index) => (
                      <TableRow
                        key={index}
                        sx={{
                          backgroundColor: index % 2 === 0 ? "transparent" : "#f8fbff",
                          "&:hover": { backgroundColor: "#e3f2fd" }
                        }}
                      >
                        {/* Name - with truncation */}
                        <TableCell sx={{ textAlign: "center" }}>
                          {editingIndex === index ? (
                            <TextField
                              fullWidth
                              size="small"
                              value={contact.name}
                              onChange={(e) => {
                                const updated = [...contacts];
                                updated[index].name = e.target.value;
                                setContacts(updated);
                              }}
                            />
                          ) : (
                            <Tooltip title={contact.name} arrow>
                              <Typography
                                sx={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  maxWidth: "100%"
                                }}
                              >
                                {truncateText(contact.name, 15)}
                              </Typography>
                            </Tooltip>
                          )}
                        </TableCell>

                        {/* Email - with truncation */}
                        <TableCell sx={{ textAlign: "center" }}>
                          {editingIndex === index ? (
                            <TextField
                              fullWidth
                              size="small"
                              value={contact.email}
                              onChange={(e) => {
                                const updated = [...contacts];
                                updated[index].email = e.target.value;
                                setContacts(updated);
                              }}
                            />
                          ) : (
                            <Tooltip title={contact.email} arrow>
                              <Typography
                                sx={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  maxWidth: "100%"
                                }}
                              >
                                {truncateText(contact.email, 20)}
                              </Typography>
                            </Tooltip>
                          )}
                        </TableCell>

                        {/* Phone - with truncation */}
                        <TableCell sx={{ textAlign: "center" }}>
                          {editingIndex === index ? (
                            <TextField
                              fullWidth
                              size="small"
                              value={contact.phone}
                              onChange={(e) => {
                                const updated = [...contacts];
                                updated[index].phone = e.target.value;
                                setContacts(updated);
                              }}
                            />
                          ) : (
                            <Tooltip title={contact.phone} arrow>
                              <Typography
                                sx={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  maxWidth: "100%"
                                }}
                              >
                                {truncateText(contact.phone, 12)}
                              </Typography>
                            </Tooltip>
                          )}
                        </TableCell>

                        {/* Action Buttons */}
                        <TableCell sx={{ textAlign: "center" }}>
                          {editingIndex === index ? (
                            <>
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleSaveEdit(index)}
                              >
                                <SaveIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setEditingIndex(null)}
                              >
                                <CancelIcon />
                              </IconButton>
                            </>
                          ) : (
                            <>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleEditContact(index)}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteContact(index)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}

                    {adding && (
                      <TableRow sx={{ backgroundColor: "#e3f2fd" }}>
                        <TableCell sx={{ textAlign: "center" }}>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Name"
                            value={newContact.name}
                            onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Email"
                            value={newContact.email}
                            onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Phone"
                            value={newContact.phone}
                            onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          <IconButton size="small" color="success" onClick={handleSaveNewContact}>
                            <SaveIcon />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => setAdding(false)}>
                            <CancelIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* File Upload Buttons after Contacts Table */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" color="primary" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Document & Image Uploads
                </Typography>

                <Grid container spacing={4}>
                  {/* Column 1 - Survey Form */}
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Button
                        variant="contained"
                        component="label"
                        startIcon={<PictureAsPdfIcon />}
                        size="small"
                        sx={{
                          minWidth: '200px',
                          backgroundColor: '#2e86de',
                          '&:hover': {
                            backgroundColor: '#1a5a9a',
                          }
                        }}
                      >
                        Survey Form
                        <input
                          type="file"
                          hidden
                          accept=".pdf,application/pdf"
                          onChange={handleSurveyFormUpload}
                        />
                      </Button>
                      {surveyFormFile && (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, mt: 2 }}>
                          <Typography variant="body2" color="success.main">
                            ✓ {truncateText(surveyFormFile.name, 25)}
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            onClick={handleCancelSurveyForm}
                          >
                            Cancel
                          </Button>
                        </Box>
                      )}
                      {!surveyFormFile && surveyFormUrl && (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, mt: 2 }}>
                          <Button
                            variant="contained"
                            size="small"
                            href={surveyFormUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            startIcon={<PictureAsPdfIcon />}
                            sx={{
                              backgroundColor: '#28a745',
                              '&:hover': {
                                backgroundColor: '#1e7e34',
                              }
                            }}
                          >
                            Download
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            onClick={handleRemoveSurveyForm}
                            startIcon={<CancelIcon />}
                          >
                            Remove
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Grid>

                  {/* Column 2 - Service Acceptance */}
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Button
                        variant="contained"
                        component="label"
                        startIcon={<PictureAsPdfIcon />}
                        size="small"
                        sx={{
                          minWidth: '200px',
                          backgroundColor: '#2e86de',
                          '&:hover': {
                            backgroundColor: '#1a5a9a',
                          }
                        }}
                      >
                        Service Acceptance
                        <input
                          type="file"
                          hidden
                          accept=".pdf,application/pdf"
                          onChange={handleServiceAcceptanceUpload}
                        />
                      </Button>
                      {serviceAcceptanceFile && (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, mt: 2 }}>
                          <Typography variant="body2" color="success.main">
                            ✓ {truncateText(serviceAcceptanceFile.name, 25)}
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            onClick={handleCancelServiceAcceptance}
                          >
                            Cancel
                          </Button>
                        </Box>
                      )}
                      {!serviceAcceptanceFile && serviceAcceptanceUrl && (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, mt: 2 }}>
                          <Button
                            variant="contained"
                            size="small"
                            href={serviceAcceptanceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            startIcon={<PictureAsPdfIcon />}
                            sx={{
                              backgroundColor: '#28a745',
                              '&:hover': {
                                backgroundColor: '#1e7e34',
                              }
                            }}
                          >
                            Download
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            onClick={handleRemoveServiceAcceptance}
                            startIcon={<CancelIcon />}
                          >
                            Remove
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Grid>

                  {/* Column 3 - Images */}
                  <Grid item xs={12} md={4}>
                    {/* Dish Antenna Image */}
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Button
                        variant="contained"
                        component="label"
                        startIcon={<ImageIcon />}
                        size="small"
                        sx={{
                          minWidth: '200px',
                          backgroundColor: '#2e86de',
                          '&:hover': {
                            backgroundColor: '#1a5a9a',
                          }
                        }}
                      >
                        Dish Antenna Image
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={handleDishAntennaImageUpload}
                        />
                      </Button>
                      {dishAntennaImageFile && (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, mt: 2 }}>
                          <Typography variant="body2" color="success.main">
                            ✓ {truncateText(dishAntennaImageFile.name, 25)}
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            onClick={handleCancelDishAntennaImage}
                          >
                            Cancel
                          </Button>
                        </Box>
                      )}
                      {!dishAntennaImageFile && dishAntennaImageUrl && (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, mt: 2 }}>
                          <Button
                            variant="contained"
                            size="small"
                            href={dishAntennaImageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            startIcon={<ImageIcon />}
                            sx={{
                              backgroundColor: '#28a745',
                              '&:hover': {
                                backgroundColor: '#1e7e34',
                              }
                            }}
                          >
                            Download
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            onClick={handleRemoveDishAntennaImage}
                            startIcon={<CancelIcon />}
                          >
                            Remove
                          </Button>
                        </Box>
                      )}
                    </Box>

                    {/* Signal Image - If you have signal image, add it here with the same styling */}
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Grid>

          {/* RHS */}
          <Grid item xs={12} md={6} sx={{ display: "flex", flexDirection: "column", gap: 2.6 }}>
            <Typography variant="h6" color="primary" sx={{ mb: 0 }}>
              TV Points & Distribution
            </Typography>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Staff Area TV"
              name="staff_area_tv"
              value={formData.staff_area_tv}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Guest Area TV"
              name="guest_area_tv"
              value={formData.guest_area_tv}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            <Select
              fullWidth
              size="small"
              displayEmpty
              name="distribution_model"
              value={formData.distribution_model}
              onChange={handleChange}
            >
              <MenuItem value="" disabled>
                Distribution Model
              </MenuItem>
              <MenuItem value="medianet_streamer">Medianet Streamer</MenuItem>
              <MenuItem value="analogue">Analogue</MenuItem>
              <MenuItem value="iptv">IPTV</MenuItem>
              <MenuItem value="hybrid">Hybrid</MenuItem>
            </Select>

            <Typography variant="h6" color="primary" sx={{ mb: 0, mt: 2 }}>
              TVRO Information
            </Typography>
            <Grid item xs={12}>
              <Select fullWidth size="small" displayEmpty name="tvro_type" value={formData.tvro_type} onChange={handleChange}>
                <MenuItem value="" disabled>
                  TVRO Type
                </MenuItem>
                <MenuItem value="MMDS">MMDS</MenuItem>
                <MenuItem value="Satellite">Satellite</MenuItem>
              </Select>
            </Grid>
            <TextField
              fullWidth
              size="small"
              label="TVRO Dish"
              name="tvro_dish"
              value={formData.tvro_dish}
              onChange={handleChange}
              sx={{ mt: 2 }}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ height: 25, mt: 1 }}>
        <Button variant="outlined" onClick={() => setShowModal(false)}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSaveResort} disabled={loading}>
          {loading ? "Saving..." : "Save Resort"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddResortModal;