import React, { useState, useEffect } from "react";
import AddResortModal from "../components/modals/addResortModal";
import EditResortModal from "../components/modals/editResortModal";
import { Button, Dialog, DialogTitle, DialogActions, FormControl, Select, MenuItem } from "@mui/material";
import { GetApp } from "@mui/icons-material";
import { AiTwotoneEdit, AiTwotoneDelete } from "react-icons/ai";
import AddIcon from '@mui/icons-material/Add';
import "react-toastify/dist/ReactToastify.css";
import { showErrorToast, showToast } from "./common/toaster";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter } from '@fortawesome/free-solid-svg-icons';


const ListView = () => {
  const [tableData, setTableData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("Medianet");
  const [resortName, setResortName] = useState("");
  const [editResort, setEditResort] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterCategory, setFilterCategory] = useState("All");
  const [open, setOpen] = useState(false);
  const [selectedResortId, setSelectedResortId] = useState(null);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchResorts();
    setCurrentPage(1);
  }, []);

  const fetchResorts = () => {
    fetch("http://localhost:5000/statistics/getAllResorts")
      .then((res) => res.json())
      .then((fetchedResorts) => setTableData(fetchedResorts))
      .catch((err) => console.error("Error fetching resorts:", err));
  };

  const handleAddResort = () => {
    if (!resortName) {
      showErrorToast("Please enter a resort name!");
      return;
    }
    fetch("http://localhost:5000/statistics/addResort", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resort_name: resortName, category: selectedProvider }),
    })
      .then((res) => res.json())
      .then(() => {
        setShowModal(false);
        setResortName("");
        setSelectedProvider("Medianet");
        fetchResorts();
        showToast("Resort added successfully!", "success")
      })
      .catch((err) => console.error("Error adding resort:", err));
  };

  const handleEdit = (resort) => {
    setEditResort(resort);
    setSelectedProvider(resort.category);
    setResortName(resort.resort_name);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!resortName) {
      showErrorToast("Please enter a resort name!");
      return;
    }
    fetch(`http://localhost:5000/statistics/updateResort/${editResort.resort_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resort_name: resortName, category: selectedProvider }),
    })
      .then((res) => res.json())
      .then(() => {
        setShowEditModal(false);
        setEditResort(null);
        setResortName("");
        setSelectedProvider("Medianet");
        fetchResorts();
        showToast("Resort updated successfully!", "success")
      })
      .catch((err) => console.error("Error updating resort:", err));
  };

  // Open popup delete
  const handleDelete = (resort_id) => {
    setSelectedResortId(resort_id);
    setOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    fetch(`http://localhost:5000/statistics/deleteResort/${selectedResortId}`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then(() => {
        setTableData(tableData.filter((item) => item.resort_id !== selectedResortId));
        showToast("Resort deleted successfully!", "success")
        setOpen(false);
        setSelectedResortId(null);
      })
      .catch((err) => console.error("Error deleting resort:", err));
  };

  // Cancel delete
  const handleCancel = () => {
    setOpen(false);
    setSelectedResortId(null);
  };

  // Pagination & Filtering
  const filteredData = filterCategory === "All"
    ? tableData
    : tableData.filter((item) => item.category === filterCategory);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const goToPreviousPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

  const medianetCount = tableData.filter((r) => r.category === "Medianet").length;
  const ooredooCount = tableData.filter((r) => r.category === "Ooredoo").length;

  const exportToCSV = () => {
    const headers = ["No.", "Resort Name", "Category"];
    const rows = filteredData.map((item, index) => [index + 1, `"${item.resort_name}"`, item.category]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "resorts_list.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV downloaded successfully!", "success")
  };

  return (
    <div>
      {/* Filters & Buttons */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        {/* <div style={{ position: "relative", display: "inline-block", marginRight: "15px" }}>
          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
            style={{
              padding: "6px 1px 6px 40px",
              borderRadius: "10px",
              border: "1px solid #ccc",
              cursor: "pointer",
              fontWeight: "bold",
              backgroundColor: "#f0f0f0",
              appearance: "none",
              WebkitAppearance: "none",
              MozAppearance: "none",
              height: "2.3rem",
              width: "7rem"
            }}
          >
            <option value="All">All</option>
            <option value="Medianet">Medianet</option>
            <option value="Ooredoo">Ooredoo</option>
          </select>
          <FontAwesomeIcon
            icon={faFilter}
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              color: "rgb(43 142 228)",
              fontSize: "20px"
            }}
          />
        </div> */}

        <div style={{ position: "relative", display: "inline-block", marginRight: "15px" }}>
          {/* Filter icon */}
          <FontAwesomeIcon
            icon={faFilter}
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              color: "rgb(43 142 228)",
              fontSize: "20px",
              zIndex: 1
            }}
          />

          {/* MUI Select */}
          <FormControl size="small" sx={{ width: "9.3rem", }}>
            <Select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
              displayEmpty
              sx={{
                pl: 4, // space for the icon
                borderRadius: "10px",
                fontWeight: "bold",
                backgroundColor: "#f0f0f0",
                height: "2.3rem"
              }}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Medianet">Medianet</MenuItem>
              <MenuItem value="Ooredoo">Ooredoo</MenuItem>
            </Select>
          </FormControl>
        </div>

        <Button
          variant="contained"
          color="primary"
          startIcon={<GetApp />}
          onClick={exportToCSV}
          style={{ marginRight: "15px", borderRadius: "9px", textTransform: "none" }}
        >
          Download
        </Button>

        <button
          // onClick={() => setShowModal(true)}
          onClick={() => {
            setResortName("");           // Clear previous resort name
            setSelectedProvider("Medianet"); // Reset provider
            setShowModal(true);          // Open modal
          }}
          style={{ width: "6rem", backgroundColor: "#20d810ff", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "8px 12px" }}
        >
          <AddIcon fontSize="small" />
          Add
        </button>
      </div>

      {/* Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", height: "74vh" }}>
        <thead>
          <tr style={{ backgroundColor: "#569fdfff", color: "white" }}>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>No.</th>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>Resort Name</th>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>Category</th>
            <th style={{ padding: "10px", display: "flex", justifyContent: "center" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentData.map((item, index) => (
            <tr key={item.resort_id} >
              <td style={{ padding: "10px", border: "1px solid #ddd" }}>{(currentPage - 1) * itemsPerPage + index + 1}</td>
              <td style={{ padding: "10px", border: "1px solid #ddd" }}>{item.resort_name}</td>
              <td style={{ padding: "10px", border: "1px solid #ddd" }}>{item.category}</td>
              <td style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>
                <button onClick={() => handleEdit(item)} title="Edit" style={{ background: "transparent", border: "none", cursor: "pointer", marginRight: "10px", fontSize: "20px" }}>
                  <AiTwotoneEdit color="#0032e8ff" size={20} />
                </button>
                <button onClick={() => handleDelete(item.resort_id)} title="Delete" style={{ background: "transparent", border: "none", cursor: "pointer", marginRight: "10px", fontSize: "20px" }}>
                  <AiTwotoneDelete color="#fd0d0dff" size={20} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination & Summary */}
      <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "10px", borderRadius: "10px", fontWeight: "bold" }}>
          <span style={{ color: "#569fdfff", marginRight: "10px" }}>Medianet: {medianetCount}</span>
          <span style={{ color: "#569fdfff", marginInline: "10px" }}>Ooredoo: {ooredooCount}</span>
          <span style={{ color: "#638499ff", marginInline: "10px" }}>Total: {tableData.length}</span>
        </div>
        <button onClick={goToPreviousPage} disabled={currentPage === 1} style={{ padding: "8px 16px", borderRadius: "10px", border: "none", backgroundColor: "#569fdfff", color: "white", fontSize: "15px", width: "50px", height: "30px", cursor: currentPage === 1 ? "not-allowed" : "pointer" }}>◁</button>
        <span style={{ marginTop: "3px" }}>Page {currentPage} of {totalPages}</span>
        <button onClick={goToNextPage} disabled={currentPage === totalPages} style={{ padding: "8px 16px", borderRadius: "10px", border: "none", backgroundColor: "#569fdfff", color: "white", fontSize: "15px", width: "50px", height: "30px", cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}>▷</button>
      </div>

      {/* Modals */}
      <AddResortModal
        showModal={showModal}
        setShowModal={setShowModal}
        selectedProvider={selectedProvider}
        setSelectedProvider={setSelectedProvider}
        resortName={resortName}
        setResortName={setResortName}
        handleAddResort={handleAddResort}
      />
      <EditResortModal
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        selectedProvider={selectedProvider}
        setSelectedProvider={setSelectedProvider}
        resortName={resortName}
        setResortName={setResortName}
        handleSaveEdit={handleSaveEdit}

      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={open} onClose={handleCancel}>
        <DialogTitle>Are you sure you want to delete this resort?</DialogTitle>
        <DialogActions>
          <Button onClick={handleCancel} color="primary">Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ListView;


