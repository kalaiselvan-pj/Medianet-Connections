import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Alert,
    Box,
    Typography,
    Button,
    Tabs,
    Tab,
    TextField,
    FormLabel,
    Autocomplete,
    IconButton,
    Tooltip
} from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import * as XLSX from 'xlsx';
import { showErrorToast, showToast } from './common/toaster';
import { canAccess } from '../rbac/canAccess';

// --- Excel Helper Function - Exact match to image format ---
const transformDataForExcel = (apiData, type) => {
    if (!apiData || apiData.length === 0) return [];

    const excelRows = [];

    apiData.forEach((config, configIndex) => {
        // Get the maximum number of channels to determine how many rows we need
        const maxChannels = Math.max(
            config.channel_name?.length || 0,
            config.multicast_ip?.length || 0,
            config.port?.length || 0
        );

        // Create rows for each channel
        for (let i = 0; i < maxChannels; i++) {
            excelRows.push({
                "NO": i === 0 ? configIndex + 1 : '',
                "SIGNAL LEVEL": i === 0 ? type : '', // Show type in VERTICAL and HORIZONTAL
                "CHANNEL NAME": config.channel_name?.[i]?.key || '',
                "MULTICAST IP": config.multicast_ip?.[i]?.key || '',
                "PORT": config.port?.[i]?.key || '',
                "STB NO": i === 0 ? config.stb_no || '' : '',
                "VC NO": i === 0 ? config.vc_no || '' : '',
                "TRFC IP": i === 0 ? config.trfc_ip || '' : '',
                "MNGMNT IP": i === 0 ? config.mngmnt_ip || '' : '',
                "STRM": i === 0 ? config.strm || '' : '',
                "CARD": i === 0 ? config.card || '' : '',
            });
        }
    });

    return excelRows;
};

