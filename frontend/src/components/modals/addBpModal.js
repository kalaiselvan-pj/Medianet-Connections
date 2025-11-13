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
    FormControlLabel,
    Radio,
    RadioGroup,
    InputAdornment,
    Fade,
    Autocomplete,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DescriptionIcon from "@mui/icons-material/Description";
import SearchIcon from "@mui/icons-material/Search";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import { showToast } from "../common/toaster";

const AddBPModal = ({ showModal, setShowModal, selectedBP, onSaveBP }) => {
    const isEditMode = !!selectedBP;
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        register_name: "",
        register_number: "",
        service_provider: "",
        olt_owner: "",
        network_type: "",
        fiber_coax_convertor: "",
        island: "",
        // New TVRO fields
        tvro_type: "",
        dish_type: "",
        dish_brand: "",
        dish_antena_size: "",
        // New Signal fields
        horizontal_signal: "",
        vertical_signal: "",
        horizontal_link_margin: "",
        vertical_link_margin: "",
    });

    const [contacts, setContacts] = useState([]);
    const [editingIndex, setEditingIndex] = useState(null);
    const [adding, setAdding] = useState(false);
    const [newContact, setNewContact] = useState({ name: "", email: "", phone: "", designation: "" });
    const [islands, setIslands] = useState([]);

    // Add states for island search and filtering
    const [islandSearchTerm, setIslandSearchTerm] = useState('');
    const [filteredIslands, setFilteredIslands] = useState([]);
    const [selectedIsland, setSelectedIsland] = useState(null);

    // File upload states - Changed from PDF to CSV
    const [islandAttachFile, setIslandAttachFile] = useState(null);
    const [islandAttachUrl, setIslandAttachUrl] = useState(null);

    // New file upload states
    const [surveyFormFile, setSurveyFormFile] = useState(null);
    const [surveyFormUrl, setSurveyFormUrl] = useState(null);
    const [networkDiagramFile, setNetworkDiagramFile] = useState(null);
    const [networkDiagramUrl, setNetworkDiagramUrl] = useState(null);
    const [dishAntenaImageFile, setDishAntenaImageFile] = useState(null);
    const [dishAntenaImageUrl, setDishAntenaImageUrl] = useState(null);

    // Track if files have been changed or removed
    const [filesChanged, setFilesChanged] = useState({
        island_attach: false,
        survey_form: false,
        network_diagram: false,
        dish_antena_image: false
    });

    // Track removed files
    const [removedFiles, setRemovedFiles] = useState({
        island_attach: false,
        survey_form: false,
        network_diagram: false,
        dish_antena_image: false
    });

    // State for island name display
    const [islandName, setIslandName] = useState("");

    // --- Signal Timestamp State ---
    const [signalTimestamp, setSignalTimestamp] = useState("");

    // New state to track if form has been modified
    const [isFormModified, setIsFormModified] = useState(false);
    const [initialFormData, setInitialFormData] = useState(null);
    const [initialContacts, setInitialContacts] = useState([]);
    const [initialFiles, setInitialFiles] = useState({
        island_attach: null,
        survey_form: null,
        network_diagram: null,
        dish_antena_image: null
    });

    // Function to get Maldives time in MM/DD/YYYY, HH:MM:SS AM/PM format
    const getMaldivesTime = () => {
        return new Date().toLocaleString("en-US", {
            timeZone: 'Indian/Maldives',
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        });
    };

    // Function to convert ISO timestamp to Maldives time format
    const convertISOTimestamp = (isoString) => {
        if (!isoString) return "";

        try {
            const date = new Date(isoString);
            return date.toLocaleString("en-US", {
                timeZone: 'Indian/Maldives',
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true
            });
        } catch (error) {
            console.error("Error converting ISO timestamp:", error);
            return isoString; // Return original if conversion fails
        }
    };

    // Fetch islands data from the specified endpoint
    useEffect(() => {
        const fetchIslands = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_LOCALHOST}/statistics/getIslandInformations`);
                if (response.ok) {
                    const data = await response.json();
                    setIslands(data);
                    setFilteredIslands(data); // Initialize filtered islands
                } else {
                    throw new Error('Failed to fetch islands');
                }
            } catch (error) {
                console.error("Error fetching islands:", error);
                showToast("Failed to load islands data", "error");
            }
        };

        if (showModal) {
            fetchIslands();
        }
    }, [showModal]);

    // Initialize filtered islands when islands data changes
    useEffect(() => {
        setFilteredIslands(islands);
    }, [islands]);

    // Set island name for display and selected island
    useEffect(() => {
        if (formData.island && islands.length > 0) {
            const island = islands.find(item => item.island_id === formData.island);
            if (island) {
                setIslandName(island.island_name);
                setSelectedIsland(island);
            }
        } else {
            setIslandName("");
            setSelectedIsland(null);
        }
    }, [formData.island, islands]);

    // FIXED: Fetch BP details in edit mode - Use the data passed from parent instead of API call
    useEffect(() => {
        if (showModal && isEditMode && selectedBP) {
            populateFormData(selectedBP);
        }
    }, [showModal, isEditMode, selectedBP]);

    // Function to populate form data
    const populateFormData = (bpData) => {
        const initialData = {
            register_name: bpData.register_name || bpData.registerName || "",
            register_number: bpData.register_number || bpData.registerNumber || "",
            service_provider: bpData.service_provider || bpData.serviceProvider || "",
            olt_owner: bpData.olt_owner || bpData.oltOwner || "",
            network_type: bpData.network_type || bpData.networkType || "",
            fiber_coax_convertor: bpData.fiber_coax_convertor || bpData.convertor || "",
            island: bpData.island_id || bpData.island || "",
            // TVRO fields - using exact API field names
            tvro_type: bpData.tvro_type || "",
            dish_type: bpData.dish_type || "",
            dish_brand: bpData.dish_brand || "",
            dish_antena_size: bpData.dish_antena_size || "",
            // Signal fields
            horizontal_signal: bpData.horizontal_signal || "",
            vertical_signal: bpData.vertical_signal || "",
            horizontal_link_margin: bpData.horizontal_link_margin || "",
            vertical_link_margin: bpData.vertical_link_margin || "",
        };

        setFormData(initialData);
        setInitialFormData(initialData);

        // Parse contact information
        let contactData = [];
        if (bpData.contact_information) {
            try {
                if (typeof bpData.contact_information === 'string') {
                    contactData = JSON.parse(bpData.contact_information);
                } else if (Array.isArray(bpData.contact_information)) {
                    contactData = bpData.contact_information;
                }
            } catch (error) {
                console.error("Error parsing contact information:", error);
                // If parsing fails, try to handle it as array of objects
                if (Array.isArray(bpData.contact_information)) {
                    contactData = bpData.contact_information;
                }
            }
        }
        setContacts(contactData);
        setInitialContacts(contactData);

        // Set signal timestamp - Convert ISO format to Maldives time format
        const timestamp = bpData.signal_level_update_time || bpData.signal_level_timestamp || "";
        if (timestamp) {
            const formattedTimestamp = convertISOTimestamp(timestamp);
            setSignalTimestamp(formattedTimestamp);
        } else {
            setSignalTimestamp("");
        }

        // Set URLs for existing files
        if (bpData.island_attach) {
            const url = bufferToUrl(bpData.island_attach, 'text/csv');
            setIslandAttachUrl(url);
        }

        // Set URLs for new files
        if (bpData.survey_form) {
            const url = bufferToUrl(bpData.survey_form, 'application/pdf');
            setSurveyFormUrl(url);
        }
        if (bpData.network_diagram) {
            const url = bufferToUrl(bpData.network_diagram, 'application/pdf');
            setNetworkDiagramUrl(url);
        }
        if (bpData.dish_antena_image) {
            const url = bufferToUrl(bpData.dish_antena_image, 'image/jpeg');
            setDishAntenaImageUrl(url);
        }

        // Set initial files state
        setInitialFiles({
            island_attach: bpData.island_attach,
            survey_form: bpData.survey_form,
            network_diagram: bpData.network_diagram,
            dish_antena_image: bpData.dish_antena_image
        });

        // Reset file change tracking
        setFilesChanged({
            island_attach: false,
            survey_form: false,
            network_diagram: false,
            dish_antena_image: false
        });

        setRemovedFiles({
            island_attach: false,
            survey_form: false,
            network_diagram: false,
            dish_antena_image: false
        });

        // Clear any new file selections in edit mode
        setIslandAttachFile(null);
        setSurveyFormFile(null);
        setNetworkDiagramFile(null);
        setDishAntenaImageFile(null);

        // Reset form modified state
        setIsFormModified(false);
    };

    // Reset form when modal opens for add mode
    useEffect(() => {
        if (showModal && !isEditMode) {
            // Add mode - reset everything
            const emptyData = {
                register_name: "",
                register_number: "",
                service_provider: "",
                olt_owner: "",
                network_type: "",
                fiber_coax_convertor: "",
                island: "",
                // New TVRO fields
                tvro_type: "",
                dish_type: "",
                dish_brand: "",
                dish_antena_size: "",
                // New Signal fields
                horizontal_signal: "",
                vertical_signal: "",
                horizontal_link_margin: "",
                vertical_link_margin: "",
            };

            setFormData(emptyData);
            setInitialFormData(emptyData);
            setContacts([]);
            setInitialContacts([]);
            setSignalTimestamp("");
            setIslandAttachFile(null);
            setIslandAttachUrl(null);
            setSurveyFormFile(null);
            setSurveyFormUrl(null);
            setNetworkDiagramFile(null);
            setNetworkDiagramUrl(null);
            setDishAntenaImageFile(null);
            setDishAntenaImageUrl(null);
            setFilesChanged({
                island_attach: false,
                survey_form: false,
                network_diagram: false,
                dish_antena_image: false
            });
            setRemovedFiles({
                island_attach: false,
                survey_form: false,
                network_diagram: false,
                dish_antena_image: false
            });
            setInitialFiles({
                island_attach: null,
                survey_form: null,
                network_diagram: null,
                dish_antena_image: null
            });
            setIslandName("");
            setSelectedIsland(null);

            // Reset editing states
            setEditingIndex(null);
            setAdding(false);
            setNewContact({ name: "", email: "", phone: "", designation: "" });
            // Reset search
            setIslandSearchTerm('');
            setFilteredIslands(islands);

            // In add mode, form is always considered modified since we start with empty data
            setIsFormModified(true);
        }
    }, [showModal, isEditMode, islands]);

    // Check if form has been modified
    useEffect(() => {
        if (!showModal || !initialFormData) return;

        // Check if form data has changed
        const isDataChanged = Object.keys(formData).some(key =>
            formData[key] !== initialFormData[key]
        );

        // Check if contacts have changed
        const isContactsChanged = JSON.stringify(contacts) !== JSON.stringify(initialContacts);

        // Check if files have changed
        const isFilesChanged = Object.values(filesChanged).some(value => value === true);

        setIsFormModified(isDataChanged || isContactsChanged || isFilesChanged);
    }, [formData, contacts, filesChanged, initialFormData, initialContacts, showModal]);

    // --- Signal Calculation Functions ---
    const calculateHorizontalLinkMargin = (horizontalSignal) => {
        if (!horizontalSignal || isNaN(horizontalSignal)) return "";
        const result = parseFloat(horizontalSignal) - 7.9;
        return result.toFixed(1);
    };

    const calculateVerticalLinkMargin = (verticalSignal) => {
        if (!verticalSignal || isNaN(verticalSignal)) return "";
        const result = parseFloat(verticalSignal) - 9.4;
        return result.toFixed(1);
    };

    const handleSignalChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => {
            const updatedFormData = { ...prev, [name]: value };

            // Calculate link margins automatically
            if (name === "horizontal_signal") {
                updatedFormData.horizontal_link_margin = calculateHorizontalLinkMargin(value);
            } else if (name === "vertical_signal") {
                updatedFormData.vertical_link_margin = calculateVerticalLinkMargin(value);
            }

            return updatedFormData;
        });

        // Use Maldives timezone
        setSignalTimestamp(getMaldivesTime());
    };

    // Handle island selection from Autocomplete
    const handleIslandChange = (event, newValue) => {
        if (newValue) {
            setFormData({ ...formData, island: newValue.island_id });
            setSelectedIsland(newValue);
            setIslandName(newValue.island_name);
        } else {
            setFormData({ ...formData, island: '' });
            setSelectedIsland(null);
            setIslandName("");
        }
    };

    // Handle island search input change
    const handleIslandInputChange = (event, newInputValue) => {
        setIslandSearchTerm(newInputValue);
        if (newInputValue) {
            const filtered = islands.filter(island =>
                island.island_name.toLowerCase().includes(newInputValue.toLowerCase())
            );
            setFilteredIslands(filtered);
        } else {
            setFilteredIslands(islands);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        // Update timestamp for signal-related fields with Maldives timezone
        if (["horizontal_signal", "vertical_signal", "horizontal_link_margin", "vertical_link_margin"].includes(name)) {
            setSignalTimestamp(getMaldivesTime());
        }
    };

    // --- File Upload Handlers ---
    const handleIslandAttachUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check for CSV file type
            if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
                setIslandAttachFile(file);
                setFilesChanged(prev => ({ ...prev, island_attach: true }));
                setRemovedFiles(prev => ({ ...prev, island_attach: false }));
                showToast("CSV file uploaded successfully!", "success");
            } else {
                showToast("Please upload a CSV file", "error");
            }
        }
    };

    const handleSurveyFormUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check for PDF file type
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                setSurveyFormFile(file);
                setFilesChanged(prev => ({ ...prev, survey_form: true }));
                setRemovedFiles(prev => ({ ...prev, survey_form: false }));
                showToast("Survey form uploaded successfully!", "success");
            } else {
                showToast("Please upload a PDF file", "error");
            }
        }
    };

    const handleNetworkDiagramUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check for PDF file type
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                setNetworkDiagramFile(file);
                setFilesChanged(prev => ({ ...prev, network_diagram: true }));
                setRemovedFiles(prev => ({ ...prev, network_diagram: false }));
                showToast("Network diagram uploaded successfully!", "success");
            } else {
                showToast("Please upload a PDF file", "error");
            }
        }
    };

    const handleDishAntenaImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check for image file types
            if (file.type.startsWith('image/') ||
                file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)) {
                setDishAntenaImageFile(file);
                setFilesChanged(prev => ({ ...prev, dish_antena_image: true }));
                setRemovedFiles(prev => ({ ...prev, dish_antena_image: false }));
                showToast("Dish antenna image uploaded successfully!", "success");
            } else {
                showToast("Please upload an image file (JPG, PNG, GIF)", "error");
            }
        }
    };

    // --- File Remove Handlers ---
    const handleRemoveIslandAttach = () => {
        setIslandAttachFile(null);
        setIslandAttachUrl(null);
        setFilesChanged(prev => ({ ...prev, island_attach: true }));
        setRemovedFiles(prev => ({ ...prev, island_attach: true }));
        showToast("CSV file removed!", "info");
    };

    const handleRemoveSurveyForm = () => {
        setSurveyFormFile(null);
        setSurveyFormUrl(null);
        setFilesChanged(prev => ({ ...prev, survey_form: true }));
        setRemovedFiles(prev => ({ ...prev, survey_form: true }));
        showToast("Survey form removed!", "info");
    };

    const handleRemoveNetworkDiagram = () => {
        setNetworkDiagramFile(null);
        setNetworkDiagramUrl(null);
        setFilesChanged(prev => ({ ...prev, network_diagram: true }));
        setRemovedFiles(prev => ({ ...prev, network_diagram: true }));
        showToast("Network diagram removed!", "info");
    };

    const handleRemoveDishAntenaImage = () => {
        setDishAntenaImageFile(null);
        setDishAntenaImageUrl(null);
        setFilesChanged(prev => ({ ...prev, dish_antena_image: true }));
        setRemovedFiles(prev => ({ ...prev, dish_antena_image: true }));
        showToast("Dish antenna image removed!", "info");
    };

    // --- File Cancel Handlers ---
    const handleCancelIslandAttach = () => {
        setIslandAttachFile(null);
        setFilesChanged(prev => ({ ...prev, island_attach: false }));
        showToast("CSV file upload cancelled", "info");
    };

    const handleCancelSurveyForm = () => {
        setSurveyFormFile(null);
        setFilesChanged(prev => ({ ...prev, survey_form: false }));
        showToast("Survey form upload cancelled", "info");
    };

    const handleCancelNetworkDiagram = () => {
        setNetworkDiagramFile(null);
        setFilesChanged(prev => ({ ...prev, network_diagram: false }));
        showToast("Network diagram upload cancelled", "info");
    };

    const handleCancelDishAntenaImage = () => {
        setDishAntenaImageFile(null);
        setFilesChanged(prev => ({ ...prev, dish_antena_image: false }));
        showToast("Dish antenna image upload cancelled", "info");
    };

    // --- Contacts Table Logic ---
    const handleAddContact = () => {
        setAdding(true);
        setNewContact({ name: "", email: "", phone: "", designation: "" });
    };

    const handleSaveNewContact = () => {
        // No validation - allow saving with empty fields
        const updatedContacts = [...contacts, newContact];
        setContacts(updatedContacts);
        setAdding(false);
        setNewContact({ name: "", email: "", phone: "", designation: "" });
        showToast("Contact added successfully!", "success");
    };

    const handleEditContact = (index) => setEditingIndex(index);

    const handleSaveEdit = (index) => {
        // No validation - allow saving with empty fields
        setEditingIndex(null);
        showToast("Contact updated successfully!", "success");
    };

    const handleDeleteContact = (index) => {
        const updatedContacts = contacts.filter((_, i) => i !== index);
        setContacts(updatedContacts);
        showToast("Contact deleted successfully!", "success");
    };

    const handleCancelNewContact = () => {
        setAdding(false);
        setNewContact({ name: "", email: "", phone: "", designation: "" });
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
    };

    // Handle dialog close to prevent closing on backdrop click
    const handleDialogClose = (event, reason) => {
        // Prevent closing when clicking backdrop
        if (reason === "backdropClick") {
            return;
        }
        // Only allow closing via cancel button or close icon
        if (reason === "escapeKeyDown") {
            return;
        }
    };

    // Handle cancel button click
    const handleCancel = () => {
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

    // Function to convert buffer to URL for viewing/downloading
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

    // Main save function
    const handleSaveBP = async () => {
        // Check for required fields - Only register name and island are required
        if (!formData.register_name || !formData.island) {
            return showToast("Please fill register name and select island", "error");
        }

        // Use Maldives timezone for formatted date
        const formattedDate = getMaldivesTime();

        // Create FormData for file uploads
        const formDataToSend = new FormData();

        // Append regular form data
        formDataToSend.append('register_name', formData.register_name);
        formDataToSend.append('register_number', formData.register_number);
        formDataToSend.append('service_provider', formData.service_provider);
        formDataToSend.append('olt_owner', formData.olt_owner);
        formDataToSend.append('network_type', formData.network_type);
        formDataToSend.append('fiber_coax_convertor', formData.fiber_coax_convertor);
        formDataToSend.append('island_id', formData.island);
        formDataToSend.append('contact_information', JSON.stringify(contacts));

        // Append TVRO fields
        formDataToSend.append('tvro_type', formData.tvro_type);
        formDataToSend.append('dish_type', formData.dish_type);
        formDataToSend.append('dish_brand', formData.dish_brand);
        formDataToSend.append('dish_antena_size', formData.dish_antena_size);

        // Append Signal fields with Maldives timestamp
        formDataToSend.append('horizontal_signal', formData.horizontal_signal);
        formDataToSend.append('vertical_signal', formData.vertical_signal);
        formDataToSend.append('horizontal_link_margin', formData.horizontal_link_margin);
        formDataToSend.append('vertical_link_margin', formData.vertical_link_margin);
        formDataToSend.append('signal_level_timestamp', signalTimestamp || formattedDate);

        if (!isEditMode) {
            formDataToSend.append('created_at', formattedDate);
        } else {
            formDataToSend.append('updated_at', formattedDate);
        }

        // FILE HANDLING LOGIC
        if (isEditMode) {
            // Add removal flags for backend
            formDataToSend.append('removed_island_attach', removedFiles.island_attach.toString());
            formDataToSend.append('removed_survey_form', removedFiles.survey_form.toString());
            formDataToSend.append('removed_network_diagram', removedFiles.network_diagram.toString());
            formDataToSend.append('removed_dish_antena_image', removedFiles.dish_antena_image.toString());

            // Island Attach File
            if (filesChanged.island_attach && islandAttachFile && !removedFiles.island_attach) {
                formDataToSend.append('island_attach', islandAttachFile);
            } else if (!filesChanged.island_attach && selectedBP.island_attach && !removedFiles.island_attach) {
                const existingFile = bufferToBlob(selectedBP.island_attach, 'text/csv');
                if (existingFile) {
                    formDataToSend.append('island_attach', existingFile, 'existing_island_attach.csv');
                }
            }

            // Survey Form
            if (filesChanged.survey_form && surveyFormFile && !removedFiles.survey_form) {
                formDataToSend.append('survey_form', surveyFormFile);
            } else if (!filesChanged.survey_form && selectedBP.survey_form && !removedFiles.survey_form) {
                const existingFile = bufferToBlob(selectedBP.survey_form, 'application/pdf');
                if (existingFile) {
                    formDataToSend.append('survey_form', existingFile, 'existing_survey_form.pdf');
                }
            }

            // Network Diagram
            if (filesChanged.network_diagram && networkDiagramFile && !removedFiles.network_diagram) {
                formDataToSend.append('network_diagram', networkDiagramFile);
            } else if (!filesChanged.network_diagram && selectedBP.network_diagram && !removedFiles.network_diagram) {
                const existingFile = bufferToBlob(selectedBP.network_diagram, 'application/pdf');
                if (existingFile) {
                    formDataToSend.append('network_diagram', existingFile, 'existing_network_diagram.pdf');
                }
            }

            // Dish Antenna Image
            if (filesChanged.dish_antena_image && dishAntenaImageFile && !removedFiles.dish_antena_image) {
                formDataToSend.append('dish_antena_image', dishAntenaImageFile);
            } else if (!filesChanged.dish_antena_image && selectedBP.dish_antena_image && !removedFiles.dish_antena_image) {
                const existingFile = bufferToBlob(selectedBP.dish_antena_image, 'image/jpeg');
                if (existingFile) {
                    formDataToSend.append('dish_antena_image', existingFile, 'existing_dish_antenna.jpg');
                }
            }
        } else {
            // Add mode - just append new files if they exist
            if (islandAttachFile) formDataToSend.append('island_attach', islandAttachFile);
            if (surveyFormFile) formDataToSend.append('survey_form', surveyFormFile);
            if (networkDiagramFile) formDataToSend.append('network_diagram', networkDiagramFile);
            if (dishAntenaImageFile) formDataToSend.append('dish_antena_image', dishAntenaImageFile);
        }

        setLoading(true);
        try {
            const url = isEditMode
                ? `${process.env.REACT_APP_LOCALHOST}/statistics/updateBusinessRegister/update/${selectedBP.bp_id || selectedBP.id}`
                : `${process.env.REACT_APP_LOCALHOST}/statistics/addBusinessRegister/add`;

            const response = await fetch(url, {
                method: isEditMode ? "PUT" : "POST",
                body: formDataToSend,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to save BP: ${errorText}`);
            }

            const result = await response.json();

            showToast(isEditMode ? "BP updated successfully!" : "BP added successfully!", "success");

            // Call the onSaveBP callback to refresh the parent component's data
            if (onSaveBP) {
                onSaveBP();
            }

            // Close the modal after successful save
            setShowModal(false);

        } catch (err) {
            console.error("Save error:", err);
            showToast("Something went wrong! " + err, "error");
        } finally {
            setLoading(false);
        }
    };

    if (!showModal) return null;

    return (
        <Dialog
            open={showModal}
            onClose={handleDialogClose}
            maxWidth={false}
            PaperProps={{ sx: { width: "1200px", height: "700px", maxHeight: "95vh", p: 2 } }}
            disableEscapeKeyDown
        >
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 10 }}>
                {isEditMode ? "Edit BP Details" : "Add New BP"}
                <IconButton onClick={handleCancel}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent>
                {loading && isEditMode ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                        <Typography variant="h6">Loading BP details...</Typography>
                    </Box>
                ) : (
                    <Grid container spacing={3}>
                        <Grid item xs={12} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            {/* BP Information Heading */}
                            <Typography variant="h6" color="primary" sx={{ mb: 2, fontWeight: 'bold' }}>
                                BP Information
                            </Typography>

                            {/* 1st Row: Island, Register Name, Register Number */}
                            <Grid container spacing={6} sx={{ mb: 2 }}>
                                <Grid item xs={12} sm={4} width={240}>
                                    <FormControl fullWidth size="small" required error={!formData.island}>
                                        <Autocomplete
                                            options={filteredIslands}
                                            getOptionLabel={(option) => option.island_name}
                                            value={selectedIsland}
                                            onChange={handleIslandChange}
                                            onInputChange={handleIslandInputChange}
                                            inputValue={islandSearchTerm}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Select Island"
                                                    placeholder="Type to search island..."
                                                    required
                                                    error={!formData.island}
                                                    helperText={!formData.island ? "Please select an island" : ""}
                                                />
                                            )}
                                            size="small"
                                            noOptionsText="No islands found"
                                            sx={{ width: '100%' }}
                                        />
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sm={4} width={240}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Register Name"
                                        name="register_name"
                                        value={formData.register_name}
                                        onChange={handleChange}
                                        required
                                        error={!formData.register_name}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={4} width={240}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Register Number"
                                        name="register_number"
                                        value={formData.register_number}
                                        onChange={handleChange}
                                    />
                                </Grid>


                                <Grid item xs={12} sm={3} width={240}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Service Provider"
                                        name="service_provider"
                                        value={formData.service_provider}
                                        onChange={handleChange}
                                    />
                                </Grid>
                            </Grid>

                            {/* 2nd Row: OLT Owner, Service Provider, Network Type, Fiber Coax Convertor */}
                            <Grid container spacing={6} sx={{ mb: 2 }}>
                                <Grid item xs={12} sm={3} width={240}>
                                    <FormControl fullWidth size="small">
                                        <Select
                                            displayEmpty
                                            name="olt_owner"
                                            value={formData.olt_owner}
                                            onChange={handleChange}
                                        >
                                            <MenuItem value="" disabled>
                                                Select OLT Owner
                                            </MenuItem>
                                            <MenuItem value="BP">BP</MenuItem>
                                            <MenuItem value="Service Provider">Service Provider</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>


                                <Grid item xs={12} sm={3} width={240}>
                                    <FormControl fullWidth size="small">
                                        <Select
                                            displayEmpty
                                            name="network_type"
                                            value={formData.network_type}
                                            onChange={handleChange}
                                        >
                                            <MenuItem value="" disabled>
                                                Select Network Type
                                            </MenuItem>
                                            <MenuItem value="FTTH">FTTH</MenuItem>
                                            <MenuItem value="Coax">Coax</MenuItem>
                                            <MenuItem value="Both">Both</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sm={3}>
                                    <FormControl component="fieldset" fullWidth>
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: 1
                                        }}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '14px' }}>
                                                Fiber Coax Convertor:
                                            </Typography>
                                            <RadioGroup
                                                row
                                                name="fiber_coax_convertor"
                                                value={formData.fiber_coax_convertor}
                                                onChange={handleChange}
                                                sx={{ display: 'inline-flex' }}
                                            >
                                                <FormControlLabel value="Yes" control={<Radio size="small" />} label="Yes" />
                                                <FormControlLabel value="No" control={<Radio size="small" />} label="No" />
                                            </RadioGroup>
                                        </Box>
                                    </FormControl>
                                </Grid>
                            </Grid>



                            {/* 4th Row: TVRO Information */}
                            <Typography variant="h6" color="primary" sx={{ mt: 1, mb: 1, fontWeight: 'bold' }}>
                                TVRO Information
                            </Typography>

                            <Grid container spacing={6} sx={{ mb: 2 }}>
                                <Grid item xs={12} sm={3} width={240}>
                                    <FormControl fullWidth size="small">
                                        <Select
                                            displayEmpty
                                            name="tvro_type"
                                            value={formData.tvro_type}
                                            onChange={handleChange}
                                        >
                                            <MenuItem value="" disabled>
                                                TVRO Type
                                            </MenuItem>
                                            <MenuItem value="MMDS">MMDS</MenuItem>
                                            <MenuItem value="Satellite">Satellite</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sm={3} width={240}>
                                    <FormControl fullWidth size="small">
                                        <Select
                                            displayEmpty
                                            name="dish_type"
                                            value={formData.dish_type}
                                            onChange={handleChange}
                                        >
                                            <MenuItem value="" disabled>
                                                Dish Type
                                            </MenuItem>
                                            <MenuItem value="Solid">Solid</MenuItem>
                                            <MenuItem value="Mesh">Mesh</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sm={3} width={240}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Dish Brand"
                                        name="dish_brand"
                                        value={formData.dish_brand}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={3} width={240}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Dish Antenna Size"
                                        name="dish_antena_size"
                                        value={formData.dish_antena_size}
                                        onChange={handleChange}
                                    />
                                </Grid>
                            </Grid>


                            {/* 3rd Row: Signal Levels */}
                            <Typography variant="h6" color="primary" sx={{ mt: 1, mb: 1, fontWeight: 'bold' }}>
                                Signal Levels
                            </Typography>

                            <Grid container spacing={6} sx={{ mb: 1 }}>
                                <Grid item xs={12} sm={3} width={240}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Horizontal Signal"
                                        name="horizontal_signal"
                                        value={formData.horizontal_signal}
                                        onChange={handleSignalChange}
                                        type="number"
                                    />
                                </Grid>

                                <Grid item xs={12} sm={3} width={240}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Horizontal Link Margin"
                                        name="horizontal_link_margin"
                                        value={formData.horizontal_link_margin}
                                        onChange={handleSignalChange}
                                        type="number"
                                        InputProps={{
                                            readOnly: true,
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={3} width={240}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Vertical Signal"
                                        name="vertical_signal"
                                        value={formData.vertical_signal}
                                        onChange={handleSignalChange}
                                        type="number"
                                    />
                                </Grid>

                                <Grid item xs={12} sm={3} width={240}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Vertical Link Margin"
                                        name="vertical_link_margin"
                                        value={formData.vertical_link_margin}
                                        onChange={handleSignalChange}
                                        type="number"
                                        InputProps={{
                                            readOnly: true,
                                        }}
                                    />
                                </Grid>
                            </Grid>

                            {/* Signal Timestamp */}
                            <Box sx={{ height: signalTimestamp ? 'auto' : '24px', mt: 1, pl: 1, mb: 1 }}>
                                {signalTimestamp && (
                                    <Typography variant="body2" color="textSecondary">
                                        Last Updated: {signalTimestamp}
                                    </Typography>
                                )}
                            </Box>

                            {/* 5th Row: Contact Information */}
                            <Box sx={{ position: "relative", mt: 2, width: "87%" }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                                        Contact Information
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
                                        maxHeight: 3 * 46,
                                        minHeight: 3 * 46,
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
                                                        textAlign: "left",
                                                        width: "25%",
                                                        position: "sticky",
                                                        top: 0,
                                                        zIndex: 2,
                                                        borderBottom: "2px solid #1e4a7a"
                                                    }}
                                                >
                                                    Designation
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
                                                    <TableCell sx={{ textAlign: "left" }}>
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
                                                                placeholder="Name "
                                                            />
                                                        ) : (
                                                            <Tooltip title={contact.name || "Empty"} arrow>
                                                                <Typography
                                                                    sx={{
                                                                        overflow: "hidden",
                                                                        textOverflow: "ellipsis",
                                                                        whiteSpace: "nowrap",
                                                                        maxWidth: "100%"
                                                                    }}
                                                                >
                                                                    {truncateText(contact.name, 15) || "-"}
                                                                </Typography>
                                                            </Tooltip>
                                                        )}
                                                    </TableCell>

                                                    {/* Email - with truncation */}
                                                    <TableCell sx={{ textAlign: "left" }}>
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
                                                                placeholder="Email"
                                                            />
                                                        ) : (
                                                            <Tooltip title={contact.email || "Empty"} arrow>
                                                                <Typography
                                                                    sx={{
                                                                        overflow: "hidden",
                                                                        textOverflow: "ellipsis",
                                                                        whiteSpace: "nowrap",
                                                                        maxWidth: "100%"
                                                                    }}
                                                                >
                                                                    {truncateText(contact.email, 20) || "-"}
                                                                </Typography>
                                                            </Tooltip>
                                                        )}
                                                    </TableCell>

                                                    {/* Phone - with truncation */}
                                                    <TableCell sx={{ textAlign: "left" }}>
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
                                                                placeholder="Phone "
                                                            />
                                                        ) : (
                                                            <Tooltip title={contact.phone || "Empty"} arrow>
                                                                <Typography
                                                                    sx={{
                                                                        overflow: "hidden",
                                                                        textOverflow: "ellipsis",
                                                                        whiteSpace: "nowrap",
                                                                        maxWidth: "100%"
                                                                    }}
                                                                >
                                                                    {truncateText(contact.phone, 12) || "-"}
                                                                </Typography>
                                                            </Tooltip>
                                                        )}
                                                    </TableCell>
                                                    {/* Designation - with truncation */}
                                                    <TableCell sx={{ textAlign: "left" }}>
                                                        {editingIndex === index ? (
                                                            <TextField
                                                                fullWidth
                                                                size="small"
                                                                value={contact.designation}
                                                                onChange={(e) => {
                                                                    const updated = [...contacts];
                                                                    updated[index].designation = e.target.value;
                                                                    setContacts(updated);
                                                                }}
                                                                placeholder="Designation "
                                                            />
                                                        ) : (
                                                            <Tooltip title={contact.designation || "Empty"} arrow>
                                                                <Typography
                                                                    sx={{
                                                                        overflow: "hidden",
                                                                        textOverflow: "ellipsis",
                                                                        whiteSpace: "nowrap",
                                                                        maxWidth: "100%"
                                                                    }}
                                                                >
                                                                    {truncateText(contact.designation, 15) || "-"}
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
                                                                    onClick={handleCancelEdit}
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
                                                            placeholder="Name "
                                                            value={newContact.name}
                                                            onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ textAlign: "center" }}>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            placeholder="Email "
                                                            value={newContact.email}
                                                            onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ textAlign: "center" }}>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            placeholder="Phone "
                                                            value={newContact.phone}
                                                            onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ textAlign: "center" }}>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            placeholder="Designation "
                                                            value={newContact.designation}
                                                            onChange={(e) => setNewContact({ ...newContact, designation: e.target.value })}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ textAlign: "center" }}>
                                                        <IconButton size="small" color="success" onClick={handleSaveNewContact}>
                                                            <SaveIcon />
                                                        </IconButton>
                                                        <IconButton size="small" color="error" onClick={handleCancelNewContact}>
                                                            <CancelIcon />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            )}

                                            {contacts.length === 0 && !adding && (
                                                <TableRow>
                                                    <TableCell colSpan={5} align="center" sx={{ fontStyle: 'italic', color: 'text.secondary', height: 88 }}>
                                                        No contacts added
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>

                            {/* 6th Row: Document Uploads */}
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="h6" color="primary" sx={{ mb: 2, fontWeight: 'bold' }}>
                                    Document & File Uploads
                                </Typography>

                                <Grid container spacing={8}>
                                    {/* Column 1 - Island Attach CSV */}
                                    <Grid item xs={12} md={3}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Button
                                                variant="contained"
                                                component="label"
                                                startIcon={<DescriptionIcon />}
                                                size="small"
                                                sx={{
                                                    minWidth: '200px',
                                                    backgroundColor: '#2e86de',
                                                    '&:hover': {
                                                        backgroundColor: '#1a5a9a',
                                                    }
                                                }}
                                            >
                                                Island Attach CSV
                                                <input
                                                    type="file"
                                                    hidden
                                                    accept=".csv,text/csv"
                                                    onChange={handleIslandAttachUpload}
                                                />
                                            </Button>
                                            {islandAttachFile && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 2 }}>
                                                    <Typography variant="body2" color="success.main">
                                                        ✓ {truncateText(islandAttachFile.name, 25)}
                                                    </Typography>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={handleCancelIslandAttach}
                                                        sx={{ p: 0.5 }}
                                                    >
                                                        <CancelIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            )}
                                            {!islandAttachFile && islandAttachUrl && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 2 }}>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        href={islandAttachUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        startIcon={<DescriptionIcon />}
                                                        sx={{
                                                            backgroundColor: '#28a745',
                                                            '&:hover': {
                                                                backgroundColor: '#1e7e34',
                                                            }
                                                        }}
                                                    >
                                                        Download CSV
                                                    </Button>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={handleRemoveIslandAttach}
                                                        sx={{ p: 0.5 }}
                                                    >
                                                        <CancelIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            )}
                                        </Box>
                                    </Grid>

                                    {/* Column 2 - Survey Form */}
                                    <Grid item xs={12} md={3}>
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
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 2 }}>
                                                    <Typography variant="body2" color="success.main">
                                                        ✓ {truncateText(surveyFormFile.name, 25)}
                                                    </Typography>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={handleCancelSurveyForm}
                                                        sx={{ p: 0.5 }}
                                                    >
                                                        <CancelIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            )}
                                            {!surveyFormFile && surveyFormUrl && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 2 }}>
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
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={handleRemoveSurveyForm}
                                                        sx={{ p: 0.5 }}
                                                    >
                                                        <CancelIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            )}
                                        </Box>
                                    </Grid>

                                    {/* Column 3 - Network Diagram */}
                                    <Grid item xs={12} md={3}>
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
                                                Network Diagram
                                                <input
                                                    type="file"
                                                    hidden
                                                    accept=".pdf,application/pdf"
                                                    onChange={handleNetworkDiagramUpload}
                                                />
                                            </Button>
                                            {networkDiagramFile && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 2 }}>
                                                    <Typography variant="body2" color="success.main">
                                                        ✓ {truncateText(networkDiagramFile.name, 25)}
                                                    </Typography>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={handleCancelNetworkDiagram}
                                                        sx={{ p: 0.5 }}
                                                    >
                                                        <CancelIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            )}
                                            {!networkDiagramFile && networkDiagramUrl && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 2 }}>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        href={networkDiagramUrl}
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
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={handleRemoveNetworkDiagram}
                                                        sx={{ p: 0.5 }}
                                                    >
                                                        <CancelIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            )}
                                        </Box>
                                    </Grid>

                                    {/* Column 4 - Dish Antenna Image */}
                                    <Grid item xs={12} md={3}>
                                        <Box sx={{ textAlign: 'center' }}>
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
                                                    onChange={handleDishAntenaImageUpload}
                                                />
                                            </Button>
                                            {dishAntenaImageFile && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 2 }}>
                                                    <Typography variant="body2" color="success.main">
                                                        ✓ {truncateText(dishAntenaImageFile.name, 25)}
                                                    </Typography>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={handleCancelDishAntenaImage}
                                                        sx={{ p: 0.5 }}
                                                    >
                                                        <CancelIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            )}
                                            {!dishAntenaImageFile && dishAntenaImageUrl && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 2 }}>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        href={dishAntenaImageUrl}
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
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={handleRemoveDishAntenaImage}
                                                        sx={{ p: 0.5 }}
                                                    >
                                                        <CancelIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            )}
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Grid>
                    </Grid>
                )}
            </DialogContent>

            <Divider />
            <DialogActions sx={{ p: 2, height: 10, gap: 2 }}>
                <Button variant="outlined" onClick={handleCancel}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSaveBP}
                    disabled={loading || (isEditMode && !isFormModified)}
                >
                    {loading ? "Saving..." : "Save BP"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddBPModal;