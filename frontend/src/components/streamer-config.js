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
    TextField,
    FormLabel,
    Autocomplete,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import * as XLSX from 'xlsx';
import { showErrorToast, showToast } from './common/toaster';
import { canAccess } from '../rbac/canAccess';


// --- Main Component ---
function StreamerConfigTable() {
    const [verticalData, setVerticalData] = useState([]);
    const [horizontalData, setHorizontalData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [resorts, setResorts] = useState([]);
    const [resortName, setResortName] = useState('');
    const [dataLoaded, setDataLoaded] = useState(false);

    // Edit state management
    const [editingRow, setEditingRow] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [originalData, setOriginalData] = useState({});
    const [saving, setSaving] = useState(false);

    // Add state management
    const [addingVertical, setAddingVertical] = useState(false);
    const [addingHorizontal, setAddingHorizontal] = useState(false);
    const [newConfigData, setNewConfigData] = useState([
        { // First row - all columns editable
            channel_name: '',
            multicast_ip: '',
            port: '',
            stb_no: '',
            vc_no: '',
            trfc_ip: '',
            mngmnt_ip: '',
            strm: '',
            card: '',
        },
        { // Second row - only channel fields editable
            channel_name: '',
            multicast_ip: '',
            port: '',
            stb_no: '',
            vc_no: '',
            trfc_ip: '',
            mngmnt_ip: '',
            strm: '',
            card: '',
        },
        { // Third row - only channel fields editable
            channel_name: '',
            multicast_ip: '',
            port: '',
            stb_no: '',
            vc_no: '',
            trfc_ip: '',
            mngmnt_ip: '',
            strm: '',
            card: '',
        }
    ]);

    // Delete confirmation dialog state
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedRowToDelete, setSelectedRowToDelete] = useState(null);

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
                const url = `${process.env.REACT_APP_LOCALHOST}/statistics/getAllStreamerConfig?resort_name=${encodeURIComponent(resortName)}`;

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

    // Handle resort filter change
    const handleResortChange = (event, newValue) => {
        setResortName(newValue || "");
        setEditingRow(null); // Reset editing when changing resort
        setAddingVertical(false);
        setAddingHorizontal(false);
    };

    // Updated transformDataToTableRows function
    const transformDataToTableRows = (apiData, signalLevel) => {
        if (!apiData || apiData.length === 0) return [];

        const tableRows = [];
        let globalRowIndex = 1;

        apiData.forEach((config, configIndex) => {
            // Get the actual number of channels from the first array (channel_name)
            // This ensures we only render rows that actually have data
            const numChannels = config.channel_name?.length || 0;

            // Only create rows for channels that actually exist
            for (let i = 0; i < numChannels; i++) {
                tableRows.push({
                    id: `${config.streamer_config_id}-${i}-${signalLevel}`,
                    configIndex: configIndex,
                    channelIndex: i,
                    streamer_config_id: config.streamer_config_id,
                    no: globalRowIndex++, // Use global row index for serial numbers
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
                    signal_level: signalLevel,
                    originalConfig: config,
                    isFirstRowOfConfig: i === 0,
                    configId: config.streamer_config_id,
                });
            }

            // Add gap after each complete configuration (except the last one)
            if (configIndex < apiData.length - 1) {
                tableRows.push({
                    id: `gap-${config.streamer_config_id}-${signalLevel}`,
                    isGap: true
                });
            }
        });

        return tableRows;
    };

    // Combine vertical and horizontal data with section headers
    const getAllTableRows = () => {
        const verticalRows = transformDataToTableRows(verticalData, 'vertical');
        const horizontalRows = transformDataToTableRows(horizontalData, 'horizontal');

        const allRows = [];

        // Add vertical section header
        if (verticalRows.length > 0 || addingVertical) {
            allRows.push({
                id: 'vertical-header',
                isSectionHeader: true,
                sectionName: 'VERTICAL'
            });
            allRows.push(...verticalRows);
        }

        // Add horizontal section header
        if (horizontalRows.length > 0 || addingHorizontal) {
            allRows.push({
                id: 'horizontal-header',
                isSectionHeader: true,
                sectionName: 'HORIZONTAL'
            });
            allRows.push(...horizontalRows);
        }

        return allRows;
    };

    // Add new configuration functions
    const handleAddClick = (section) => {
        if (section === 'vertical') {
            setAddingVertical(true);
        } else {
            setAddingHorizontal(true);
        }

        // Reset new config data
        setNewConfigData([
            { channel_name: '', multicast_ip: '', port: '', stb_no: '', vc_no: '', trfc_ip: '', mngmnt_ip: '', strm: '', card: '' },
            { channel_name: '', multicast_ip: '', port: '', stb_no: '', vc_no: '', trfc_ip: '', mngmnt_ip: '', strm: '', card: '' },
            { channel_name: '', multicast_ip: '', port: '', stb_no: '', vc_no: '', trfc_ip: '', mngmnt_ip: '', strm: '', card: '' }
        ]);
    };

    const handleAddCancel = () => {
        setAddingVertical(false);
        setAddingHorizontal(false);
        setNewConfigData([
            { channel_name: '', multicast_ip: '', port: '', stb_no: '', vc_no: '', trfc_ip: '', mngmnt_ip: '', strm: '', card: '' },
            { channel_name: '', multicast_ip: '', port: '', stb_no: '', vc_no: '', trfc_ip: '', mngmnt_ip: '', strm: '', card: '' },
            { channel_name: '', multicast_ip: '', port: '', stb_no: '', vc_no: '', trfc_ip: '', mngmnt_ip: '', strm: '', card: '' }
        ]);
    };

    const handleAddSave = async () => {
        try {
            setSaving(true);

            const signalLevel = addingVertical ? 'vertical' : 'horizontal';

            // Prepare channel arrays from the three rows - include empty values too
            const channel_name = newConfigData.map(row => ({ key: row.channel_name || '' }));
            const multicast_ip = newConfigData.map(row => ({ key: row.multicast_ip || '' }));
            const port = newConfigData.map(row => ({ key: row.port || '' }));

            const payload = {
                resort_name: resortName,
                channel_name: channel_name,
                multicast_ip: multicast_ip,
                port: port,
                stb_no: newConfigData[0].stb_no, // Only first row has these values
                vc_no: newConfigData[0].vc_no,
                trfc_ip: newConfigData[0].trfc_ip,
                mngmnt_ip: newConfigData[0].mngmnt_ip,
                strm: newConfigData[0].strm,
                card: newConfigData[0].card,
                signal_level: signalLevel
            };

            const response = await fetch(`${process.env.REACT_APP_LOCALHOST}/statistics/addStreamerConfig`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            await response.json();

            // Refresh data
            const url = `${process.env.REACT_APP_LOCALHOST}/statistics/getAllStreamerConfig?resort_name=${encodeURIComponent(resortName)}`;
            const refreshResponse = await fetch(url);
            const data = await refreshResponse.json();
            setVerticalData(data.vertical || []);
            setHorizontalData(data.horizontal || []);

            // Reset add state
            handleAddCancel();

            // Show success message
            showToast('Streamer configuration added successfully!');

        } catch (err) {
            console.error('Error adding data:', err);
            showErrorToast(`Error adding data: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleNewInputChange = (rowIndex, field, value) => {
        setNewConfigData(prev => {
            const updated = [...prev];
            updated[rowIndex] = {
                ...updated[rowIndex],
                [field]: value
            };

            // Only copy config-wide fields from first row to other rows, don't copy channel-specific fields
            if (rowIndex === 0 && ['stb_no', 'vc_no', 'trfc_ip', 'mngmnt_ip', 'strm', 'card'].includes(field)) {
                // Update all rows with the same config-wide field values (for data consistency)
                // But they will not be visible in the UI for rows 2 and 3
                for (let i = 1; i < updated.length; i++) {
                    updated[i] = {
                        ...updated[i],
                        [field]: value
                    };
                }
            }

            return updated;
        });
    };

    // Edit row functions
    const handleEditClick = (row) => {
        setEditingRow(row.id);

        // Determine which data source to use
        const currentData = row.signal_level === 'vertical' ? verticalData : horizontalData;
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
            channelIndex: row.channelIndex,
            signal_level: row.signal_level
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

            // Determine which data source to use
            const currentData = row.signal_level === 'vertical' ? verticalData : horizontalData;
            const setDataFunction = row.signal_level === 'vertical' ? setVerticalData : setHorizontalData;
            const configToUpdate = currentData[row.configIndex];

            if (!configToUpdate) {
                throw new Error('Configuration not found');
            }

            // Create a deep copy of the original config to modify
            const updatedConfig = JSON.parse(JSON.stringify(configToUpdate));

            // Update channel-specific arrays (channel_name, multicast_ip, port)
            if (row.channelIndex < updatedConfig.channel_name.length) {
                updatedConfig.channel_name[row.channelIndex].key = editFormData.channel_name;
            } else {
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
                resort_name: row.resort_name,
                channel_name: updatedConfig.channel_name,
                multicast_ip: updatedConfig.multicast_ip,
                port: updatedConfig.port,
                stb_no: updatedConfig.stb_no,
                vc_no: updatedConfig.vc_no,
                trfc_ip: updatedConfig.trfc_ip,
                mngmnt_ip: updatedConfig.mngmnt_ip,
                strm: updatedConfig.strm,
                card: updatedConfig.card,
                signal_level: updatedConfig.signal_level
            };

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

            await response.json();

            // Update local state with the complete updated config
            const updatedData = [...currentData];
            updatedData[row.configIndex] = updatedConfig;
            setDataFunction(updatedData);

            setEditingRow(null);
            setEditFormData({});
            setOriginalData({});

            // Show success message
            showToast('streamer configuration updated successfully!');

        } catch (err) {
            console.error('Error updating data:', err);
            showErrorToast(`Error updating data: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    // Delete confirmation handler
    const confirmDelete = (row) => {
        setSelectedRowToDelete(row);
        setOpenDeleteDialog(true);
    };

    // NEW DELETE LOGIC: Generate empty row after deletion
    // const handleDelete = async () => {
    //     if (!selectedRowToDelete) return;

    //     try {
    //         setSaving(true);

    //         const row = selectedRowToDelete;
    //         const signalLevel = row.signal_level;
    //         const currentData = signalLevel === 'vertical' ? verticalData : horizontalData;
    //         const setDataFunction = signalLevel === 'vertical' ? setVerticalData : setHorizontalData;

    //         // If this is the last channel in the configuration, we need to handle it differently
    //         const configIndex = row.configIndex;
    //         const configToDeleteFrom = currentData[configIndex];
    //         const totalChannels = configToDeleteFrom.channel_name?.length || 0;

    //         if (totalChannels <= 1) {
    //             // If this is the last channel, delete the entire configuration from backend
    //             const response = await fetch(`${process.env.REACT_APP_LOCALHOST}/statistics/deleteStreamerConfig/${row.streamer_config_id}`, {
    //                 method: 'DELETE',
    //                 headers: {
    //                     'Content-Type': 'application/json',
    //                 },
    //                 body: JSON.stringify({ channel_index: row.channelIndex })
    //             });

    //             if (!response.ok) {
    //                 const errorText = await response.text();
    //                 throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    //             }

    //             await response.json();

    //             // Refresh data to get the updated structure
    //             const refreshUrl = `${process.env.REACT_APP_LOCALHOST}/statistics/getAllStreamerConfig?resort_name=${encodeURIComponent(resortName)}`;
    //             const refreshResponse = await fetch(refreshUrl);
    //             const data = await refreshResponse.json();
    //             setVerticalData(data.vertical || []);
    //             setHorizontalData(data.horizontal || []);

    //             showToast('Configuration deleted successfully!');
    //         } else {
    //             // If there are multiple channels, delete only the specific channel
    //             const payload = {
    //                 channel_index: row.channelIndex
    //             };

    //             const response = await fetch(`${process.env.REACT_APP_LOCALHOST}/statistics/deleteStreamerConfig/${row.streamer_config_id}`, {
    //                 method: 'DELETE',
    //                 headers: {
    //                     'Content-Type': 'application/json',
    //                 },
    //                 body: JSON.stringify(payload)
    //             });

    //             if (!response.ok) {
    //                 const errorText = await response.text();
    //                 throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    //             }

    //             await response.json();

    //             // After successful deletion, create a new empty row in the same configuration
    //             const updatedData = [...currentData];
    //             const updatedConfig = JSON.parse(JSON.stringify(configToDeleteFrom));

    //             // Remove the deleted channel
    //             updatedConfig.channel_name.splice(row.channelIndex, 1);
    //             updatedConfig.multicast_ip.splice(row.channelIndex, 1);
    //             updatedConfig.port.splice(row.channelIndex, 1);

    //             // Add empty channel at the end
    //             updatedConfig.channel_name.push({ key: '' });
    //             updatedConfig.multicast_ip.push({ key: '' });
    //             updatedConfig.port.push({ key: '' });

    //             updatedData[configIndex] = updatedConfig;
    //             setDataFunction(updatedData);

    //             showToast('Channel deleted successfully! Empty row added.');
    //         }

    //         setOpenDeleteDialog(false);
    //         setSelectedRowToDelete(null);

    //     } catch (err) {
    //         console.error('Error deleting data:', err);
    //         showErrorToast(`Error deleting data: ${err.message}`);
    //     } finally {
    //         setSaving(false);
    //     }
    // };

    // NEW DELETE LOGIC: Generate empty row after deletion
    const handleDelete = async () => {
        if (!selectedRowToDelete) return;

        try {
            setSaving(true);

            const row = selectedRowToDelete;
            const signalLevel = row.signal_level;
            const currentData = signalLevel === 'vertical' ? verticalData : horizontalData;
            const setDataFunction = signalLevel === 'vertical' ? setVerticalData : setHorizontalData;

            const configIndex = row.configIndex;
            const configToDeleteFrom = currentData[configIndex];
            const totalChannels = configToDeleteFrom.channel_name?.length || 0;

            // NEW CONDITION: Check if there's only one row with actual data
            const countNonEmptyRows = () => {
                let count = 0;
                for (let i = 0; i < totalChannels; i++) {
                    const channelName = configToDeleteFrom.channel_name?.[i]?.key || '';
                    const multicastIp = configToDeleteFrom.multicast_ip?.[i]?.key || '';
                    const port = configToDeleteFrom.port?.[i]?.key || '';

                    // If any of the main fields has data, consider it a non-empty row
                    if (channelName.trim() !== '' || multicastIp.trim() !== '' || port.trim() !== '') {
                        count++;
                    }
                }
                return count;
            };

            const nonEmptyRowCount = countNonEmptyRows();

            // If this is the last non-empty row, delete the entire configuration
            if (totalChannels <= 1 || nonEmptyRowCount <= 1) {
                // Delete the entire configuration from backend
                const response = await fetch(`${process.env.REACT_APP_LOCALHOST}/statistics/deleteStreamerConfig/${row.streamer_config_id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ channel_index: row.channelIndex })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                }

                await response.json();

                // Refresh data to get the updated structure
                const refreshUrl = `${process.env.REACT_APP_LOCALHOST}/statistics/getAllStreamerConfig?resort_name=${encodeURIComponent(resortName)}`;
                const refreshResponse = await fetch(refreshUrl);
                const data = await refreshResponse.json();
                setVerticalData(data.vertical || []);
                setHorizontalData(data.horizontal || []);

                showToast('Configuration deleted successfully!');
            } else {
                // If there are multiple non-empty rows, delete only the specific channel
                const payload = {
                    channel_index: row.channelIndex
                };

                const response = await fetch(`${process.env.REACT_APP_LOCALHOST}/statistics/deleteStreamerConfig/${row.streamer_config_id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                }

                await response.json();

                // After successful deletion, create a new empty row in the same configuration
                const updatedData = [...currentData];
                const updatedConfig = JSON.parse(JSON.stringify(configToDeleteFrom));

                // Remove the deleted channel
                updatedConfig.channel_name.splice(row.channelIndex, 1);
                updatedConfig.multicast_ip.splice(row.channelIndex, 1);
                updatedConfig.port.splice(row.channelIndex, 1);

                // Add empty channel at the end
                updatedConfig.channel_name.push({ key: '' });
                updatedConfig.multicast_ip.push({ key: '' });
                updatedConfig.port.push({ key: '' });

                updatedData[configIndex] = updatedConfig;
                setDataFunction(updatedData);

                showToast('Channel deleted successfully! Empty row added.');
            }

            setOpenDeleteDialog(false);
            setSelectedRowToDelete(null);

        } catch (err) {
            console.error('Error deleting data:', err);
            showErrorToast(`Error deleting data: ${err.message}`);
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

    // Check if new config data is valid
    const isNewConfigValid = () => {
        // First row must have all required fields
        const firstRow = newConfigData[0];
        return firstRow.channel_name.trim() !== '' &&
            firstRow.multicast_ip.trim() !== '' &&
            firstRow.port.trim() !== '' &&
            firstRow.stb_no.trim() !== '' &&
            firstRow.vc_no.trim() !== '';
    };

    // Updated Export function with single gap between configurations
    const exportToExcel = () => {
        // Create a new transformation function for Excel that shows only data rows and single gaps
        const transformDataForExcelWithStructure = (apiData, startNumber = 1) => {
            if (!apiData || apiData.length === 0) return { data: [], nextNumber: startNumber };

            const excelRows = [];
            let currentNumber = startNumber;

            apiData.forEach((config, configIndex) => {
                const configRows = [];
                let hasAnyDataInConfig = false;

                // Process all 3 rows for this configuration
                for (let i = 0; i < 3; i++) {
                    const channelName = config.channel_name?.[i]?.key || '';
                    const multicastIp = config.multicast_ip?.[i]?.key || '';
                    const port = config.port?.[i]?.key || '';
                    const stbNo = i === 0 ? config.stb_no || '' : '';
                    const vcNo = i === 0 ? config.vc_no || '' : '';
                    const trfcIp = i === 0 ? config.trfc_ip || '' : '';
                    const mngmntIp = i === 0 ? config.mngmnt_ip || '' : '';
                    const strm = i === 0 ? config.strm || '' : '';
                    const card = i === 0 ? config.card || '' : '';

                    // Check if this row has any data
                    const hasData = channelName.trim() !== '' ||
                        multicastIp.trim() !== '' ||
                        port.trim() !== '' ||
                        stbNo.trim() !== '' ||
                        vcNo.trim() !== '' ||
                        trfcIp.trim() !== '' ||
                        mngmntIp.trim() !== '' ||
                        strm.trim() !== '' ||
                        card.trim() !== '';

                    if (hasData) {
                        hasAnyDataInConfig = true;
                        configRows.push({
                            "NO": currentNumber++,
                            "CHANNEL NAME": channelName,
                            "MULTICAST IP": multicastIp,
                            "PORT": port,
                            "STB NO": stbNo,
                            "VC NO": vcNo,
                            "TRFC IP": trfcIp,
                            "MNGMNT IP": mngmntIp,
                            "STRM": strm,
                            "CARD": card,
                            "configGroup": configIndex,
                            "hasData": true
                        });
                    }
                    // If no data, don't add empty row to Excel
                }

                // Only add this configuration if it has at least one row with data
                if (hasAnyDataInConfig) {
                    excelRows.push(...configRows);

                    // Add single empty row (gap) after each complete configuration (except the last one)
                    if (configIndex < apiData.length - 1) {
                        // Check if next configuration has data
                        const nextConfigHasData = apiData[configIndex + 1] &&
                            (apiData[configIndex + 1].channel_name?.some(ch => ch?.key?.trim() !== '') ||
                                apiData[configIndex + 1].multicast_ip?.some(ip => ip?.key?.trim() !== '') ||
                                apiData[configIndex + 1].port?.some(p => p?.key?.trim() !== '') ||
                                apiData[configIndex + 1].stb_no?.trim() !== '' ||
                                apiData[configIndex + 1].vc_no?.trim() !== '');

                        if (nextConfigHasData) {
                            excelRows.push({}); // Single empty object creates one gap row
                        }
                    }
                }
            });

            return { data: excelRows, nextNumber: currentNumber };
        };

        // Transform data with proper numbering and single gaps
        const verticalResult = transformDataForExcelWithStructure(verticalData, 1);
        const horizontalResult = transformDataForExcelWithStructure(horizontalData, verticalResult.nextNumber);

        if (verticalResult.data.length === 0 && horizontalResult.data.length === 0) {
            showErrorToast("No data to export.");
            return;
        }

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();

        // Define column headers
        const columnHeaders = [
            "NO",
            "CHANNEL NAME",
            "MULTICAST IP",
            "PORT",
            "STB NO",
            "VC NO",
            "TRFC IP",
            "MNGMNT IP",
            "STRM",
            "CARD"
        ];

        // Start building the data array
        const allData = [];

        // Add VERTICAL section
        if (verticalResult.data.length > 0) {
            // Add VERTICAL header
            allData.push(["VERTICAL"]);
            // Add column headers
            allData.push(columnHeaders);
            // Add vertical data with single gaps
            verticalResult.data.forEach((row) => {
                // Check if this is a gap row (empty object)
                if (Object.keys(row).length === 0) {
                    allData.push([]); // Single empty array for gap
                } else {
                    const rowData = columnHeaders.map(header => row[header] || '');
                    allData.push(rowData);
                }
            });
            // Add empty row between sections if horizontal data exists
            if (horizontalResult.data.length > 0) {
                allData.push([]);
            }
        }

        // Add HORIZONTAL section
        if (horizontalResult.data.length > 0) {
            // Add HORIZONTAL header
            allData.push(["HORIZONTAL"]);
            // Add column headers
            allData.push(columnHeaders);
            // Add horizontal data with single gaps
            horizontalResult.data.forEach((row) => {
                // Check if this is a gap row (empty object)
                if (Object.keys(row).length === 0) {
                    allData.push([]); // Single empty array for gap
                } else {
                    const rowData = columnHeaders.map(header => row[header] || '');
                    allData.push(rowData);
                }
            });
        }

        // Create worksheet from array of arrays
        const ws = XLSX.utils.aoa_to_sheet(allData);

        // Get the range of the worksheet
        const range = XLSX.utils.decode_range(ws['!ref']);

        // Apply styling
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const address = XLSX.utils.encode_cell({ r: R, c: C });
                if (!ws[address]) {
                    ws[address] = { t: 's', v: '' };
                }

                const cellValue = allData[R] ? allData[R][C] : '';
                const isSectionHeader = R === 0 || (verticalResult.data.length > 0 && R === 1);
                const isColumnHeader = (verticalResult.data.length > 0 && R === 1) ||
                    (horizontalResult.data.length > 0 && R === (verticalResult.data.length > 0 ? allData.findIndex(row => row[0] === "HORIZONTAL") : 1));

                if (isSectionHeader && C === 0 && cellValue === "VERTICAL") {
                    // Style for VERTICAL header
                    ws[address].s = {
                        font: {
                            bold: true,
                            sz: 14,
                        },
                        alignment: {
                            horizontal: 'left',
                            vertical: 'center'
                        },
                        fill: {
                            fgColor: { rgb: "E3F2FD" }
                        }
                    };
                } else if (isSectionHeader && C === 0 && cellValue === "HORIZONTAL") {
                    // Style for HORIZONTAL header
                    ws[address].s = {
                        font: {
                            bold: true,
                            sz: 14,
                        },
                        alignment: {
                            horizontal: 'left',
                            vertical: 'center'
                        },
                        fill: {
                            fgColor: { rgb: "E3F2FD" }
                        }
                    };
                } else if (isColumnHeader && cellValue) {
                    // Style for column headers
                    ws[address].s = {
                        font: {
                            bold: true,
                            sz: 12,
                        },
                        alignment: {
                            horizontal: 'center',
                            vertical: 'center'
                        },
                        fill: {
                            fgColor: { rgb: "D0D0D0" }
                        },
                        border: {
                            top: { style: 'thin', color: { rgb: "000000" } },
                            left: { style: 'thin', color: { rgb: "000000" } },
                            bottom: { style: 'thin', color: { rgb: "000000" } },
                            right: { style: 'thin', color: { rgb: "000000" } }
                        }
                    };
                } else if (R > 1 && cellValue !== undefined && cellValue !== '') {
                    // Style for data rows (only if they have content)
                    ws[address].s = {
                        font: {
                            sz: 11
                        },
                        alignment: {
                            horizontal: C === 0 ? 'center' : 'left',
                            vertical: 'center'
                        },
                        border: {
                            top: { style: 'thin', color: { rgb: "000000" } },
                            left: { style: 'thin', color: { rgb: "000000" } },
                            bottom: { style: 'thin', color: { rgb: "000000" } },
                            right: { style: 'thin', color: { rgb: "000000" } }
                        }
                    };
                }
            }
        }

        // Set column widths for better readability
        const colWidths = [
            { wch: 8 },   // NO
            { wch: 30 },  // CHANNEL NAME
            { wch: 20 },  // MULTICAST IP
            { wch: 12 },  // PORT
            { wch: 25 },  // STB NO
            { wch: 15 },  // VC NO
            { wch: 15 },  // TRFC IP
            { wch: 15 },  // MNGMNT IP
            { wch: 12 },  // STRM
            { wch: 12 },  // CARD
        ];
        ws['!cols'] = colWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, "Streamer Configuration");

        // Generate Excel file and trigger download
        const filename = resortName ? `streamer_config_${resortName.replace(/\s+/g, '_')}.xlsx` : 'streamer_config_all_data.xlsx';
        XLSX.writeFile(wb, filename);
    };

    const allTableRows = getAllTableRows();

    // Function to render add rows (3 rows for new configuration)
    const renderAddRows = (section) => {
        const isAdding = section === 'vertical' ? addingVertical : addingHorizontal;

        if (!isAdding) return null;

        return newConfigData.map((rowData, rowIndex) => (
            <TableRow
                key={`add-${section}-${rowIndex}`}
                sx={{
                    backgroundColor: '#f0f7ff',
                    '& td': {
                        padding: '8px 8px',
                        borderRight: '1px solid #e0e0e0',
                        borderBottom: '1px solid #e0e0e0',
                        fontSize: '0.85rem',
                    },
                }}
            >
                <TableCell align="center" sx={{ borderRight: '2px solid #e0e0e0' }}>
                    {rowIndex === 0 ? 'NEW' : ''}
                </TableCell>

                {/* CHANNEL NAME - Always editable for all 3 rows */}
                <TableCell>
                    <TextField
                        value={rowData.channel_name}
                        onChange={(e) => handleNewInputChange(rowIndex, 'channel_name', e.target.value)}
                        size="small"
                        fullWidth
                        variant="outlined"
                        placeholder="Enter channel name"
                        sx={{ minWidth: '120px' }} // Add this
                    />
                </TableCell>

                {/* MULTICAST IP - Always editable for all 3 rows */}
                <TableCell>
                    <TextField
                        value={rowData.multicast_ip}
                        onChange={(e) => handleNewInputChange(rowIndex, 'multicast_ip', e.target.value)}
                        size="small"
                        fullWidth
                        variant="outlined"
                        placeholder="Enter multicast IP"
                    />
                </TableCell>

                {/* PORT - Always editable for all 3 rows */}
                <TableCell align="center">
                    <TextField
                        value={rowData.port}
                        onChange={(e) => handleNewInputChange(rowIndex, 'port', e.target.value)}
                        size="small"
                        fullWidth
                        variant="outlined"
                        placeholder="Enter port"
                        sx={{ minWidth: '100px' }} // Add this
                    />
                </TableCell>

                {/* STB NO - Only editable and visible in first row */}
                <TableCell>
                    {rowIndex === 0 ? (
                        <TextField
                            value={rowData.stb_no}
                            onChange={(e) => handleNewInputChange(rowIndex, 'stb_no', e.target.value)}
                            size="small"
                            fullWidth
                            variant="outlined"
                            placeholder="Enter STB number"
                        />
                    ) : (
                        <Box sx={{
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#999',
                            fontStyle: 'italic'
                        }}>
                            {/* Empty for rows 2 and 3 */}
                        </Box>
                    )}
                </TableCell>

                {/* VC NO - Only editable and visible in first row */}
                <TableCell>
                    {rowIndex === 0 ? (
                        <TextField
                            value={rowData.vc_no}
                            onChange={(e) => handleNewInputChange(rowIndex, 'vc_no', e.target.value)}
                            size="small"
                            fullWidth
                            variant="outlined"
                            placeholder="Enter VC number"
                            sx={{ minWidth: '155px' }} // Add this

                        />
                    ) : (
                        <Box sx={{
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#999',
                            fontStyle: 'italic'
                        }}>
                            {/* Empty for rows 2 and 3 */}
                        </Box>
                    )}
                </TableCell>

                {/* TRFC IP - Only editable and visible in first row */}
                <TableCell>
                    {rowIndex === 0 ? (
                        <TextField
                            value={rowData.trfc_ip}
                            onChange={(e) => handleNewInputChange(rowIndex, 'trfc_ip', e.target.value)}
                            size="small"
                            fullWidth
                            variant="outlined"
                            placeholder="Enter TRFC IP"
                        />
                    ) : (
                        <Box sx={{
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#999',
                            fontStyle: 'italic'
                        }}>
                            {/* Empty for rows 2 and 3 */}
                        </Box>
                    )}
                </TableCell>

                {/* MNGMNT IP - Only editable and visible in first row */}
                <TableCell>
                    {rowIndex === 0 ? (
                        <TextField
                            value={rowData.mngmnt_ip}
                            onChange={(e) => handleNewInputChange(rowIndex, 'mngmnt_ip', e.target.value)}
                            size="small"
                            fullWidth
                            variant="outlined"
                            placeholder="Enter management IP"
                            sx={{ minWidth: '190px' }} // Add this
                        />
                    ) : (
                        <Box sx={{
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#999',
                            fontStyle: 'italic'
                        }}>
                            {/* Empty for rows 2 and 3 */}
                        </Box>
                    )}
                </TableCell>

                {/* STRM - Only editable and visible in first row */}
                <TableCell align="center">
                    {rowIndex === 0 ? (
                        <TextField
                            value={rowData.strm}
                            onChange={(e) => handleNewInputChange(rowIndex, 'strm', e.target.value)}
                            size="small"
                            fullWidth
                            variant="outlined"
                            placeholder="Enter STRM"
                            sx={{ minWidth: '120px' }} // Add this
                        />
                    ) : (
                        <Box sx={{
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#999',
                            fontStyle: 'italic'
                        }}>
                            {/* Empty for rows 2 and 3 */}
                        </Box>
                    )}
                </TableCell>

                {/* CARD - Only editable and visible in first row */}
                <TableCell align="center">
                    {rowIndex === 0 ? (
                        <TextField
                            value={rowData.card}
                            onChange={(e) => handleNewInputChange(rowIndex, 'card', e.target.value)}
                            size="small"
                            fullWidth
                            variant="outlined"
                            placeholder="Enter CARD"
                            sx={{ minWidth: '120px' }} // Add this
                        />
                    ) : (
                        <Box sx={{
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#999',
                            fontStyle: 'italic'
                        }}>
                            {/* Empty for rows 2 and 3 */}
                        </Box>
                    )}
                </TableCell>

                {/* ACTIONS - Only show in first row */}
                <TableCell
                    align="center"
                    sx={{
                        position: 'sticky',
                        right: 0,
                        backgroundColor: '#f0f7ff',
                        zIndex: 2,
                        borderLeft: '2px solid #e0e0e0',
                        boxShadow: '-2px 0 4px rgba(0,0,0,0.1)',
                        minWidth: '120px',
                    }}
                >
                    {rowIndex === 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                            <Tooltip title="Save">
                                <IconButton
                                    color="primary"
                                    size="small"
                                    onClick={handleAddSave}
                                    disabled={saving || !isNewConfigValid()}
                                >
                                    {saving ? <CircularProgress size={20} /> : <SaveIcon />}
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Cancel">
                                <IconButton
                                    color="secondary"
                                    size="small"
                                    onClick={handleAddCancel}
                                    disabled={saving}
                                >
                                    <CancelIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    )}
                </TableCell>
            </TableRow>
        ));
    };

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
                            disabled={!dataLoaded || (verticalData.length === 0 && horizontalData.length === 0)}
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

            {/* Rest of the component */}
            {!resortName && !loading && (
                <Alert severity="info" sx={{ m: 2 }}>
                    Please select or enter a resort name to load streamer configuration data.
                </Alert>
            )}

            {loading && (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <CircularProgress />
                    <Box ml={2}>Loading streamer data for {resortName}...</Box>
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ m: 2 }}>
                    Error loading data for {resortName}: {error}
                </Alert>
            )}

            {dataLoaded && !loading && resortName && (
                <>
                    {(allTableRows.length === 0 && !addingVertical && !addingHorizontal) ? (
                        <Alert severity="info" sx={{ m: 2 }}>
                            No streamer data available for resort: {resortName}.
                        </Alert>
                    ) : null}

                    {/* Always show the table when resort is selected and data is loaded */}
                    <Box>
                        <TableContainer
                            component={Paper}
                            sx={{
                                boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
                                borderRadius: '4px',
                                maxHeight: '67vh',
                                overflow: 'auto',
                                position: 'relative',
                                mt: 2
                            }}
                        >
                            <Table
                                stickyHeader
                                sx={{
                                    minWidth: 1500,
                                    '& .MuiTableCell-root': {
                                        fontSize: '0.85rem',
                                    },
                                    '& .MuiTableHead-root': {
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 10,
                                    },
                                }}
                                size="small"
                            >
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
                                            zIndex: 11,
                                        }
                                    }}>
                                        <TableCell align="center" sx={{
                                            width: '80px', // Increased from 60px
                                            backgroundColor: 'rgb(86, 159, 223) !important',
                                            color: 'white',
                                        }}>NO</TableCell>

                                        <TableCell sx={{
                                            minWidth: '200px', // Increased from 120px
                                            backgroundColor: 'rgb(86, 159, 223) !important',
                                            color: 'white'
                                        }}>CHANNEL NAME</TableCell>

                                        <TableCell sx={{
                                            minWidth: '155px', // Increased from 120px
                                            backgroundColor: 'rgb(86, 159, 223) !important',
                                            color: 'white'
                                        }}>MULTICAST IP</TableCell>

                                        <TableCell align="center" sx={{
                                            width: '130px', // Increased from 80px
                                            backgroundColor: 'rgb(86, 159, 223) !important',
                                            color: 'white'
                                        }}>PORT</TableCell>

                                        <TableCell sx={{
                                            minWidth: '180px', // Increased from 150px
                                            backgroundColor: 'rgb(86, 159, 223) !important',
                                            color: 'white'
                                        }}>STB NO</TableCell>

                                        <TableCell sx={{
                                            minWidth: '120px', // Increased from 100px
                                            backgroundColor: 'rgb(86, 159, 223) !important',
                                            color: 'white'
                                        }}>VC NO</TableCell>

                                        <TableCell sx={{
                                            minWidth: '150px', // Increased from 120px
                                            backgroundColor: 'rgb(86, 159, 223) !important',
                                            color: 'white'
                                        }}>TRFC IP</TableCell>

                                        <TableCell sx={{
                                            minWidth: '150px', // Increased from 120px
                                            backgroundColor: 'rgb(86, 159, 223) !important',
                                            color: 'white'
                                        }}>MNGMNT IP</TableCell>

                                        <TableCell align="center" sx={{
                                            width: '80px', // Increased from 60px
                                            backgroundColor: 'rgb(86, 159, 223) !important',
                                            color: 'white'
                                        }}>STRM</TableCell>

                                        <TableCell align="center" sx={{
                                            width: '80px', // Increased from 60px
                                            backgroundColor: 'rgb(86, 159, 223) !important',
                                            color: 'white'
                                        }}>CARD</TableCell>

                                        {canAccess("streamerConfig", "edit") && (
                                            <TableCell
                                                align="center"
                                                sx={{
                                                    width: '140px', // Increased from 120px
                                                    position: 'sticky',
                                                    right: 0,
                                                    backgroundColor: 'rgb(86, 159, 223) !important',
                                                    color: 'white',
                                                    zIndex: 12,
                                                    borderLeft: '2px solid #e0e0e0',
                                                    boxShadow: '-2px 0 4px rgba(0,0,0,0.1)',
                                                }}
                                            >
                                                ACTIONS
                                            </TableCell>
                                        )}
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {/* ALWAYS RENDER VERTICAL SECTION */}
                                    <>
                                        {/* Vertical Header - ALWAYS SHOW */}
                                        <TableRow>
                                            <TableCell
                                                colSpan={canAccess("streamerConfig", "edit") ? 11 : 10}
                                                sx={{
                                                    backgroundColor: '#e3f2fd',
                                                    fontWeight: 'bold',
                                                    textAlign: 'center',
                                                    fontSize: '1rem',
                                                    borderBottom: '2px solid #90caf9'
                                                }}
                                            >
                                                VERTICAL
                                            </TableCell>
                                        </TableRow>

                                        {/* Vertical Data Rows - Show if data exists */}
                                        {verticalData.length > 0 && transformDataToTableRows(verticalData, 'vertical').map((row, index, array) => (
                                            <React.Fragment key={row.id}>
                                                {/* Render gap row if this is a gap */}
                                                {row.isGap ? (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={canAccess("streamerConfig", "edit") ? 11 : 10}
                                                            sx={{
                                                                height: '16px',
                                                                backgroundColor: '#fafafa',
                                                                border: 'none'
                                                            }}
                                                        />
                                                    </TableRow>
                                                ) : (
                                                    /* Data row */
                                                    <TableRow
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
                                                        <TableCell align="center" sx={{ borderRight: '2px solid #e0e0e0' }}>
                                                            {row.no}
                                                        </TableCell>

                                                        <TableCell>
                                                            {editingRow === row.id ? (
                                                                <TextField
                                                                    value={editFormData.channel_name || ''}
                                                                    onChange={(e) => handleInputChange('channel_name', e.target.value)}
                                                                    size="small"
                                                                    fullWidth
                                                                    variant="outlined"
                                                                    sx={{ minWidth: '120px' }} // Add this
                                                                />
                                                            ) : (
                                                                row.channel_name
                                                            )}
                                                        </TableCell>

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
                                                                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                                                        <Tooltip title="Edit">
                                                                            <IconButton
                                                                                color="primary"
                                                                                size="small"
                                                                                onClick={() => handleEditClick(row)}
                                                                            >
                                                                                <EditIcon />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                        <Tooltip title="Delete">
                                                                            <IconButton
                                                                                color="error"
                                                                                size="small"
                                                                                onClick={() => confirmDelete(row)}
                                                                            >
                                                                                <DeleteIcon />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    </Box>
                                                                )}
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        ))}

                                        {/* Show message if no vertical data exists */}
                                        {verticalData.length === 0 && !addingVertical && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={canAccess("streamerConfig", "edit") ? 11 : 10}
                                                    align="center"
                                                    sx={{
                                                        padding: '20px',
                                                        fontStyle: 'italic',
                                                        color: '#666'
                                                    }}
                                                >
                                                    No vertical configurations found
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {/* Add gap before add form if there are existing rows */}
                                        {verticalData.length > 0 && addingVertical && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={canAccess("streamerConfig", "edit") ? 11 : 10}
                                                    sx={{
                                                        height: '16px',
                                                        backgroundColor: '#fafafa',
                                                        border: 'none'
                                                    }}
                                                />
                                            </TableRow>
                                        )}

                                        {/* Vertical Add Rows */}
                                        {renderAddRows('vertical')}

                                        {/* Vertical Add Button - ALWAYS VISIBLE */}
                                        {canAccess("streamerConfig", "edit") && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={canAccess("streamerConfig", "edit") ? 11 : 10}
                                                    align="center"
                                                    sx={{
                                                        backgroundColor: '#f5f5f5',
                                                        borderBottom: '2px solid #e0e0e0',
                                                        padding: '16px'
                                                    }}
                                                >
                                                    <Button
                                                        variant="outlined"
                                                        startIcon={<AddIcon />}
                                                        onClick={() => handleAddClick('vertical')}
                                                        disabled={addingVertical}
                                                        sx={{
                                                            textTransform: "none",
                                                            borderColor: addingVertical ? '#cccccc' : '#1976d2',
                                                            color: addingVertical ? '#cccccc' : '#1976d2',
                                                            '&:hover': !addingVertical ? {
                                                                backgroundColor: '#1976d2',
                                                                color: 'white'
                                                            } : {},
                                                            '&:disabled': {
                                                                backgroundColor: 'transparent'
                                                            }
                                                        }}
                                                    >
                                                        Add New Vertical Configuration
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </>

                                    {/* ALWAYS RENDER HORIZONTAL SECTION */}
                                    <>
                                        {/* Horizontal Header - ALWAYS SHOW */}
                                        <TableRow>
                                            <TableCell
                                                colSpan={canAccess("streamerConfig", "edit") ? 11 : 10}
                                                sx={{
                                                    backgroundColor: '#e3f2fd',
                                                    fontWeight: 'bold',
                                                    textAlign: 'center',
                                                    fontSize: '1rem',
                                                    borderBottom: '2px solid #90caf9'
                                                }}
                                            >
                                                HORIZONTAL
                                            </TableCell>
                                        </TableRow>

                                        {/* Horizontal Data Rows - Show if data exists */}
                                        {horizontalData.length > 0 && transformDataToTableRows(horizontalData, 'horizontal').map((row, index, array) => (
                                            <React.Fragment key={row.id}>
                                                {/* Render gap row if this is a gap */}
                                                {row.isGap ? (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={canAccess("streamerConfig", "edit") ? 11 : 10}
                                                            sx={{
                                                                height: '16px',
                                                                backgroundColor: '#fafafa',
                                                                border: 'none'
                                                            }}
                                                        />
                                                    </TableRow>
                                                ) : (
                                                    /* Data row */
                                                    <TableRow
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
                                                        <TableCell align="center" sx={{ borderRight: '2px solid #e0e0e0' }}>
                                                            {row.no}
                                                        </TableCell>

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
                                                                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                                                        <Tooltip title="Edit">
                                                                            <IconButton
                                                                                color="primary"
                                                                                size="small"
                                                                                onClick={() => handleEditClick(row)}
                                                                            >
                                                                                <EditIcon />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                        <Tooltip title="Delete">
                                                                            <IconButton
                                                                                color="error"
                                                                                size="small"
                                                                                onClick={() => confirmDelete(row)}
                                                                            >
                                                                                <DeleteIcon />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    </Box>
                                                                )}
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        ))}

                                        {/* Show message if no horizontal data exists */}
                                        {horizontalData.length === 0 && !addingHorizontal && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={canAccess("streamerConfig", "edit") ? 11 : 10}
                                                    align="center"
                                                    sx={{
                                                        padding: '20px',
                                                        fontStyle: 'italic',
                                                        color: '#666'
                                                    }}
                                                >
                                                    No horizontal configurations found
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {/* Add gap before add form if there are existing rows */}
                                        {horizontalData.length > 0 && addingHorizontal && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={canAccess("streamerConfig", "edit") ? 11 : 10}
                                                    sx={{
                                                        height: '16px',
                                                        backgroundColor: '#fafafa',
                                                        border: 'none'
                                                    }}
                                                />
                                            </TableRow>
                                        )}

                                        {/* Horizontal Add Rows */}
                                        {renderAddRows('horizontal')}

                                        {/* Horizontal Add Button - ALWAYS VISIBLE */}
                                        {canAccess("streamerConfig", "edit") && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={canAccess("streamerConfig", "edit") ? 11 : 10}
                                                    align="center"
                                                    sx={{
                                                        backgroundColor: '#f5f5f5',
                                                        borderBottom: '2px solid #e0e0e0',
                                                        padding: '16px'
                                                    }}
                                                >
                                                    <Button
                                                        variant="outlined"
                                                        startIcon={<AddIcon />}
                                                        onClick={() => handleAddClick('horizontal')}
                                                        disabled={addingHorizontal}
                                                        sx={{
                                                            textTransform: "none",
                                                            borderColor: addingHorizontal ? '#cccccc' : '#1976d2',
                                                            color: addingHorizontal ? '#cccccc' : '#1976d2',
                                                            '&:hover': !addingHorizontal ? {
                                                                backgroundColor: '#1976d2',
                                                                color: 'white'
                                                            } : {},
                                                            '&:disabled': {
                                                                backgroundColor: 'transparent'
                                                            }
                                                        }}
                                                    >
                                                        Add New Horizontal Configuration
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>
                    Are you sure you want to delete {selectedRowToDelete?.channel_name ? `"${selectedRowToDelete.channel_name}"` : 'this channel'}?
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        {selectedRowToDelete && (() => {
                            const currentData = selectedRowToDelete.signal_level === 'vertical' ? verticalData : horizontalData;
                            const config = currentData[selectedRowToDelete.configIndex];
                            const totalChannels = config?.channel_name?.length || 0;

                            if (totalChannels <= 1) {
                                return "This is the last channel in this configuration. The entire configuration will be deleted.";
                            } else {
                                return "This channel will be deleted and an empty row will be added to the configuration.";
                            }
                        })()}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setOpenDeleteDialog(false)}
                        color="primary"
                        disabled={saving}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDelete}
                        color="error"
                        variant="contained"
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={16} /> : <DeleteIcon />}
                    >
                        {saving ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default StreamerConfigTable;