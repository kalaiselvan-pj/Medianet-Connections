import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  IconButton,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { showToast } from "../common/toaster";

const AddResortModal = ({ showModal, setShowModal, selectedResort, onClose, onSaveResort }) => {
  const isEditMode = !!selectedResort;

  const initialState = {
    resort_name: selectedResort?.resort_name || "",
    island: selectedResort?.island || "",
    phone_number: selectedResort?.phone_number || "",
    email: selectedResort?.email || "",
    category: selectedResort?.category || "Medianet",
  };

  const [formData, setFormData] = useState(initialState);
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData(initialState);
    setIsDirty(false);
  }, [selectedResort, showModal]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValue =
      name === "resort_name" || name === "island"
        ? value.charAt(0).toUpperCase() + value.slice(1)
        : value;

    const updatedFormData = { ...formData, [name]: newValue };
    setFormData(updatedFormData);

    // Check if form has changes
    const dirty = Object.keys(initialState).some(
      (key) => updatedFormData[key] !== initialState[key]
    );
    setIsDirty(dirty);
  };

  const handleSave = async () => {
    // Safe validation helper
    const isEmpty = (val) => !val || val.toString().trim() === "";

    if (isEmpty(formData.resort_name)) return showToast("Resort Name is required", "error");
    if (isEmpty(formData.island)) return showToast("Island is required", "error");
    if (isEmpty(formData.phone_number)) return showToast("Phone Number is required", "error");
    if (isEmpty(formData.email)) return showToast("Email is required", "error");
    if (isEmpty(formData.category)) return showToast("Category is required", "error");

    setLoading(true);

    try {
      if (isEditMode) {
        // Edit resort
        const response = await fetch(
          `http://localhost:5000/statistics/updateResort/${selectedResort.resort_id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          }
        );
        if (!response.ok) throw new Error("Failed to update resort");
        showToast("Resort updated successfully!", "success");
      } else {
        // Add new resort
        const response = await fetch("http://localhost:5000/statistics/addResort", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!response.ok) throw new Error("Failed to add resort");
        showToast("Resort added successfully!", "success");
      }
      // ✅ Trigger parent refresh after success
      if (onSaveResort) {
        onSaveResort();
      }

      setShowModal(false);
    } catch (error) {
      console.error(error);
      showToast("Something went wrong! Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!showModal) return null;

  return (
    <Dialog
      open={showModal}
      onClose={() => { }}
      disableEscapeKeyDown
      fullWidth
      maxWidth="sm"
    >
      {/* Header */}
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 1 }}
      >
        {isEditMode ? "Edit Resort" : "Add New Resort"}
        <IconButton onClick={() => setShowModal(false)}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ mt: 2 }}>
        <TextField
          fullWidth
          required
          label="Resort Name"
          name="resort_name"
          value={formData.resort_name}
          onChange={handleChange}
          sx={{ mb: 2, width: "26vw" }}
        />
        <TextField
          fullWidth
          required
          label="Island"
          name="island"
          value={formData.island}
          onChange={handleChange}
          sx={{ mb: 2, width: "26vw" }}
        />
        <TextField
          fullWidth
          required
          label="Phone Number"
          name="phone_number"
          value={formData.phone_number}
          onChange={handleChange}
          sx={{ mb: 2, width: "26vw" }}
        />
        <TextField
          fullWidth
          required
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          sx={{ mb: 2, width: "26vw" }}
        />

        <Typography variant="subtitle1" gutterBottom>
          Category
        </Typography>
        <RadioGroup row name="category" value={formData.category} onChange={handleChange}>
          <FormControlLabel value="Medianet" control={<Radio />} label="Medianet" />
          <FormControlLabel value="Ooredoo" control={<Radio />} label="Ooredoo" />
        </RadioGroup>
      </DialogContent>

      <Divider />

      <DialogActions>
        <Button onClick={() => setShowModal(false)}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!isDirty || loading}
        >
          {loading ? "Saving..." : isEditMode ? "Update" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddResortModal;