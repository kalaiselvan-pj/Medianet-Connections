import React from "react";

const AddResortModal = ({
  showModal,
  setShowModal,
  selectedProvider,
  setSelectedProvider,
  resortName,
  setResortName,
  handleAddResort
}) => {
  if (!showModal) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "16px 3px 31px 5px",
          borderRadius: "10px",
          width: "400px",
          textAlign: "center",
        }}
      >
        <h3>Add New Resort</h3>

        {/* Provider Select */}
        <label style={{ display: "block", marginTop: "20px", fontWeight: "600", marginRight: "13rem" }}>
          Select Provider
        </label>
        <select
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value)}
          style={{
            padding: "10px",
            marginTop: "8px",
            width: "80%",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        >
          <option value="Medianet">Medianet</option>
          <option value="Ooredoo">Ooredoo</option>
        </select>

        {/* Resort Name Input */}
        <label style={{ display: "block", marginTop: "20px", fontWeight: "600", marginRight: "14rem" }}>
          Resort Name
        </label>
        <input
          type="text"
          placeholder="Enter a Resort Name"
          value={resortName}
          // onChange={(e) => setResortName(e.target.value)}
          onChange={(e) => {
            const val = e.target.value;
            // Uppercase first character, keep rest as typed
            setResortName(val.charAt(0).toUpperCase() + val.slice(1));
          }}
          style={{
            marginTop: "8px",
            padding: "10px",
            width: "75%",
            borderRadius: "6px",
            border: "1px solid #ccc",
            textTransform: "capitalize"
          }}
        />

        {/* Buttons */}
        <div
          style={{
            marginTop: "30px",
            display: "flex",
            justifyContent: "flex-end",
            gap: "1rem"
          }}
        >
          <button
            onClick={() => setShowModal(false)}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#ccc",
              cursor: "pointer",
              marginLeft: "40px",
              fontSize: "1rem",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleAddResort}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#569fdfff",
              color: "white",
              cursor: "pointer",
              marginRight: "40px",
              fontSize: "1rem",
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddResortModal;
