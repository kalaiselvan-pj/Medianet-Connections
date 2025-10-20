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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { showToast } from "../common/toaster";

const AddResortModal = ({ showModal, setShowModal, selectedResort, onSaveResort }) => {
  const isEditMode = !!selectedResort;
  const [shake, setShake] = useState(false);

  const initialState = {
    resort_name: selectedResort?.resort_name || "",
    category: selectedResort?.category || "",
    island: selectedResort?.island || "",
    email: selectedResort?.email || "",
    phone_number: selectedResort?.phone_number || "",
    iptv_vendor: selectedResort?.iptv_vendor || "",
    distribution_model: selectedResort?.distribution_model || "",
    tvro_type: selectedResort?.tvro_type || "",
    tvro_dish: selectedResort?.tvro_dish || "",
    tv_points: selectedResort?.tv_points || "",
    horizontal_signal: selectedResort?.horizontal_signal || "",
    vertical_signal: selectedResort?.vertical_signal || "",
    horizontal_link_margin: selectedResort?.horizontal_link_margin || "",
    vertical_link_margin: selectedResort?.vertical_link_margin || "",
    signal_level_timestamp: selectedResort?.signal_level_timestamp || "",
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
    let updatedData = { ...formData, [name]: value };

    // if (name === "distribution_model") {
    //   updatedData.medianet_streamer_timestamp = new Date().toISOString();
    // }

    if (
      ["horizontal_signal", "vertical_signal", "horizontal_link_margin", "vertical_link_margin"].includes(name)
    ) {
      updatedData.signal_level_timestamp = new Date().toISOString();
    }

    setFormData(updatedData);
    setIsDirty(true);
  };

  const isFormFilled = () =>
    formData.resort_name && formData.category && formData.email && formData.phone_number;

  const handleSave = async () => {
    if (!isFormFilled()) return showToast("Please fill all required fields", "error");

    setLoading(true);
    try {
      const url = isEditMode
        ? `${process.env.REACT_APP_LOCALHOST}/statistics/updateResort/${selectedResort.resort_id}`
        : `${process.env.REACT_APP_LOCALHOST}/statistics/addResort`;

      const response = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json", // important
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save resort");

      showToast(isEditMode ? "Resort updated successfully!" : "Resort added successfully!", "success");
      if (onSaveResort) onSaveResort();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      showToast("Something went wrong!", "error");
    } finally {
      setLoading(false);
    }
  };



  const handleDialogClose = (event, reason) => {
    if (reason === "backdropClick") {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <Dialog
      open={showModal}
      onClose={handleDialogClose}
      disableEscapeKeyDown
      maxWidth={false} // allow custom width
      PaperProps={{
        sx: {
          width: "1140px",        // fixed width
          height: "600px",       // fixed height
          overflow: "hidden",    // hide outside scroll
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {isEditMode ? "Edit Resort" : "Add New Resort"}
        <IconButton onClick={() => setShowModal(false)}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Grid container spacing={9}>
          {/* Row 1 - Column 1 */}
          <Grid item xs={4} container direction="column" spacing={4}>
            <TextField
              label="Resort Name"
              name="resort_name"
              value={formData.resort_name}
              onChange={handleChange}
              fullWidth
            />
            <FormControl fullWidth>
              <Select name="category" value={formData.category} onChange={handleChange} displayEmpty>
                <MenuItem value="" disabled>Category</MenuItem>
                <MenuItem value="Medianet">Medianet</MenuItem>
                <MenuItem value="Ooredoo">Ooredoo</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              type="number"
              label="Phone Number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          {/* Row 2 - Column 2 */}
          <Grid item xs={4} container direction="column" spacing={4}>
            <TextField
              label="Island"
              name="island"
              value={formData.island}
              onChange={handleChange}
              fullWidth
            />
            <FormControl fullWidth>
              <Select
                name="distribution_model"
                value={formData.distribution_model}
                onChange={handleChange}
                displayEmpty
              >
                <MenuItem value="" disabled>Distribution Model</MenuItem>
                <MenuItem value="Medianet_Streamer">Medianet_Streamer</MenuItem>
                <MenuItem value="Analogue">Analogue</MenuItem>
                <MenuItem value="IPTV">IPTV</MenuItem>
              </Select>
            </FormControl>
            {/* 
            {formData.distribution_model === "Medianet_Streamer" && (
              <Typography variant="body2">
                Timestamp: {formData.medianet_streamer_timestamp
                  ? new Date(formData.medianet_streamer_timestamp).toLocaleString()
                  : "-"}
              </Typography>
            )} */}

            <FormControl fullWidth>
              <Select
                name="tvro_type"
                value={formData.tvro_type}
                onChange={handleChange}
                displayEmpty
              >
                <MenuItem value="" disabled>TVRO Type</MenuItem>
                <MenuItem value="MMDS">MMDS</MenuItem>
                <MenuItem value="Satellite">Satellite</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="TVRO Dish"
              name="tvro_dish"
              value={formData.tvro_dish}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          {/* Row 3 - Column 3 */}
          <Grid item xs={4} container direction="column" spacing={4}>
            <TextField
              type="number"
              label="TV Points"
              name="tv_points"
              value={formData.tv_points}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="IPTV Vendor"
              name="iptv_vendor"
              value={formData.iptv_vendor}
              onChange={handleChange}
              fullWidth
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  type="number"
                  label="Horizontal Signal"
                  name="horizontal_signal"
                  value={formData.horizontal_signal}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="number"
                  label="Vertical Signal"
                  name="vertical_signal"
                  value={formData.vertical_signal}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  type="number"
                  label="Horizontal Link Margin"
                  name="horizontal_link_margin"
                  value={formData.horizontal_link_margin}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="number"
                  label="Vertical Link Margin"
                  name="vertical_link_margin"
                  value={formData.vertical_link_margin}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
            </Grid>

            {formData.signal_level_timestamp && (
              <Typography variant="body2">
                Timestamp: {new Date(formData.signal_level_timestamp).toLocaleString()}
              </Typography>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <Divider />
      <DialogActions>
        <Button onClick={() => setShowModal(false)}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={!isDirty || loading}>
          {loading ? "Saving..." : isEditMode ? "Update" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddResortModal;