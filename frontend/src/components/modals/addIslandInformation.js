import React, { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    CircularProgress,
    FormControl,
    Autocomplete
} from '@mui/material';
import {
    Cancel as CancelIcon,
} from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { showErrorToast, showToast } from '../common/toaster';

// Import your ATOLL_ISLAND_DATA constant
import { ATOLL_ISLAND_DATA } from '../common/atollIslandData';

const AddIslandInformation = ({ open, onClose, onSave, editData }) => {
    // Form state
    const [formData, setFormData] = useState({
        islandName: '',
        atoll: '',
        dtvNoOfMarkets: '',
        dtvActive: '',
        dtvActiveUpdateTime: '',
        corporateNoOfMarkets: '',
        corporateActive: '',
        corporateActiveUpdateTime: ''
    });

    // API state
    const [loading, setLoading] = useState(false);

    // Check if form has changes
    const [hasChanges, setHasChanges] = useState(false);

    // Track initial form data for comparison
    const [initialFormData, setInitialFormData] = useState(null);

    // State for available islands based on selected atoll
    const [availableIslands, setAvailableIslands] = useState([]);

    // State for search inputs
    const [atollSearch, setAtollSearch] = useState('');
    const [islandSearch, setIslandSearch] = useState('');

    // Get all atoll names from the constant data
    const atollOptions = Object.keys(ATOLL_ISLAND_DATA);

    // Filter atolls based on search input
    const filteredAtolls = atollOptions.filter(atoll =>
        atoll.toLowerCase().includes(atollSearch.toLowerCase())
    );

    // Filter islands based on search input
    const filteredIslands = availableIslands.filter(island =>
        island.toLowerCase().includes(islandSearch.toLowerCase())
    );

    // Map database field names to form field names
    const mapDatabaseToForm = (dbData) => {
        if (!dbData) return {};

        return {
            islandName: dbData.island_name || '',
            atoll: dbData.atoll || '',
            dtvNoOfMarkets: dbData.total_dtv_markets || '',
            dtvActive: dbData.active_dtv_markets || '',
            dtvActiveUpdateTime: dbData.active_dtv_update_time ? formatTimestamp(dbData.active_dtv_update_time) : '',
            corporateNoOfMarkets: dbData.total_corporate_markets || '',
            corporateActive: dbData.active_corporate_markets || '',
            corporateActiveUpdateTime: dbData.active_corporate_update_time ? formatTimestamp(dbData.active_corporate_update_time) : ''
        };
    };

    // Format timestamp from database to readable format
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    // Update available islands when atoll changes
    useEffect(() => {
        if (formData.atoll && ATOLL_ISLAND_DATA[formData.atoll]) {
            setAvailableIslands(ATOLL_ISLAND_DATA[formData.atoll]);
        } else {
            setAvailableIslands([]);
        }
    }, [formData.atoll]);

    // Check if form has changes
    const checkForChanges = () => {
        if (!editData) {
            setHasChanges(true); // Always enabled for new entries
            return;
        }

        // If initialFormData is not set yet, no changes
        if (!initialFormData) {
            setHasChanges(false);
            return;
        }

        // Check form data changes
        const formDataChanged = Object.keys(formData).some(key => {
            return formData[key] !== initialFormData[key];
        });

        setHasChanges(formDataChanged);
    };

    // Reset form when modal opens/closes or editData changes
    useEffect(() => {
        if (open) {
            if (editData) {
                const mappedData = mapDatabaseToForm(editData);
                setFormData(mappedData);
                setInitialFormData(mappedData);
                setHasChanges(false);

                // Set available islands based on edit data
                if (mappedData.atoll && ATOLL_ISLAND_DATA[mappedData.atoll]) {
                    setAvailableIslands(ATOLL_ISLAND_DATA[mappedData.atoll]);
                }
            } else {
                setFormData({
                    islandName: '',
                    atoll: '',
                    dtvNoOfMarkets: '',
                    dtvActive: '',
                    dtvActiveUpdateTime: '',
                    corporateNoOfMarkets: '',
                    corporateActive: '',
                    corporateActiveUpdateTime: ''
                });
                setInitialFormData(null);
                setAvailableIslands([]);
                setHasChanges(true); // Always enabled for new entries
            }
            // Reset search inputs when modal opens
            setAtollSearch('');
            setIslandSearch('');
        }
    }, [open, editData]);

    // Check for changes whenever form data changes
    useEffect(() => {
        checkForChanges();
    }, [formData]);

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle atoll change - reset island name when atoll changes
    const handleAtollChange = (event, value) => {
        setFormData(prev => ({
            ...prev,
            atoll: value || '',
            islandName: '' // Reset island name when atoll changes
        }));
        setAtollSearch(value || '');
    };

    // Handle island name change
    const handleIslandChange = (event, value) => {
        setFormData(prev => ({
            ...prev,
            islandName: value || ''
        }));
        setIslandSearch(value || '');
    };

    // Handle atoll search input change
    const handleAtollSearchChange = (event, value) => {
        setAtollSearch(value);
    };

    // Handle island search input change
    const handleIslandSearchChange = (event, value) => {
        setIslandSearch(value);
    };

    // Get current timestamp in readable format
    const getCurrentTimestamp = () => {
        const now = new Date();
        return now.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    // Handle DTV Active change with timestamp
    const handleDtvActiveChange = (e) => {
        const value = parseInt(e.target.value) || 0;
        if (value <= formData.dtvNoOfMarkets) {
            setFormData(prev => ({
                ...prev,
                dtvActive: value,
                dtvActiveUpdateTime: getCurrentTimestamp()
            }));
        }
    };

    // Handle Corporate Active change with timestamp
    const handleCorporateActiveChange = (e) => {
        const value = parseInt(e.target.value) || 0;
        if (value <= formData.corporateNoOfMarkets) {
            setFormData(prev => ({
                ...prev,
                corporateActive: value,
                corporateActiveUpdateTime: getCurrentTimestamp()
            }));
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.islandName || !formData.atoll) {
            showErrorToast('Island Name and Atoll are required fields', 'error');
            return;
        }

        setLoading(true);

        try {
            const payload = {
                ...formData
            };

            if (editData && editData.island_id) {
                payload.island_id = editData.island_id;
            }

            const endpoint = editData
                ? `${process.env.REACT_APP_LOCALHOST}/statistics/updateIslandInformation`
                : `${process.env.REACT_APP_LOCALHOST}/statistics/addIslandInformation`;

            const method = editData ? 'PUT' : 'POST';

            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (method === "POST") {
                showToast("New Island created successfully!", "success");
            } else {
                showToast("Island Updated successfully!", "success");
            }

            if (onSave) {
                onSave();
            }

        } catch (error) {
            console.error('Error submitting form:', error);
            showErrorToast('Failed to save island information. Please try again')
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1300,
                p: 2
            }}
        >
            <Box
                sx={{
                    backgroundColor: 'white',
                    borderRadius: 2,
                    boxShadow: 24,
                    width: '63%', // Increased width
                    maxWidth: 1600, // Increased max width
                    maxHeight: '95vh',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Sticky Header */}
                <Box
                    sx={{
                        flexShrink: 0,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 3,
                        pb: 2,
                        borderBottom: 1,
                        borderColor: 'divider',
                        backgroundColor: 'white',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10
                    }}
                >
                    <Typography variant="h5" component="h2" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                        {editData ? 'Edit Island Information' : 'Add Island Information'}
                    </Typography>
                    <IconButton onClick={onClose} size="large">
                        <CancelIcon />
                    </IconButton>
                </Box>

                {/* Scrollable Content */}
                <Box
                    sx={{
                        flexGrow: 1,
                        overflow: 'auto',
                        p: 3
                    }}
                >
                    <form onSubmit={handleSubmit}>
                        {/* Section 1: Basic Information */}
                        <Box sx={{ mb: 4 }}>
                            <Typography sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
                                Basic Information
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                {/* Atoll Dropdown with Search */}
                                <FormControl size="small" sx={{ width: 300 }}>
                                    <Autocomplete
                                        value={formData.atoll}
                                        onChange={handleAtollChange}
                                        inputValue={atollSearch}
                                        onInputChange={handleAtollSearchChange}
                                        options={filteredAtolls}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Atoll"
                                                required
                                            />
                                        )}
                                        freeSolo={false}
                                        clearOnBlur
                                        autoComplete
                                        includeInputInList
                                    />
                                </FormControl>

                                {/* Island Name Dropdown with Search */}
                                <FormControl
                                    size="small"
                                    sx={{ width: 300 }}
                                    disabled={!formData.atoll}
                                >
                                    <Autocomplete
                                        value={formData.islandName}
                                        onChange={handleIslandChange}
                                        inputValue={islandSearch}
                                        onInputChange={handleIslandSearchChange}
                                        options={filteredIslands}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Island Name"
                                                required
                                            />
                                        )}
                                        freeSolo={false}
                                        clearOnBlur
                                        autoComplete
                                        includeInputInList
                                        disabled={!formData.atoll}
                                    />
                                </FormControl>
                            </Box>
                        </Box>

                        {/* Section 2 & 3: DTV Market and Corporate Market - Side by Side */}
                        <Box sx={{ display: 'flex', gap: 4, mb: 4, flexWrap: 'wrap' }}>
                            {/* DTV Market */}
                            <Box sx={{ flex: 1, minWidth: 300 }}>
                                <Typography sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
                                    DTV Market
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', minWidth: 180 }}>
                                            No. of DTV Markets:
                                        </Typography>
                                        <TextField
                                            name="dtvNoOfMarkets"
                                            type="number"
                                            placeholder="Enter value"
                                            value={formData.dtvNoOfMarkets}
                                            onChange={handleChange}
                                            inputProps={{ min: 0 }}
                                            size="small"
                                            sx={{ width: "8rem" }}
                                        />
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', minWidth: 180 }}>
                                                Active:
                                            </Typography>
                                            <TextField
                                                name="dtvActive"
                                                type="number"
                                                value={formData.dtvActive}
                                                onChange={handleDtvActiveChange}
                                                inputProps={{
                                                    min: 0,
                                                    max: formData.dtvNoOfMarkets
                                                }}
                                                placeholder="Enter value"
                                                size="small"
                                                sx={{ width: "8rem" }}
                                            />
                                        </Box>
                                        <Box sx={{ height: '24px' }}>
                                            {formData.dtvActiveUpdateTime && (
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: 'text.secondary',
                                                        fontStyle: 'italic',
                                                        ml: 20
                                                    }}
                                                >
                                                    Last Updated: {formData.dtvActiveUpdateTime}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>

                            {/* Corporate Market */}
                            <Box sx={{ flex: 1, minWidth: 400 }}>
                                <Typography sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
                                    Corporate Market
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', minWidth: 180 }}>
                                            No. of Corporate Markets:
                                        </Typography>
                                        <TextField
                                            name="corporateNoOfMarkets"
                                            type="number"
                                            placeholder="Enter value"
                                            value={formData.corporateNoOfMarkets}
                                            onChange={handleChange}
                                            inputProps={{ min: 0 }}
                                            size="small"
                                            sx={{ width: "8rem" }}
                                        />
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', minWidth: 180 }}>
                                                Active:
                                            </Typography>
                                            <TextField
                                                name="corporateActive"
                                                type="number"
                                                value={formData.corporateActive}
                                                onChange={handleCorporateActiveChange}
                                                inputProps={{
                                                    min: 0,
                                                    max: formData.corporateNoOfMarkets
                                                }}
                                                placeholder="Enter value"
                                                size="small"
                                                sx={{ width: "8rem" }}
                                            />
                                        </Box>
                                        <Box sx={{ height: '24px' }}>
                                            {formData.corporateActiveUpdateTime && (
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: 'text.secondary',
                                                        fontStyle: 'italic',
                                                        ml: 20
                                                    }}
                                                >
                                                    Last Updated: {formData.corporateActiveUpdateTime}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </form>
                </Box>

                {/* Sticky Footer */}
                <Box
                    sx={{
                        flexShrink: 0,
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 2,
                        p: 3,
                        pt: 2,
                        borderTop: 1,
                        borderColor: 'divider',
                        backgroundColor: 'white',
                        position: 'sticky',
                        bottom: 0,
                        zIndex: 10
                    }}
                >
                    <Button
                        type="button"
                        onClick={onClose}
                        variant="outlined"
                        size="large"
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="large"
                        onClick={handleSubmit}
                        disabled={loading || (editData && !hasChanges)}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                        {loading ? (editData ? 'Updating...' : 'Saving...') : (editData ? 'Update' : 'Save')}
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default AddIslandInformation;