// --- Main Component ---
function StreamerConfigTable() {
    const [verticalData, setVerticalData] = useState([]);
    const [horizontalData, setHorizontalData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    const [resorts, setResorts] = useState([]);
    const [resortName, setResortName] = useState('');
    const [dataLoaded, setDataLoaded] = useState(false);

    // Edit state management
    const [editingRow, setEditingRow] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [originalData, setOriginalData] = useState({});
    const [saving, setSaving] = useState(false);

    // Fetch all resorts for dropdown
    useEffect(() => {
        fetch(`${process.env.REACT_APP_LOCALHOST}/statistics/getAllResorts`)
            .then(res => res.json())
            .then(data => setResorts(data))
            .catch(err => console.error(err));
    }, []);

    // Fetch data from backend API based on resort filter
    useEffect(() => {
        const fetchStreamers = async () => {
            if (!resortName) {
                // Clear data when no resort is selected
                setVerticalData([]);
                setHorizontalData([]);
                setDataLoaded(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Construct the URL with query parameters
                const url = `${process.env.REACT_APP_LOCALHOST}/statistics/streamers/all?resort_name=${encodeURIComponent(resortName)}`;

                const response = await fetch(url, {
                    method: 'GET',
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setVerticalData(data.vertical || []);
                setHorizontalData(data.horizontal || []);
                setDataLoaded(true);
            } catch (err) {
                setError(err.message);
                console.error('Error fetching data:', err);
                setDataLoaded(false);
            } finally {
                setLoading(false);
            }
        };

        fetchStreamers();
    }, [resortName]);

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        setEditingRow(null); // Reset editing when changing tabs
    };

    // Handle resort filter change
    const handleResortChange = (event, newValue) => {
        setResortName(newValue || "");
        setEditingRow(null); // Reset editing when changing resort
    };

    // Transform API data to table format (for rendering)
    const transformDataToTableRows = (apiData) => {
        if (!apiData || apiData.length === 0) return [];

        const tableRows = [];

        apiData.forEach((config, configIndex) => {
            // Get the maximum number of channels to determine how many rows we need
            const maxChannels = Math.max(
                config.channel_name?.length || 0,
                config.multicast_ip?.length || 0,
                config.port?.length || 0
            );

            // Create rows for each channel
            for (let i = 0; i < maxChannels; i++) {
                tableRows.push({
                    id: `${config.streamer_config_id}-${i}`, // Unique ID for each row
                    configIndex: configIndex,
                    channelIndex: i,
                    streamer_config_id: config.streamer_config_id,
                    no: i === 0 ? configIndex + 1 : '',
                    channel_name: config.channel_name?.[i]?.key || '',
                    multicast_ip: config.multicast_ip?.[i]?.key || '',
                    port: config.port?.[i]?.key || '',
                    stb_no: i === 0 ? config.stb_no || '' : '',
                    vc_no: i === 0 ? config.vc_no || '' : '',
                    trfc_ip: i === 0 ? config.trfc_ip || '' : '',
                    mngmnt_ip: i === 0 ? config.mngmnt_ip || '' : '',
                    strm: i === 0 ? config.strm || '' : '',
                    card: i === 0 ? config.card || '' : '',
                    resort_name: config.resort_name,
                    signal_level: config.signal_level,
                    originalConfig: config, // Store original config for reference
                });
            }
        });

        return tableRows;
    };

    // Edit row functions - Updated to handle complete JSON structure
    const handleEditClick = (row) => {
        setEditingRow(row.id);

        // Get the complete config for this row
        const currentData = activeTab === 0 ? verticalData : horizontalData;
        const originalConfig = currentData[row.configIndex];

        // Prepare edit form data with all fields
        const formData = {
            // Channel-specific fields (arrays of objects)
            channel_name: row.channel_name,
            multicast_ip: row.multicast_ip,
            port: row.port,

            // Config-wide fields (only for first channel row)
            stb_no: row.stb_no,
            vc_no: row.vc_no,
            trfc_ip: row.trfc_ip,
            mngmnt_ip: row.mngmnt_ip,
            strm: row.strm,
            card: row.card,

            // Store the complete original config for reference
            originalConfig: originalConfig,
            channelIndex: row.channelIndex
        };

        setEditFormData(formData);
        setOriginalData(formData);
    };

    const handleCancelClick = () => {
        setEditingRow(null);
        setEditFormData({});
        setOriginalData({});
    };

    const handleSaveClick = async (row) => {
        try {
            setSaving(true);

            // Get current data
            const currentData = activeTab === 0 ? verticalData : horizontalData;
            const configToUpdate = currentData[row.configIndex];

            if (!configToUpdate) {
                throw new Error('Configuration not found');
            }

            // Create a deep copy of the original config to modify
            const updatedConfig = JSON.parse(JSON.stringify(configToUpdate));

            // Update channel-specific arrays (channel_name, multicast_ip, port)
            // These are arrays of objects like [{key: "value"}]
            if (row.channelIndex < updatedConfig.channel_name.length) {
                updatedConfig.channel_name[row.channelIndex].key = editFormData.channel_name;
            } else {
                // If channel index doesn't exist, add new entry
                updatedConfig.channel_name.push({ key: editFormData.channel_name });
            }

            if (row.channelIndex < updatedConfig.multicast_ip.length) {
                updatedConfig.multicast_ip[row.channelIndex].key = editFormData.multicast_ip;
            } else {
                updatedConfig.multicast_ip.push({ key: editFormData.multicast_ip });
            }

            if (row.channelIndex < updatedConfig.port.length) {
                updatedConfig.port[row.channelIndex].key = editFormData.port;
            } else {
                updatedConfig.port.push({ key: editFormData.port });
            }

            // Update config-wide fields (only for first channel row)
            if (row.channelIndex === 0) {
                updatedConfig.stb_no = editFormData.stb_no;
                updatedConfig.vc_no = editFormData.vc_no;
                updatedConfig.trfc_ip = editFormData.trfc_ip;
                updatedConfig.mngmnt_ip = editFormData.mngmnt_ip;
                updatedConfig.strm = editFormData.strm;
                updatedConfig.card = editFormData.card;
            }

            // Prepare the complete update payload
            const updatePayload = {
                // Remove streamer_config_id from payload since it's in URL
                resort_name: row.resort_name,
                // Send the complete arrays
                channel_name: updatedConfig.channel_name,
                multicast_ip: updatedConfig.multicast_ip,
                port: updatedConfig.port,
                // Config-wide fields
                stb_no: updatedConfig.stb_no,
                vc_no: updatedConfig.vc_no,
                trfc_ip: updatedConfig.trfc_ip,
                mngmnt_ip: updatedConfig.mngmnt_ip,
                strm: updatedConfig.strm,
                card: updatedConfig.card,
                signal_level: updatedConfig.signal_level
            };

            // ✅ FIXED: Include streamer_config_id in the URL
            const response = await fetch(`${process.env.REACT_APP_LOCALHOST}/statistics/updateStreamerConfig/${row.streamer_config_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatePayload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const result = await response.json();

            // Update local state with the complete updated config
            const updatedData = [...currentData];
            updatedData[row.configIndex] = updatedConfig;

            if (activeTab === 0) {
                setVerticalData(updatedData);
            } else {
                setHorizontalData(updatedData);
            }

            setEditingRow(null);
            setEditFormData({});
            setOriginalData({});

            // Show success message
            showToast('updated successfully!');

        } catch (err) {
            console.error('Error updating data:', err);
            showErrorToast(`Error updating data: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (field, value) => {
        setEditFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Check if any field has been modified
    const hasChanges = () => {
        if (!editFormData || !originalData) return false;

        return editFormData.channel_name !== originalData.channel_name ||
            editFormData.multicast_ip !== originalData.multicast_ip ||
            editFormData.port !== originalData.port ||
            editFormData.stb_no !== originalData.stb_no ||
            editFormData.vc_no !== originalData.vc_no ||
            editFormData.trfc_ip !== originalData.trfc_ip ||
            editFormData.mngmnt_ip !== originalData.mngmnt_ip ||
            editFormData.strm !== originalData.strm ||
            editFormData.card !== originalData.card;
    };

    // Export function to download Excel with bold headers
    const exportToExcel = () => {
        // Transform data
        const verticalExcelData = transformDataForExcel(verticalData, "VERTICAL");
        const horizontalExcelData = transformDataForExcel(horizontalData, "HORIZONTAL");

        // Combine all data
        const allData = [...verticalExcelData, ...horizontalExcelData];

        if (allData.length === 0) {
            showErrorToast("No data to export.");
            return;
        }

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(allData);

        // Get the range of the worksheet
        const range = XLSX.utils.decode_range(ws['!ref']);

        // Style the header row (make it bold)
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_cell({ r: range.s.r, c: C });
            if (!ws[address]) continue;

            // Create cell style for bold headers
            ws[address].s = {
                font: {
                    bold: true
                },
                alignment: {
                    horizontal: 'center',
                    vertical: 'center'
                },
                fill: {
                    fgColor: { rgb: "F0F0F0" } // Light gray background for headers
                },
                border: {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                }
            };
        }

        // Set column widths for better readability
        const colWidths = [
            { wch: 5 },  // NO
            { wch: 13 }, // SIGNAL LEVEL
            { wch: 20 }, // CHANNEL NAME
            { wch: 15 }, // MULTICAST IP
            { wch: 8 },  // PORT
            { wch: 20 }, // STB NO
            { wch: 12 }, // VC NO
            { wch: 12 }, // TRFC IP
            { wch: 12 }, // MNGMNT IP
            { wch: 8 },  // STRM
            { wch: 8 },  // CARD
        ];
        ws['!cols'] = colWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, "Streamer Configuration");

        // Generate Excel file and trigger download
        const filename = resortName ? `streamer_config_${resortName.replace(/\s+/g, '_')}.xlsx` : 'streamer_config_all_data.xlsx';
        XLSX.writeFile(wb, filename);
    };

    const verticalTableRows = transformDataToTableRows(verticalData);
    const horizontalTableRows = transformDataToTableRows(horizontalData);

    const currentData = activeTab === 0 ? verticalTableRows : horizontalTableRows;
    const currentDataType = activeTab === 0 ? 'vertical' : 'horizontal';
    const currentTitle = activeTab === 0 ? 'VERTICAL' : 'HORIZONTAL';

    return (
        <div className="streamer-config-table">
            {/* Filter Section */}
            <Box sx={{ paddingLeft: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
                    {/* Resort Filter */}
                    <Box >
                        <FormLabel sx={{ fontWeight: 'bold', mb: 1, display: 'block' }}>Resort Name</FormLabel>
                        <Autocomplete
                            options={resorts.map(r => r.resort_name)}
                            value={resortName}
                            onChange={handleResortChange}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="Select or type resort name to load data"
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                            sx={{ backgroundColor: 'white', width: '29vw' }}
                        />
                    </Box>

                    {/* Download Button */}
                    <Box sx={{ alignSelf: 'flex-end' }}>
                        <Button
                            variant="contained"
                            startIcon={<GetAppIcon />}
                            onClick={exportToExcel}
                            disabled={!dataLoaded || (verticalTableRows.length === 0 && horizontalTableRows.length === 0)}
                            sx={{
                                borderRadius: "9px",
                                textTransform: "none",
                                backgroundColor: "green",
                                height: 40,
                                minWidth: '140px',
                                '&:disabled': {
                                    backgroundColor: '#cccccc',
                                    color: '#666666'
                                }
                            }}
                        >
                            Download
                        </Button>
                    </Box>
                </Box>

                {/* Show current filter status */}
                {resortName && !loading && dataLoaded && (
                    <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>
                        Showing data for resort: <strong>{resortName}</strong>
                    </Typography>
                )}
            </Box>

            {/* Initial Hint - Show when no resort is selected */}
            {!resortName && !loading && (
                <Alert severity="info" sx={{ m: 2 }}>
                    Please select or enter a resort name to load streamer configuration data.
                </Alert>
            )}

            {/* Loading State */}
            {loading && (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <CircularProgress />
                    <Box ml={2}>Loading streamer data for {resortName}...</Box>
                </Box>
            )}

            {/* Error State */}
            {error && (
                <Alert severity="error" sx={{ m: 2 }}>
                    Error loading data for {resortName}: {error}
                </Alert>
            )}

            {/* Data Loaded - Show Tabs and Table */}
            {dataLoaded && !loading && resortName && (
                <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
                        {/* Tabs Section */}
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs
                                value={activeTab}
                                onChange={handleTabChange}
                                sx={{
                                    '& .MuiTab-root': {
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        minWidth: 120,
                                    },
                                    '& .Mui-selected': {
                                        color: '#1976d2',
                                    }
                                }}
                            >
                                <Tab
                                    label={`Vertical`}
                                />
                                <Tab
                                    label={`Horizontal `}
                                />
                            </Tabs>
                        </Box>
                    </Box>

                    {/* Table Section */}
                    {currentData.length === 0 ? (
                        <Alert severity="info" sx={{ m: 2 }}>
                            No {currentTitle.toLowerCase()} streamer data available for resort: {resortName}.
                        </Alert>
                    ) : (
                        <Box>
                            <TableContainer
                                component={Paper}
                                sx={{
                                    boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
                                    borderRadius: '4px',
                                    maxHeight: '67vh',
                                    overflow: 'auto',
                                    position: 'relative',
                                }}
                            >
                                <Table
                                    stickyHeader
                                    sx={{
                                        minWidth: 1300,
                                        '& .MuiTableCell-root': {
                                            fontSize: '0.85rem',
                                        },
                                        // Ensure sticky header works properly
                                        '& .MuiTableHead-root': {
                                            position: 'sticky',
                                            top: 0,
                                            zIndex: 10,
                                        },
                                    }}
                                    size="small"
                                >
                                    {/* Table Header */}
                                    <TableHead>
                                        <TableRow sx={{
                                            backgroundColor: '#f5f5f5',
                                            '& th': {
                                                fontWeight: 'bold',
                                                fontSize: '0.85rem',
                                                padding: '10px 8px',
                                                borderRight: '1px solid #e0e0e0',
                                                borderBottom: '2px solid #e0e0e0',
                                                backgroundColor: '#f5f5f5',
                                                position: 'sticky',
                                                top: 0,
                                                zIndex: 11, // Higher than TableHead
                                            }
                                        }}>
                                            <TableCell align="center" sx={{
                                                width: '60px',
                                                backgroundColor: 'rgb(86, 159, 223) !important',
                                                color: 'white',
                                            }}>NO</TableCell>

                                            <TableCell sx={{
                                                minWidth: '120px',
                                                backgroundColor: 'rgb(86, 159, 223) !important',
                                                color: 'white'
                                            }}>CHANNEL NAME</TableCell>

                                            <TableCell sx={{
                                                minWidth: '120px',
                                                backgroundColor: 'rgb(86, 159, 223) !important',
                                                color: 'white'
                                            }}>MULTICAST IP</TableCell>

                                            <TableCell align="center" sx={{
                                                width: '80px',
                                                backgroundColor: 'rgb(86, 159, 223) !important',
                                                color: 'white'
                                            }}>PORT</TableCell>

                                            <TableCell sx={{
                                                minWidth: '150px',
                                                backgroundColor: 'rgb(86, 159, 223) !important',
                                                color: 'white'
                                            }}>STB NO</TableCell>

                                            <TableCell sx={{
                                                minWidth: '100px',
                                                backgroundColor: 'rgb(86, 159, 223) !important',
                                                color: 'white'
                                            }}>VC NO</TableCell>

                                            <TableCell sx={{
                                                minWidth: '120px',
                                                backgroundColor: 'rgb(86, 159, 223) !important',
                                                color: 'white'
                                            }}>TRFC IP</TableCell>

                                            <TableCell sx={{
                                                minWidth: '120px',
                                                backgroundColor: 'rgb(86, 159, 223) !important',
                                                color: 'white'
                                            }}>MNGMNT IP</TableCell>

                                            <TableCell align="center" sx={{
                                                width: '60px',
                                                backgroundColor: 'rgb(86, 159, 223) !important',
                                                color: 'white'
                                            }}>STRM</TableCell>

                                            <TableCell align="center" sx={{
                                                width: '60px',
                                                backgroundColor: 'rgb(86, 159, 223) !important',
                                                color: 'white'
                                            }}>CARD</TableCell>

                                            {/* Sticky Actions Header */}
                                            {canAccess("streamerConfig", "edit") && (
                                                <TableCell
                                                    align="center"
                                                    sx={{
                                                        width: '120px',
                                                        position: 'sticky',
                                                        right: 0,
                                                        backgroundColor: 'rgb(86, 159, 223) !important',
                                                        color: 'white',
                                                        zIndex: 12, // Same as other sticky cells
                                                        borderLeft: '2px solid #e0e0e0',
                                                        boxShadow: '-2px 0 4px rgba(0,0,0,0.1)',
                                                    }}
                                                >
                                                    ACTIONS
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    </TableHead>

                                    {/* Table Body */}
                                    <TableBody>
                                        {currentData.map((row, index) => (
                                            <TableRow
                                                key={`${currentDataType}-${row.streamer_config_id}-${index}`}
                                                sx={{
                                                    '&:hover': {
                                                        backgroundColor: '#fafafa',
                                                    },
                                                    '& td': {
                                                        padding: '8px 8px',
                                                        borderRight: '1px solid #e0e0e0',
                                                        borderBottom: '1px solid #e0e0e0',
                                                        fontSize: '0.85rem',
                                                        backgroundColor: 'white'
                                                    },
                                                }}
                                            >
                                                {/* NO */}
                                                <TableCell align="center" sx={{

                                                    borderRight: '2px solid #e0e0e0',
                                                }}>
                                                    {row.no}
                                                </TableCell>

                                                {/* CHANNEL NAME */}
                                                <TableCell>
                                                    {editingRow === row.id ? (
                                                        <TextField
                                                            value={editFormData.channel_name || ''}
                                                            onChange={(e) => handleInputChange('channel_name', e.target.value)}
                                                            size="small"
                                                            fullWidth
                                                            variant="outlined"
                                                        />
                                                    ) : (
                                                        row.channel_name
                                                    )}
                                                </TableCell>

                                                {/* MULTICAST IP */}
                                                <TableCell sx={{ fontFamily: 'monospace' }}>
                                                    {editingRow === row.id ? (
                                                        <TextField
                                                            value={editFormData.multicast_ip || ''}
                                                            onChange={(e) => handleInputChange('multicast_ip', e.target.value)}
                                                            size="small"
                                                            fullWidth
                                                            variant="outlined"
                                                        />
                                                    ) : (
                                                        row.multicast_ip
                                                    )}
                                                </TableCell>

                                                {/* PORT */}
                                                <TableCell align="center" sx={{ fontFamily: 'monospace' }}>
                                                    {editingRow === row.id ? (
                                                        <TextField
                                                            value={editFormData.port || ''}
                                                            onChange={(e) => handleInputChange('port', e.target.value)}
                                                            size="small"
                                                            fullWidth
                                                            variant="outlined"
                                                        />
                                                    ) : (
                                                        row.port
                                                    )}
                                                </TableCell>

                                                {/* STB NO */}
                                                <TableCell sx={{ fontFamily: 'monospace' }}>
                                                    {editingRow === row.id ? (
                                                        <TextField
                                                            value={editFormData.stb_no || ''}
                                                            onChange={(e) => handleInputChange('stb_no', e.target.value)}
                                                            size="small"
                                                            fullWidth
                                                            variant="outlined"
                                                            disabled={row.channelIndex !== 0}
                                                        />
                                                    ) : (
                                                        row.stb_no
                                                    )}
                                                </TableCell>

                                                {/* VC NO */}
                                                <TableCell sx={{ fontFamily: 'monospace' }}>
                                                    {editingRow === row.id ? (
                                                        <TextField
                                                            value={editFormData.vc_no || ''}
                                                            onChange={(e) => handleInputChange('vc_no', e.target.value)}
                                                            size="small"
                                                            fullWidth
                                                            variant="outlined"
                                                            disabled={row.channelIndex !== 0}
                                                        />
                                                    ) : (
                                                        row.vc_no
                                                    )}
                                                </TableCell>

                                                {/* TRFC IP */}
                                                <TableCell sx={{ fontFamily: 'monospace' }}>
                                                    {editingRow === row.id ? (
                                                        <TextField
                                                            value={editFormData.trfc_ip || ''}
                                                            onChange={(e) => handleInputChange('trfc_ip', e.target.value)}
                                                            size="small"
                                                            fullWidth
                                                            variant="outlined"
                                                            disabled={row.channelIndex !== 0}
                                                        />
                                                    ) : (
                                                        row.trfc_ip
                                                    )}
                                                </TableCell>

                                                {/* MNGMNT IP */}
                                                <TableCell sx={{ fontFamily: 'monospace' }}>
                                                    {editingRow === row.id ? (
                                                        <TextField
                                                            value={editFormData.mngmnt_ip || ''}
                                                            onChange={(e) => handleInputChange('mngmnt_ip', e.target.value)}
                                                            size="small"
                                                            fullWidth
                                                            variant="outlined"
                                                            disabled={row.channelIndex !== 0}
                                                        />
                                                    ) : (
                                                        row.mngmnt_ip
                                                    )}
                                                </TableCell>

                                                {/* STRM */}
                                                <TableCell align="center">
                                                    {editingRow === row.id ? (
                                                        <TextField
                                                            value={editFormData.strm || ''}
                                                            onChange={(e) => handleInputChange('strm', e.target.value)}
                                                            size="small"
                                                            fullWidth
                                                            variant="outlined"
                                                            disabled={row.channelIndex !== 0}
                                                        />
                                                    ) : (
                                                        row.strm
                                                    )}
                                                </TableCell>

                                                {/* CARD */}
                                                <TableCell align="center">
                                                    {editingRow === row.id ? (
                                                        <TextField
                                                            value={editFormData.card || ''}
                                                            onChange={(e) => handleInputChange('card', e.target.value)}
                                                            size="small"
                                                            fullWidth
                                                            variant="outlined"
                                                            disabled={row.channelIndex !== 0}
                                                        />
                                                    ) : (
                                                        row.card
                                                    )}
                                                </TableCell>

                                                {/* Sticky Actions Cell */}
                                                {canAccess("streamerConfig", "edit") && (
                                                    <TableCell
                                                        align="center"
                                                        sx={{
                                                            position: 'sticky',
                                                            right: 0,
                                                            backgroundColor: editingRow === row.id ? '#f0f7ff' : 'white',
                                                            zIndex: 2,
                                                            borderLeft: '2px solid #e0e0e0',
                                                            boxShadow: '-2px 0 4px rgba(0,0,0,0.1)',
                                                            minWidth: '120px',
                                                        }}
                                                    >
                                                        {editingRow === row.id ? (
                                                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                                                <Tooltip title="Save">
                                                                    <IconButton
                                                                        color="primary"
                                                                        size="small"
                                                                        onClick={() => handleSaveClick(row)}
                                                                        disabled={saving || !hasChanges()}
                                                                    >
                                                                        {saving ? <CircularProgress size={20} /> : <SaveIcon />}
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Cancel">
                                                                    <IconButton
                                                                        color="secondary"
                                                                        size="small"
                                                                        onClick={handleCancelClick}
                                                                        disabled={saving}
                                                                    >
                                                                        <CancelIcon />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Box>
                                                        ) : (
                                                            <Tooltip title="Edit">
                                                                <IconButton
                                                                    color="primary"
                                                                    size="small"
                                                                    onClick={() => handleEditClick(row)}
                                                                >
                                                                    <EditIcon />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
                </>
            )}
        </div>
    );
}

export default StreamerConfigTable;