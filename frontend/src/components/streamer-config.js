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
    const [tsStreamerData, setTsStreamerData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [resorts, setResorts] = useState([]);
    const [selectedResort, setSelectedResort] = useState(null);
    const [streamerType, setStreamerType] = useState('');
    const [dataLoaded, setDataLoaded] = useState(false);

    // Edit state management
    const [editingRow, setEditingRow] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [originalData, setOriginalData] = useState({});
    const [saving, setSaving] = useState(false);

    // Add state management
    const [addingVertical, setAddingVertical] = useState(false);
    const [addingHorizontal, setAddingHorizontal] = useState(false);
    const [addingTs, setAddingTs] = useState(false);
    const [newConfigData, setNewConfigData] = useState([
        {
            channel_name: '',
            multicast_ip: '',
            port: '',
            frequency: '',
            stb_no: '',
            vc_no: '',
            trfc_ip: '',
            mngmnt_ip: '',
            strm: '',
            card: '',
        },
        {
            channel_name: '',
            multicast_ip: '',
            port: '',
            frequency: '',
            stb_no: '',
            vc_no: '',
            trfc_ip: '',
            mngmnt_ip: '',
            strm: '',
            card: '',
        },
        {
            channel_name: '',
            multicast_ip: '',
            port: '',
            frequency: '',
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

    useEffect(() => {
        fetch(`${process.env.REACT_APP_LOCALHOST}/statistics/getAllResorts`)
            .then(res => res.json())
            .then(data => {
                const filtered = data.filter(resort => {
                    if (!resort.streamer_types) return false;

                    const streamerType = resort.streamer_types.toString().trim();
                    return streamerType === "S2 Streamer" ||
                        streamerType === "TS Streamer" ||
                        streamerType === "s2 streamer" ||
                        streamerType === "ts streamer";
                });

                setResorts(filtered);
            })
            .catch(err => console.error(err));
    }, []);

    // Fetch data from backend API based on resort filter and streamer type
    useEffect(() => {
        const fetchStreamers = async () => {
            if (!selectedResort || !streamerType) {
                setVerticalData([]);
                setHorizontalData([]);
                setTsStreamerData([]);
                setDataLoaded(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const url = `${process.env.REACT_APP_LOCALHOST}/statistics/getAllStreamerConfig?resort_id=${encodeURIComponent(selectedResort.resort_id)}&streamer_type=${encodeURIComponent(streamerType)}`;

                const response = await fetch(url, {
                    method: 'GET',
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setVerticalData(data.vertical || []);
                setHorizontalData(data.horizontal || []);
                setTsStreamerData(data.tsStreamer || []);
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
    }, [selectedResort, streamerType]);

    // Handle resort filter change
    const handleResortChange = (event, newValue) => {
        setSelectedResort(newValue || null);
        if (newValue) {
            // Automatically set streamer type from resort data
            setStreamerType(newValue.streamer_types || '');
        } else {
            setStreamerType('');
        }
        setEditingRow(null);
        setAddingVertical(false);
        setAddingHorizontal(false);
        setAddingTs(false);
    };

    // Handle streamer type change
    const handleStreamerTypeChange = (event) => {
        setStreamerType(event.target.value);
    };

    // Safe value extraction helper
    const extractSafeValue = (item) => {
        if (!item) return '';
        if (typeof item === 'string' || typeof item === 'number') return item.toString();
        if (item && typeof item === 'object') {
            // Handle { key: "value" } structure
            if (item.key && (typeof item.key === 'string' || typeof item.key === 'number')) {
                return item.key.toString();
            }
            // Handle nested { key: { key: "value" } } structure
            if (item.key && typeof item.key === 'object' && item.key.key) {
                return item.key.key.toString();
            }
        }
        return '';
    };

    // Updated transformDataToTableRows function with frequency support
    const transformDataToTableRows = (apiData, signalLevel) => {
        if (!apiData || apiData.length === 0) return [];

        const tableRows = [];
        let globalRowIndex = 1;

        apiData.forEach((config, configIndex) => {
            const numChannels = config.channel_name?.length || 0;

            for (let i = 0; i < numChannels; i++) {
                const channelName = extractSafeValue(config.channel_name?.[i]);
                const multicastIp = extractSafeValue(config.multicast_ip?.[i]);
                const port = extractSafeValue(config.port?.[i]);
                const frequency = extractSafeValue(config.frequency?.[i]);

                tableRows.push({
                    id: `${config.streamer_config_id}-${i}-${signalLevel}`,
                    configIndex: configIndex,
                    channelIndex: i,
                    streamer_config_id: config.streamer_config_id,
                    no: globalRowIndex++,
                    channel_name: channelName,
                    multicast_ip: multicastIp,
                    port: port,
                    frequency: frequency,
                    stb_no: i === 0 ? extractSafeValue(config.stb_no) : '',
                    vc_no: i === 0 ? extractSafeValue(config.vc_no) : '',
                    trfc_ip: i === 0 ? extractSafeValue(config.trfc_ip) : '',
                    mngmnt_ip: i === 0 ? extractSafeValue(config.mngmnt_ip) : '',
                    strm: i === 0 ? extractSafeValue(config.strm) : '',
                    card: i === 0 ? extractSafeValue(config.card) : '',
                    resort_name: config.resort_name,
                    signal_level: signalLevel,
                    originalConfig: config,
                    isFirstRowOfConfig: i === 0,
                    configId: config.streamer_config_id,
                });
            }

            if (configIndex < apiData.length - 1) {
                tableRows.push({
                    id: `gap-${config.streamer_config_id}-${signalLevel}`,
                    isGap: true
                });
            }
        });

        return tableRows;
    };

    // Combine vertical, horizontal and tsStreamer data with section headers
    const getAllTableRows = () => {
        // For TS Streamer, use tsStreamerData
        if (streamerType === 'TS Streamer') {
            const tsRows = transformDataToTableRows(tsStreamerData, 'ts');
            return tsRows;
        }

        // For other streamer types, keep the original vertical/horizontal structure
        const verticalRows = transformDataToTableRows(verticalData, 'vertical');
        const horizontalRows = transformDataToTableRows(horizontalData, 'horizontal');

        const allRows = [];

        if (verticalRows.length > 0 || addingVertical) {
            allRows.push({
                id: 'vertical-header',
                isSectionHeader: true,
                sectionName: 'VERTICAL'
            });
            allRows.push(...verticalRows);
        }

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
        if (streamerType === 'TS Streamer') {
            setAddingTs(true);
        } else {
            if (section === 'vertical') {
                setAddingVertical(true);
            } else {
                setAddingHorizontal(true);
            }
        }

        setNewConfigData([
            { channel_name: '', multicast_ip: '', port: '', frequency: '', stb_no: '', vc_no: '', trfc_ip: '', mngmnt_ip: '', strm: '', card: '' },
            { channel_name: '', multicast_ip: '', port: '', frequency: '', stb_no: '', vc_no: '', trfc_ip: '', mngmnt_ip: '', strm: '', card: '' },
            { channel_name: '', multicast_ip: '', port: '', frequency: '', stb_no: '', vc_no: '', trfc_ip: '', mngmnt_ip: '', strm: '', card: '' }
        ]);
    };

    const handleAddCancel = () => {
        setAddingVertical(false);
        setAddingHorizontal(false);
        setAddingTs(false);
        setNewConfigData([
            { channel_name: '', multicast_ip: '', port: '', frequency: '', stb_no: '', vc_no: '', trfc_ip: '', mngmnt_ip: '', strm: '', card: '' },
            { channel_name: '', multicast_ip: '', port: '', frequency: '', stb_no: '', vc_no: '', trfc_ip: '', mngmnt_ip: '', strm: '', card: '' },
            { channel_name: '', multicast_ip: '', port: '', frequency: '', stb_no: '', vc_no: '', trfc_ip: '', mngmnt_ip: '', strm: '', card: '' }
        ]);
    };

    const handleAddSave = async () => {
        try {
            setSaving(true);

            let signalLevel = '';
            if (streamerType === 'TS Streamer') {
                signalLevel = 'TS Streamer';
            } else {
                signalLevel = addingVertical ? 'vertical' : 'horizontal';
            }

            const channel_name = newConfigData.map(row => ({ key: row.channel_name || '' }));
            const multicast_ip = newConfigData.map(row => ({ key: row.multicast_ip || '' }));
            const port = newConfigData.map(row => ({ key: row.port || '' }));
            const frequency = newConfigData.map(row => ({ key: row.frequency || '' }));

            const payload = {
                resort_id: selectedResort.resort_id,
                channel_name: channel_name,
                multicast_ip: multicast_ip,
                port: port,
                frequency: frequency,
                stb_no: newConfigData[0].stb_no,
                vc_no: newConfigData[0].vc_no,
                trfc_ip: newConfigData[0].trfc_ip,
                mngmnt_ip: newConfigData[0].mngmnt_ip,
                strm: newConfigData[0].strm,
                card: newConfigData[0].card,
                signal_level: signalLevel,
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

            const url = `${process.env.REACT_APP_LOCALHOST}/statistics/getAllStreamerConfig?resort_id=${encodeURIComponent(selectedResort.resort_id)}&streamer_type=${encodeURIComponent(streamerType)}`;
            const refreshResponse = await fetch(url);
            const data = await refreshResponse.json();
            setVerticalData(data.vertical || []);
            setHorizontalData(data.horizontal || []);
            setTsStreamerData(data.tsStreamer || []);

            handleAddCancel();
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

            if (rowIndex === 0 && ['stb_no', 'vc_no', 'trfc_ip', 'mngmnt_ip', 'strm', 'card'].includes(field)) {
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

        // For TS Streamer, use tsStreamerData
        const currentData = streamerType === 'TS Streamer'
            ? tsStreamerData
            : (row.signal_level === 'vertical' ? verticalData : horizontalData);

        const originalConfig = currentData[row.configIndex];

        const formData = {
            channel_name: row.channel_name,
            multicast_ip: row.multicast_ip,
            port: row.port,
            frequency: row.frequency,
            stb_no: row.stb_no,
            vc_no: row.vc_no,
            trfc_ip: row.trfc_ip,
            mngmnt_ip: row.mngmnt_ip,
            strm: row.strm,
            card: row.card,
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

            // For TS Streamer, use tsStreamerData
            const currentData = streamerType === 'TS Streamer'
                ? tsStreamerData
                : (row.signal_level === 'vertical' ? verticalData : horizontalData);

            const setDataFunction = streamerType === 'TS Streamer'
                ? setTsStreamerData
                : (row.signal_level === 'vertical' ? setVerticalData : setHorizontalData);

            const configToUpdate = currentData[row.configIndex];

            if (!configToUpdate) {
                throw new Error('Configuration not found');
            }

            const updatedConfig = JSON.parse(JSON.stringify(configToUpdate));

            // Update channel-specific arrays
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

            // Update frequency for TS Streamer
            if (streamerType === 'TS Streamer') {
                if (row.channelIndex < updatedConfig.frequency.length) {
                    updatedConfig.frequency[row.channelIndex].key = editFormData.frequency;
                } else {
                    updatedConfig.frequency.push({ key: editFormData.frequency });
                }
            }

            // Update config-wide fields
            if (row.channelIndex === 0) {
                updatedConfig.stb_no = editFormData.stb_no;
                updatedConfig.vc_no = editFormData.vc_no;
                updatedConfig.trfc_ip = editFormData.trfc_ip;
                updatedConfig.mngmnt_ip = editFormData.mngmnt_ip;
                updatedConfig.strm = editFormData.strm;
                updatedConfig.card = editFormData.card;
            }

            const updatePayload = {
                resort_id: selectedResort.resort_id,
                channel_name: updatedConfig.channel_name,
                multicast_ip: updatedConfig.multicast_ip,
                port: updatedConfig.port,
                frequency: updatedConfig.frequency,
                stb_no: updatedConfig.stb_no,
                vc_no: updatedConfig.vc_no,
                trfc_ip: updatedConfig.trfc_ip,
                mngmnt_ip: updatedConfig.mngmnt_ip,
                strm: updatedConfig.strm,
                card: updatedConfig.card,
                signal_level: updatedConfig.signal_level,
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

            const updatedData = [...currentData];
            updatedData[row.configIndex] = updatedConfig;
            setDataFunction(updatedData);

            setEditingRow(null);
            setEditFormData({});
            setOriginalData({});

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

    const handleDelete = async () => {
        if (!selectedRowToDelete) return;

        try {
            setSaving(true);

            const row = selectedRowToDelete;

            // For TS Streamer, use tsStreamerData
            const currentData = streamerType === 'TS Streamer'
                ? tsStreamerData
                : (row.signal_level === 'vertical' ? verticalData : horizontalData);

            const setDataFunction = streamerType === 'TS Streamer'
                ? setTsStreamerData
                : (row.signal_level === 'vertical' ? setVerticalData : setHorizontalData);

            const configIndex = row.configIndex;
            const configToDeleteFrom = currentData[configIndex];
            const totalChannels = configToDeleteFrom.channel_name?.length || 0;

            const countNonEmptyRows = () => {
                let count = 0;
                for (let i = 0; i < totalChannels; i++) {
                    const channelName = extractSafeValue(configToDeleteFrom.channel_name?.[i]);
                    const multicastIp = extractSafeValue(configToDeleteFrom.multicast_ip?.[i]);
                    const port = extractSafeValue(configToDeleteFrom.port?.[i]);
                    const frequency = streamerType === 'TS Streamer' ? extractSafeValue(configToDeleteFrom.frequency?.[i]) : '';

                    // Check if this row has any data in the key fields
                    const hasData = channelName.trim() !== '' ||
                        multicastIp.trim() !== '' ||
                        port.trim() !== '' ||
                        (streamerType === 'TS Streamer' && frequency.trim() !== '');

                    if (hasData) {
                        count++;
                    }
                }
                return count;
            };

            const nonEmptyRowCount = countNonEmptyRows();

            // If there's only one non-empty row AND that row is the one we're trying to delete, 
            // then delete entire configuration
            if (nonEmptyRowCount === 1) {
                // Check if the row we're deleting is the only non-empty row
                const rowToDeleteHasData = () => {
                    const channelName = extractSafeValue(configToDeleteFrom.channel_name?.[row.channelIndex]);
                    const multicastIp = extractSafeValue(configToDeleteFrom.multicast_ip?.[row.channelIndex]);
                    const port = extractSafeValue(configToDeleteFrom.port?.[row.channelIndex]);
                    const frequency = streamerType === 'TS Streamer' ? extractSafeValue(configToDeleteFrom.frequency?.[row.channelIndex]) : '';

                    return channelName.trim() !== '' ||
                        multicastIp.trim() !== '' ||
                        port.trim() !== '' ||
                        (streamerType === 'TS Streamer' && frequency.trim() !== '');
                };

                if (rowToDeleteHasData()) {
                    // This is the only non-empty row, delete entire configuration
                    const response = await fetch(`${process.env.REACT_APP_LOCALHOST}/statistics/deleteStreamerConfig/${row.streamer_config_id}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                        // No body needed for entire config deletion
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                    }

                    await response.json();

                    // Refresh data
                    const refreshUrl = `${process.env.REACT_APP_LOCALHOST}/statistics/getAllStreamerConfig?resort_id=${encodeURIComponent(selectedResort.resort_id)}&streamer_type=${encodeURIComponent(streamerType)}`;
                    const refreshResponse = await fetch(refreshUrl);
                    const data = await refreshResponse.json();
                    setVerticalData(data.vertical || []);
                    setHorizontalData(data.horizontal || []);
                    setTsStreamerData(data.tsStreamer || []);

                    showToast('Configuration deleted successfully!');
                } else {
                    // The row we're deleting is empty, but there's another non-empty row
                    // This shouldn't normally happen, but handle it by deleting just the channel
                    await deleteSingleChannel(row, configToDeleteFrom, currentData, setDataFunction);
                }
            } else {
                // If there are 2 or 3 non-empty rows, delete only the selected channel
                await deleteSingleChannel(row, configToDeleteFrom, currentData, setDataFunction);
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

    // Helper function to delete a single channel
    const deleteSingleChannel = async (row, configToDeleteFrom, currentData, setDataFunction) => {
        if (streamerType === 'TS Streamer') {
            // For TS Streamer, use update endpoint to remove the channel and frequency
            const updatedData = [...currentData];
            const updatedConfig = JSON.parse(JSON.stringify(configToDeleteFrom));

            // Remove the selected channel
            updatedConfig.channel_name.splice(row.channelIndex, 1);
            updatedConfig.multicast_ip.splice(row.channelIndex, 1);
            updatedConfig.port.splice(row.channelIndex, 1);
            updatedConfig.frequency.splice(row.channelIndex, 1);

            // Add empty row to maintain structure (always ensure we have 3 rows)
            const currentRowCount = updatedConfig.channel_name.length;
            const rowsToAdd = 3 - currentRowCount;

            for (let i = 0; i < rowsToAdd; i++) {
                updatedConfig.channel_name.push({ key: '' });
                updatedConfig.multicast_ip.push({ key: '' });
                updatedConfig.port.push({ key: '' });
                updatedConfig.frequency.push({ key: '' });
            }

            // Prepare update payload
            const updatePayload = {
                resort_id: selectedResort.resort_id,
                channel_name: updatedConfig.channel_name,
                multicast_ip: updatedConfig.multicast_ip,
                port: updatedConfig.port,
                frequency: updatedConfig.frequency,
                stb_no: updatedConfig.stb_no,
                vc_no: updatedConfig.vc_no,
                trfc_ip: updatedConfig.trfc_ip,
                mngmnt_ip: updatedConfig.mngmnt_ip,
                strm: updatedConfig.strm,
                card: updatedConfig.card,
                signal_level: updatedConfig.signal_level,
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

            updatedData[row.configIndex] = updatedConfig;
            setDataFunction(updatedData);

            showToast('Channel deleted successfully!');
        } else {
            // For non-TS Streamer, use the delete endpoint as before
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

            const updatedData = [...currentData];
            const updatedConfig = JSON.parse(JSON.stringify(configToDeleteFrom));

            // Remove the selected channel
            updatedConfig.channel_name.splice(row.channelIndex, 1);
            updatedConfig.multicast_ip.splice(row.channelIndex, 1);
            updatedConfig.port.splice(row.channelIndex, 1);

            // Add empty row to maintain structure (always ensure we have 3 rows)
            const currentRowCount = updatedConfig.channel_name.length;
            const rowsToAdd = 3 - currentRowCount;

            for (let i = 0; i < rowsToAdd; i++) {
                updatedConfig.channel_name.push({ key: '' });
                updatedConfig.multicast_ip.push({ key: '' });
                updatedConfig.port.push({ key: '' });
            }

            updatedData[row.configIndex] = updatedConfig;
            setDataFunction(updatedData);

            showToast('Channel deleted successfully!');
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

        const basicChanges = editFormData.channel_name !== originalData.channel_name ||
            editFormData.multicast_ip !== originalData.multicast_ip ||
            editFormData.port !== originalData.port ||
            editFormData.stb_no !== originalData.stb_no ||
            editFormData.vc_no !== originalData.vc_no ||
            editFormData.trfc_ip !== originalData.trfc_ip ||
            editFormData.mngmnt_ip !== originalData.mngmnt_ip ||
            editFormData.strm !== originalData.strm ||
            editFormData.card !== originalData.card;

        // For TS Streamer, also check frequency changes
        if (streamerType === 'TS Streamer') {
            return basicChanges || editFormData.frequency !== originalData.frequency;
        }

        return basicChanges;
    };

    // Check if new config data is valid
    const isNewConfigValid = () => {
        const firstRow = newConfigData[0];
        const basicValid = firstRow.channel_name.trim() !== '' &&
            firstRow.multicast_ip.trim() !== '' &&
            firstRow.port.trim() !== '' &&
            firstRow.stb_no.trim() !== '' &&
            firstRow.vc_no.trim() !== '';

        // For TS Streamer, also validate frequency
        if (streamerType === 'TS Streamer') {
            return basicValid && firstRow.frequency.trim() !== '';
        }

        return basicValid;
    };

    // UPDATED: Export function with proper column widths
    const exportToExcel = () => {
        const transformDataForExcelWithStructure = (apiData, startNumber = 1) => {
            if (!apiData || apiData.length === 0) return { data: [], nextNumber: startNumber };

            const excelRows = [];
            let currentNumber = startNumber;

            apiData.forEach((config, configIndex) => {
                const configRows = [];
                let hasAnyDataInConfig = false;

                for (let i = 0; i < 3; i++) {
                    const channelName = extractSafeValue(config.channel_name?.[i]);
                    const multicastIp = extractSafeValue(config.multicast_ip?.[i]);
                    const port = extractSafeValue(config.port?.[i]);
                    const frequency = extractSafeValue(config.frequency?.[i]);
                    const stbNo = i === 0 ? extractSafeValue(config.stb_no) : '';
                    const vcNo = i === 0 ? extractSafeValue(config.vc_no) : '';
                    const trfcIp = i === 0 ? extractSafeValue(config.trfc_ip) : '';
                    const mngmntIp = i === 0 ? extractSafeValue(config.mngmnt_ip) : '';
                    const strm = i === 0 ? extractSafeValue(config.strm) : '';
                    const card = i === 0 ? extractSafeValue(config.card) : '';

                    const hasData = channelName.trim() !== '' ||
                        multicastIp.trim() !== '' ||
                        port.trim() !== '' ||
                        frequency.trim() !== '' ||
                        stbNo.trim() !== '' ||
                        vcNo.trim() !== '' ||
                        trfcIp.trim() !== '' ||
                        mngmntIp.trim() !== '' ||
                        strm.trim() !== '' ||
                        card.trim() !== '';

                    if (hasData) {
                        hasAnyDataInConfig = true;
                        const rowData = {
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
                        };

                        // Add frequency for TS Streamer
                        if (streamerType === 'TS Streamer') {
                            rowData["FREQUENCY"] = frequency;
                        }

                        configRows.push(rowData);
                    }
                }

                if (hasAnyDataInConfig) {
                    excelRows.push(...configRows);
                    if (configIndex < apiData.length - 1) {
                        const nextConfigHasData = apiData[configIndex + 1] &&
                            (apiData[configIndex + 1].channel_name?.some(ch => extractSafeValue(ch).trim() !== '') ||
                                apiData[configIndex + 1].multicast_ip?.some(ip => extractSafeValue(ip).trim() !== '') ||
                                apiData[configIndex + 1].port?.some(p => extractSafeValue(p).trim() !== '') ||
                                extractSafeValue(apiData[configIndex + 1].stb_no).trim() !== '' ||
                                extractSafeValue(apiData[configIndex + 1].vc_no).trim() !== '');

                        if (nextConfigHasData) {
                            excelRows.push({});
                        }
                    }
                }
            });

            return { data: excelRows, nextNumber: currentNumber };
        };

        // For TS Streamer, use tsStreamerData
        if (streamerType === 'TS Streamer') {
            const tsResult = transformDataForExcelWithStructure(tsStreamerData, 1);

            if (tsResult.data.length === 0) {
                showErrorToast("No data to export.");
                return;
            }

            const wb = XLSX.utils.book_new();
            const columnHeaders = [
                "NO",
                "CHANNEL NAME",
                "MULTICAST IP",
                "PORT",
                "FREQUENCY",
                "STB NO",
                "VC NO",
                "TRFC IP",
                "MNGMNT IP",
                "STRM",
                "CARD"
            ];

            const allData = [columnHeaders];
            tsResult.data.forEach((row) => {
                if (Object.keys(row).length === 0) {
                    allData.push([]);
                } else {
                    const rowData = columnHeaders.map(header => row[header] || '');
                    allData.push(rowData);
                }
            });

            const ws = XLSX.utils.aoa_to_sheet(allData);

            // Set column widths for TS Streamer
            const columnWidths = [
                { wch: 8 },    // NO
                { wch: 25 },   // CHANNEL NAME
                { wch: 15 },   // MULTICAST IP
                { wch: 10 },   // PORT
                { wch: 12 },   // FREQUENCY
                { wch: 12 },   // STB NO
                { wch: 12 },   // VC NO
                { wch: 15 },   // TRFC IP
                { wch: 15 },   // MNGMNT IP
                { wch: 10 },   // STRM
                { wch: 10 }    // CARD
            ];
            ws['!cols'] = columnWidths;

            XLSX.utils.book_append_sheet(wb, ws, "TS Streamer Configuration");
            const filename = selectedResort ? `ts_streamer_config_${selectedResort.resort_name.replace(/\s+/g, '_')}.xlsx` : 'ts_streamer_config.xlsx';
            XLSX.writeFile(wb, filename);
        } else {
            // Original export logic for non-TS Streamer
            const verticalResult = transformDataForExcelWithStructure(verticalData, 1);
            const horizontalResult = transformDataForExcelWithStructure(horizontalData, verticalResult.nextNumber);

            if (verticalResult.data.length === 0 && horizontalResult.data.length === 0) {
                showErrorToast("No data to export.");
                return;
            }

            const wb = XLSX.utils.book_new();

            // Define column headers based on streamer type
            const baseHeaders = [
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

            const columnHeaders = baseHeaders;

            const allData = [];

            if (verticalResult.data.length > 0) {
                allData.push(["VERTICAL"]);
                allData.push(columnHeaders);
                verticalResult.data.forEach((row) => {
                    if (Object.keys(row).length === 0) {
                        allData.push([]);
                    } else {
                        const rowData = columnHeaders.map(header => row[header] || '');
                        allData.push(rowData);
                    }
                });
                if (horizontalResult.data.length > 0) {
                    allData.push([]);
                }
            }

            if (horizontalResult.data.length > 0) {
                allData.push(["HORIZONTAL"]);
                allData.push(columnHeaders);
                horizontalResult.data.forEach((row) => {
                    if (Object.keys(row).length === 0) {
                        allData.push([]);
                    } else {
                        const rowData = columnHeaders.map(header => row[header] || '');
                        allData.push(rowData);
                    }
                });
            }

            const ws = XLSX.utils.aoa_to_sheet(allData);

            // Set column widths for non-TS Streamer
            const columnWidths = [
                { wch: 8 },    // NO
                { wch: 25 },   // CHANNEL NAME
                { wch: 15 },   // MULTICAST IP
                { wch: 10 },   // PORT
                { wch: 12 },   // STB NO
                { wch: 12 },   // VC NO
                { wch: 15 },   // TRFC IP
                { wch: 15 },   // MNGMNT IP
                { wch: 10 },   // STRM
                { wch: 10 }    // CARD
            ];
            ws['!cols'] = columnWidths;

            XLSX.utils.book_append_sheet(wb, ws, "Streamer Configuration");
            const filename = selectedResort ? `streamer_config_${selectedResort.resort_name.replace(/\s+/g, '_')}_${streamerType.replace(/\s+/g, '_')}.xlsx` : 'streamer_config_all_data.xlsx';
            XLSX.writeFile(wb, filename);
        }
    };

    const allTableRows = getAllTableRows();

    // Function to render add rows (3 rows for new configuration)
    const renderAddRows = (section) => {
        const isAdding = streamerType === 'TS Streamer'
            ? addingTs
            : (section === 'vertical' ? addingVertical : addingHorizontal);

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

                <TableCell>
                    <TextField
                        value={rowData.channel_name}
                        onChange={(e) => handleNewInputChange(rowIndex, 'channel_name', e.target.value)}
                        size="small"
                        fullWidth
                        variant="outlined"
                        placeholder="Enter channel name"
                        sx={{ minWidth: '120px' }}
                    />
                </TableCell>

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

                <TableCell align="center">
                    <TextField
                        value={rowData.port}
                        onChange={(e) => handleNewInputChange(rowIndex, 'port', e.target.value)}
                        size="small"
                        fullWidth
                        variant="outlined"
                        placeholder="Enter port"
                        sx={{ minWidth: '100px' }}
                    />
                </TableCell>

                {/* Frequency column for TS Streamer */}
                {streamerType === 'TS Streamer' && (
                    <TableCell align="center">
                        <TextField
                            value={rowData.frequency}
                            onChange={(e) => handleNewInputChange(rowIndex, 'frequency', e.target.value)}
                            size="small"
                            fullWidth
                            variant="outlined"
                            placeholder="Enter frequency"
                            sx={{ minWidth: '145px' }}
                        />
                    </TableCell>
                )}

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
                        }} />
                    )}
                </TableCell>

                <TableCell>
                    {rowIndex === 0 ? (
                        <TextField
                            value={rowData.vc_no}
                            onChange={(e) => handleNewInputChange(rowIndex, 'vc_no', e.target.value)}
                            size="small"
                            fullWidth
                            variant="outlined"
                            placeholder="Enter VC number"
                            sx={{ minWidth: '155px' }}
                        />
                    ) : (
                        <Box sx={{
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#999',
                            fontStyle: 'italic'
                        }} />
                    )}
                </TableCell>

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
                        }} />
                    )}
                </TableCell>

                <TableCell>
                    {rowIndex === 0 ? (
                        <TextField
                            value={rowData.mngmnt_ip}
                            onChange={(e) => handleNewInputChange(rowIndex, 'mngmnt_ip', e.target.value)}
                            size="small"
                            fullWidth
                            variant="outlined"
                            placeholder="Enter management IP"
                            sx={{ minWidth: '190px' }}
                        />
                    ) : (
                        <Box sx={{
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#999',
                            fontStyle: 'italic'
                        }} />
                    )}
                </TableCell>

                <TableCell align="center">
                    {rowIndex === 0 ? (
                        <TextField
                            value={rowData.strm}
                            onChange={(e) => handleNewInputChange(rowIndex, 'strm', e.target.value)}
                            size="small"
                            fullWidth
                            variant="outlined"
                            placeholder="Enter STRM"
                            sx={{ minWidth: '120px' }}
                        />
                    ) : (
                        <Box sx={{
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#999',
                            fontStyle: 'italic'
                        }} />
                    )}
                </TableCell>

                <TableCell align="center">
                    {rowIndex === 0 ? (
                        <TextField
                            value={rowData.card}
                            onChange={(e) => handleNewInputChange(rowIndex, 'card', e.target.value)}
                            size="small"
                            fullWidth
                            variant="outlined"
                            placeholder="Enter CARD"
                            sx={{ minWidth: '120px' }}
                        />
                    ) : (
                        <Box sx={{
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#999',
                            fontStyle: 'italic'
                        }} />
                    )}
                </TableCell>

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
                                <span>
                                    <IconButton
                                        color="primary"
                                        size="small"
                                        onClick={handleAddSave}
                                        disabled={saving || !isNewConfigValid()}
                                    >
                                        {saving ? <CircularProgress size={20} /> : <SaveIcon />}
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Tooltip title="Cancel">
                                <span>
                                    <IconButton
                                        color="secondary"
                                        size="small"
                                        onClick={handleAddCancel}
                                        disabled={saving}
                                    >
                                        <CancelIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Box>
                    )}
                </TableCell>
            </TableRow>
        ));
    };

    // Function to render table headers based on streamer type
    const renderTableHeaders = () => {
        const baseHeaders = [
            <TableCell key="no" align="center" sx={{ width: '80px', backgroundColor: '#0670a4 !important', color: 'white' }}>NO</TableCell>,
            <TableCell key="channel" sx={{ minWidth: '200px', backgroundColor: '#0670a4 !important', color: 'white' }}>CHANNEL NAME</TableCell>,
            <TableCell key="multicast" sx={{ minWidth: '155px', backgroundColor: '#0670a4 !important', color: 'white' }}>MULTICAST IP</TableCell>,
            <TableCell key="port" align="center" sx={{ width: '130px', backgroundColor: '#0670a4 !important', color: 'white' }}>PORT</TableCell>,
            <TableCell key="stb" sx={{ minWidth: '180px', backgroundColor: '#0670a4 !important', color: 'white' }}>STB NO</TableCell>,
            <TableCell key="vc" sx={{ minWidth: '120px', backgroundColor: '#0670a4 !important', color: 'white' }}>VC NO</TableCell>,
            <TableCell key="trfc" sx={{ minWidth: '150px', backgroundColor: '#0670a4 !important', color: 'white' }}>TRFC IP</TableCell>,
            <TableCell key="mngmnt" sx={{ minWidth: '150px', backgroundColor: '#0670a4 !important', color: 'white' }}>MNGMNT IP</TableCell>,
            <TableCell key="strm" align="center" sx={{ width: '80px', backgroundColor: '#0670a4 !important', color: 'white' }}>STRM</TableCell>,
            <TableCell key="card" align="center" sx={{ width: '80px', backgroundColor: '#0670a4 !important', color: 'white' }}>CARD</TableCell>
        ];

        // For TS Streamer, insert frequency column after port
        if (streamerType === 'TS Streamer') {
            baseHeaders.splice(4, 0,
                <TableCell key="frequency" align="center" sx={{ width: '120px', backgroundColor: '#0670a4 !important', color: 'white' }}>FREQUENCY</TableCell>
            );
        }

        // Add actions column if user has edit access
        if (canAccess("streamerConfig", "edit")) {
            baseHeaders.push(
                <TableCell
                    key="actions"
                    align="center"
                    sx={{
                        width: '140px',
                        position: 'sticky',
                        right: 0,
                        backgroundColor: '#0670a4 !important',
                        color: 'white',
                        zIndex: 12,
                        borderLeft: '2px solid #e0e0e0',
                        boxShadow: '-2px 0 4px rgba(0,0,0,0.1)',
                    }}
                >
                    ACTIONS
                </TableCell>
            );
        }

        return baseHeaders;
    };

    // Function to render table cell for a row based on streamer type
    const renderTableCell = (row, field, isEditing = false) => {
        const commonProps = {
            size: "small",
            fullWidth: true,
            variant: "outlined"
        };

        switch (field) {
            case 'no':
                return <TableCell align="center" sx={{ borderRight: '2px solid #e0e0e0' }}>{row.no}</TableCell>;

            case 'channel_name':
                return (
                    <TableCell>
                        {isEditing ? (
                            <TextField
                                value={editFormData.channel_name || ''}
                                onChange={(e) => handleInputChange('channel_name', e.target.value)}
                                {...commonProps}
                                sx={{ minWidth: '120px' }}
                            />
                        ) : (
                            row.channel_name
                        )}
                    </TableCell>
                );

            case 'multicast_ip':
                return (
                    <TableCell sx={{ fontFamily: 'monospace' }}>
                        {isEditing ? (
                            <TextField
                                value={editFormData.multicast_ip || ''}
                                onChange={(e) => handleInputChange('multicast_ip', e.target.value)}
                                {...commonProps}
                            />
                        ) : (
                            row.multicast_ip
                        )}
                    </TableCell>
                );

            case 'port':
                return (
                    <TableCell align="center" sx={{ fontFamily: 'monospace' }}>
                        {isEditing ? (
                            <TextField
                                value={editFormData.port || ''}
                                onChange={(e) => handleInputChange('port', e.target.value)}
                                {...commonProps}
                            />
                        ) : (
                            row.port
                        )}
                    </TableCell>
                );

            case 'frequency':
                if (streamerType !== 'TS Streamer') return null;
                return (
                    <TableCell align="center" sx={{ fontFamily: 'monospace' }}>
                        {isEditing ? (
                            <TextField
                                value={editFormData.frequency || ''}
                                onChange={(e) => handleInputChange('frequency', e.target.value)}
                                {...commonProps}
                                sx={{ minWidth: '120px' }}
                            />
                        ) : (
                            row.frequency
                        )}
                    </TableCell>
                );

            case 'stb_no':
                return (
                    <TableCell sx={{ fontFamily: 'monospace' }}>
                        {isEditing ? (
                            <TextField
                                value={editFormData.stb_no || ''}
                                onChange={(e) => handleInputChange('stb_no', e.target.value)}
                                {...commonProps}
                                disabled={row.channelIndex !== 0}
                            />
                        ) : (
                            row.stb_no
                        )}
                    </TableCell>
                );

            case 'vc_no':
                return (
                    <TableCell sx={{ fontFamily: 'monospace' }}>
                        {isEditing ? (
                            <TextField
                                value={editFormData.vc_no || ''}
                                onChange={(e) => handleInputChange('vc_no', e.target.value)}
                                {...commonProps}
                                disabled={row.channelIndex !== 0}
                            />
                        ) : (
                            row.vc_no
                        )}
                    </TableCell>
                );

            case 'trfc_ip':
                return (
                    <TableCell sx={{ fontFamily: 'monospace' }}>
                        {isEditing ? (
                            <TextField
                                value={editFormData.trfc_ip || ''}
                                onChange={(e) => handleInputChange('trfc_ip', e.target.value)}
                                {...commonProps}
                                disabled={row.channelIndex !== 0}
                            />
                        ) : (
                            row.trfc_ip
                        )}
                    </TableCell>
                );

            case 'mngmnt_ip':
                return (
                    <TableCell sx={{ fontFamily: 'monospace' }}>
                        {isEditing ? (
                            <TextField
                                value={editFormData.mngmnt_ip || ''}
                                onChange={(e) => handleInputChange('mngmnt_ip', e.target.value)}
                                {...commonProps}
                                disabled={row.channelIndex !== 0}
                            />
                        ) : (
                            row.mngmnt_ip
                        )}
                    </TableCell>
                );

            case 'strm':
                return (
                    <TableCell align="center">
                        {isEditing ? (
                            <TextField
                                value={editFormData.strm || ''}
                                onChange={(e) => handleInputChange('strm', e.target.value)}
                                {...commonProps}
                                disabled={row.channelIndex !== 0}
                            />
                        ) : (
                            row.strm
                        )}
                    </TableCell>
                );

            case 'card':
                return (
                    <TableCell align="center">
                        {isEditing ? (
                            <TextField
                                value={editFormData.card || ''}
                                onChange={(e) => handleInputChange('card', e.target.value)}
                                {...commonProps}
                                disabled={row.channelIndex !== 0}
                            />
                        ) : (
                            row.card
                        )}
                    </TableCell>
                );

            default:
                return null;
        }
    };

    // Function to render the main table body based on streamer type
    const renderTableBody = () => {
        if (streamerType === 'TS Streamer') {
            return renderTsTableBody();
        } else {
            return renderStandardTableBody();
        }
    };

    // Render TS Streamer table body (using tsStreamerData)
    const renderTsTableBody = () => {
        const tsRows = getAllTableRows();
        const hasData = tsRows.length > 0 || addingTs;

        if (!hasData && !addingTs) {
            return (
                <>
                    <TableRow>
                        <TableCell
                            colSpan={canAccess("streamerConfig", "edit") ? 12 : 11}
                            align="center"
                            sx={{
                                padding: '20px',
                                fontStyle: 'italic',
                                color: '#666'
                            }}
                        >
                            No Ts configurations found
                        </TableCell>
                    </TableRow>
                    {/* Add Button for TS Streamer when no data exists */}
                    {canAccess("streamerConfig", "edit") && (
                        <TableRow>
                            <TableCell
                                colSpan={canAccess("streamerConfig", "edit") ? 12 : 11}
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
                                    onClick={() => handleAddClick('ts')}
                                    disabled={addingTs}
                                    sx={{
                                        textTransform: "none",
                                        backgroundColor: addingTs ? "#cccccc" : "#2e86de",
                                        borderColor: addingTs ? "#cccccc" : "#2e86de",
                                        color: "white",
                                        transition: "all 0.2s ease-in-out",
                                        '&:hover': !addingTs
                                            ? {
                                                backgroundColor: "#1b4f9c",
                                                transform: "scale(1.05)",
                                                borderColor: "#1b4f9c",
                                            }
                                            : {},
                                        '&:disabled': {
                                            backgroundColor: "#cccccc",
                                            color: "#666666",
                                            borderColor: "#cccccc",
                                        },
                                    }}
                                >
                                    Add New TS Streamer Configuration
                                </Button>

                            </TableCell>
                        </TableRow>
                    )}
                </>
            );
        }

        return (
            <>
                {/* TS Streamer Data Rows */}
                {tsRows.map((row, index, array) => (
                    <React.Fragment key={row.id}>
                        {row.isGap ? (
                            <TableRow>
                                <TableCell
                                    colSpan={canAccess("streamerConfig", "edit") ? 12 : 11}
                                    sx={{
                                        height: '16px',
                                        backgroundColor: '#fafafa',
                                        border: 'none'
                                    }}
                                />
                            </TableRow>
                        ) : (
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
                                {renderTableCell(row, 'no')}
                                {renderTableCell(row, 'channel_name', editingRow === row.id)}
                                {renderTableCell(row, 'multicast_ip', editingRow === row.id)}
                                {renderTableCell(row, 'port', editingRow === row.id)}
                                {renderTableCell(row, 'frequency', editingRow === row.id)}
                                {renderTableCell(row, 'stb_no', editingRow === row.id)}
                                {renderTableCell(row, 'vc_no', editingRow === row.id)}
                                {renderTableCell(row, 'trfc_ip', editingRow === row.id)}
                                {renderTableCell(row, 'mngmnt_ip', editingRow === row.id)}
                                {renderTableCell(row, 'strm', editingRow === row.id)}
                                {renderTableCell(row, 'card', editingRow === row.id)}

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
                                                    <span>
                                                        <IconButton
                                                            color="primary"
                                                            size="small"
                                                            onClick={() => handleSaveClick(row)}
                                                            disabled={saving || !hasChanges()}
                                                        >
                                                            {saving ? <CircularProgress size={20} /> : <SaveIcon />}
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                                <Tooltip title="Cancel">
                                                    <span>
                                                        <IconButton
                                                            color="secondary"
                                                            size="small"
                                                            onClick={handleCancelClick}
                                                            disabled={saving}
                                                        >
                                                            <CancelIcon />
                                                        </IconButton>
                                                    </span>
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
                                                        disabled={row.isEmptyRow || (!row.channel_name && !row.multicast_ip && !row.port)}
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

                {/* Add Rows for TS Streamer */}
                {renderAddRows('ts')}

                {/* Add Button for TS Streamer - Always show when not in add mode */}
                {canAccess("streamerConfig", "edit") && !addingTs && (
                    <TableRow>
                        <TableCell
                            colSpan={canAccess("streamerConfig", "edit") ? 12 : 11}
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
                                onClick={() => handleAddClick('ts')}
                                disabled={addingTs}
                                sx={{
                                    textTransform: "none",
                                    backgroundColor: addingTs ? "#cccccc" : "#2e86de",
                                    borderColor: addingTs ? "#cccccc" : "#2e86de",
                                    color: "white",
                                    transition: "all 0.2s ease-in-out",
                                    '&:hover': !addingTs
                                        ? {
                                            backgroundColor: "#1b4f9c",
                                            transform: "scale(1.05)",
                                            borderColor: "#1b4f9c",
                                        }
                                        : {},
                                    '&:disabled': {
                                        backgroundColor: "#cccccc",
                                        color: "#666666",
                                        borderColor: "#cccccc",
                                    },
                                }}
                            >
                                Add New TS Streamer Configuration
                            </Button>

                        </TableCell>
                    </TableRow>
                )}
            </>
        );
    };

    // Render standard table body with vertical/horizontal separation
    const renderStandardTableBody = () => {
        return (
            <>
                {/* VERTICAL SECTION */}
                <>
                    <TableRow>
                        <TableCell
                            colSpan={canAccess("streamerConfig", "edit") ? (streamerType === 'TS Streamer' ? 12 : 11) : (streamerType === 'TS Streamer' ? 11 : 10)}
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

                    {verticalData.length > 0 && transformDataToTableRows(verticalData, 'vertical').map((row, index, array) => (
                        <React.Fragment key={row.id}>
                            {row.isGap ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={canAccess("streamerConfig", "edit") ? (streamerType === 'TS Streamer' ? 12 : 11) : (streamerType === 'TS Streamer' ? 11 : 10)}
                                        sx={{
                                            height: '16px',
                                            backgroundColor: '#fafafa',
                                            border: 'none'
                                        }}
                                    />
                                </TableRow>
                            ) : (
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
                                    {renderTableCell(row, 'no')}
                                    {renderTableCell(row, 'channel_name', editingRow === row.id)}
                                    {renderTableCell(row, 'multicast_ip', editingRow === row.id)}
                                    {renderTableCell(row, 'port', editingRow === row.id)}
                                    {streamerType === 'TS Streamer' && renderTableCell(row, 'frequency', editingRow === row.id)}
                                    {renderTableCell(row, 'stb_no', editingRow === row.id)}
                                    {renderTableCell(row, 'vc_no', editingRow === row.id)}
                                    {renderTableCell(row, 'trfc_ip', editingRow === row.id)}
                                    {renderTableCell(row, 'mngmnt_ip', editingRow === row.id)}
                                    {renderTableCell(row, 'strm', editingRow === row.id)}
                                    {renderTableCell(row, 'card', editingRow === row.id)}

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
                                                        <span>
                                                            <IconButton
                                                                color="primary"
                                                                size="small"
                                                                onClick={() => handleSaveClick(row)}
                                                                disabled={saving || !hasChanges()}
                                                            >
                                                                {saving ? <CircularProgress size={20} /> : <SaveIcon />}
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>
                                                    <Tooltip title="Cancel">
                                                        <span>
                                                            <IconButton
                                                                color="secondary"
                                                                size="small"
                                                                onClick={handleCancelClick}
                                                                disabled={saving}
                                                            >
                                                                <CancelIcon />
                                                            </IconButton>
                                                        </span>
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
                                                            disabled={row.isEmptyRow || (!row.channel_name && !row.multicast_ip && !row.port)}
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

                    {verticalData.length === 0 && !addingVertical && (
                        <TableRow>
                            <TableCell
                                colSpan={canAccess("streamerConfig", "edit") ? (streamerType === 'TS Streamer' ? 12 : 11) : (streamerType === 'TS Streamer' ? 11 : 10)}
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

                    {verticalData.length > 0 && addingVertical && (
                        <TableRow>
                            <TableCell
                                colSpan={canAccess("streamerConfig", "edit") ? (streamerType === 'TS Streamer' ? 12 : 11) : (streamerType === 'TS Streamer' ? 11 : 10)}
                                sx={{
                                    height: '16px',
                                    backgroundColor: '#fafafa',
                                    border: 'none'
                                }}
                            />
                        </TableRow>
                    )}

                    {renderAddRows('vertical')}

                    {canAccess("streamerConfig", "edit") && (
                        <TableRow>
                            <TableCell
                                colSpan={canAccess("streamerConfig", "edit") ? (streamerType === 'TS Streamer' ? 12 : 11) : (streamerType === 'TS Streamer' ? 11 : 10)}
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
                                        backgroundColor: addingVertical ? "#cccccc" : "#2e86de",
                                        borderColor: addingVertical ? "#cccccc" : "#2e86de",
                                        color: "white",
                                        transition: "all 0.2s ease-in-out",
                                        '&:hover': !addingVertical
                                            ? {
                                                backgroundColor: "#1b4f9c",
                                                transform: "scale(1.05)",
                                                borderColor: "#1b4f9c",
                                            }
                                            : {},
                                        '&:disabled': {
                                            backgroundColor: "#cccccc",
                                            color: "#666666",
                                            borderColor: "#cccccc",
                                        },
                                    }}
                                >
                                    Add New Vertical Configuration
                                </Button>

                            </TableCell>
                        </TableRow>
                    )}
                </>

                {/* HORIZONTAL SECTION */}
                <>
                    <TableRow>
                        <TableCell
                            colSpan={canAccess("streamerConfig", "edit") ? (streamerType === 'TS Streamer' ? 12 : 11) : (streamerType === 'TS Streamer' ? 11 : 10)}
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

                    {horizontalData.length > 0 && transformDataToTableRows(horizontalData, 'horizontal').map((row, index, array) => (
                        <React.Fragment key={row.id}>
                            {row.isGap ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={canAccess("streamerConfig", "edit") ? (streamerType === 'TS Streamer' ? 12 : 11) : (streamerType === 'TS Streamer' ? 11 : 10)}
                                        sx={{
                                            height: '16px',
                                            backgroundColor: '#fafafa',
                                            border: 'none'
                                        }}
                                    />
                                </TableRow>
                            ) : (
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
                                    {renderTableCell(row, 'no')}
                                    {renderTableCell(row, 'channel_name', editingRow === row.id)}
                                    {renderTableCell(row, 'multicast_ip', editingRow === row.id)}
                                    {renderTableCell(row, 'port', editingRow === row.id)}
                                    {streamerType === 'TS Streamer' && renderTableCell(row, 'frequency', editingRow === row.id)}
                                    {renderTableCell(row, 'stb_no', editingRow === row.id)}
                                    {renderTableCell(row, 'vc_no', editingRow === row.id)}
                                    {renderTableCell(row, 'trfc_ip', editingRow === row.id)}
                                    {renderTableCell(row, 'mngmnt_ip', editingRow === row.id)}
                                    {renderTableCell(row, 'strm', editingRow === row.id)}
                                    {renderTableCell(row, 'card', editingRow === row.id)}

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
                                                        <span>
                                                            <IconButton
                                                                color="primary"
                                                                size="small"
                                                                onClick={() => handleSaveClick(row)}
                                                                disabled={saving || !hasChanges()}
                                                            >
                                                                {saving ? <CircularProgress size={20} /> : <SaveIcon />}
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>
                                                    <Tooltip title="Cancel">
                                                        <span>
                                                            <IconButton
                                                                color="secondary"
                                                                size="small"
                                                                onClick={handleCancelClick}
                                                                disabled={saving}
                                                            >
                                                                <CancelIcon />
                                                            </IconButton>
                                                        </span>
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

                    {horizontalData.length === 0 && !addingHorizontal && (
                        <TableRow>
                            <TableCell
                                colSpan={canAccess("streamerConfig", "edit") ? (streamerType === 'TS Streamer' ? 12 : 11) : (streamerType === 'TS Streamer' ? 11 : 10)}
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

                    {horizontalData.length > 0 && addingHorizontal && (
                        <TableRow>
                            <TableCell
                                colSpan={canAccess("streamerConfig", "edit") ? (streamerType === 'TS Streamer' ? 12 : 11) : (streamerType === 'TS Streamer' ? 11 : 10)}
                                sx={{
                                    height: '16px',
                                    backgroundColor: '#fafafa',
                                    border: 'none'
                                }}
                            />
                        </TableRow>
                    )}

                    {renderAddRows('horizontal')}

                    {canAccess("streamerConfig", "edit") && (
                        <TableRow>
                            <TableCell
                                colSpan={canAccess("streamerConfig", "edit") ? (streamerType === 'TS Streamer' ? 12 : 11) : (streamerType === 'TS Streamer' ? 11 : 10)}
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
                                        backgroundColor: addingHorizontal ? "#cccccc" : "#2e86de",
                                        borderColor: addingHorizontal ? "#cccccc" : "#2e86de",
                                        color: "white",
                                        transition: "all 0.2s ease-in-out",
                                        '&:hover': !addingHorizontal
                                            ? {
                                                backgroundColor: "#1b4f9c",
                                                transform: "scale(1.05)",
                                                borderColor: "#1b4f9c",
                                            }
                                            : {},
                                        '&:disabled': {
                                            backgroundColor: "#cccccc",
                                            color: "#666666",
                                            borderColor: "#cccccc",
                                        },
                                    }}
                                >
                                    Add New Horizontal Configuration
                                </Button>

                            </TableCell>
                        </TableRow>
                    )}
                </>
            </>
        );
    };

    return (
        <div className="streamer-config-table">
            {/* Filter Section */}
            <Box sx={{ paddingLeft: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
                    <Box>
                        <FormLabel sx={{ fontWeight: 'bold', mb: 1, display: 'block' }}>Resort Name</FormLabel>
                        <Autocomplete
                            options={resorts}
                            value={selectedResort}
                            onChange={handleResortChange}
                            getOptionLabel={(option) => option.resort_name}
                            isOptionEqualToValue={(option, value) => option.resort_id === value.resort_id}
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

                    <Box>
                        <FormLabel sx={{ fontWeight: 'bold', mb: 1, display: 'block' }}>Streamer Type</FormLabel>
                        <TextField
                            value={streamerType}
                            onChange={handleStreamerTypeChange}
                            size="small"
                            variant="outlined"
                            placeholder="Streamer type"
                            sx={{ backgroundColor: 'white', width: '11vw' }}
                            InputProps={{
                                readOnly: true,
                            }}
                        />
                    </Box>

                    <Box sx={{ alignSelf: 'flex-end' }}>
                        <Button
                            variant="contained"
                            startIcon={<GetAppIcon />}
                            onClick={exportToExcel}
                            disabled={!dataLoaded || (verticalData.length === 0 && horizontalData.length === 0 && tsStreamerData.length === 0)}
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

                {selectedResort && !loading && dataLoaded && (
                    <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>
                        Showing data for resort: <strong>{selectedResort.resort_name}</strong> | Streamer Type: <strong>{streamerType}</strong>
                    </Typography>
                )}
            </Box>

            {!selectedResort && !loading && (
                <Alert severity="info" sx={{ m: 2 }}>
                    Please select or enter a resort name to load streamer configuration data.
                </Alert>
            )}

            {loading && (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <CircularProgress />
                    <Box ml={2}>Loading streamer data for {selectedResort?.resort_name}...</Box>
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ m: 2 }}>
                    Error loading data for {selectedResort?.resort_name}: {error}
                </Alert>
            )}

            {dataLoaded && !loading && selectedResort && streamerType && (
                <>
                    {(allTableRows.length === 0 && !addingVertical && !addingHorizontal && !addingTs) ? (
                        <Alert severity="info" sx={{ m: 2 }}>
                            No streamer data available for resort: {selectedResort.resort_name} with streamer type: {streamerType}.
                        </Alert>
                    ) : null}

                    <Box>
                        <TableContainer
                            component={Paper}
                            sx={{
                                boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
                                borderRadius: '4px',
                                height: '73vh',
                                overflow: 'auto',
                                position: 'relative',
                                mt: 2
                            }}
                        >
                            <Table
                                stickyHeader
                                sx={{
                                    minWidth: streamerType === 'TS Streamer' ? 1650 : 1500,
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
                                        {renderTableHeaders()}
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {renderTableBody()}
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
                            const currentData = streamerType === 'TS Streamer'
                                ? tsStreamerData
                                : (selectedRowToDelete.signal_level === 'vertical' ? verticalData : horizontalData);
                            const config = currentData[selectedRowToDelete.configIndex];
                            const totalChannels = config?.channel_name?.length || 0;

                            if (totalChannels <= 1) {
                                return "This is the last channel in this configuration. The entire configuration will be deleted.";
                            } else {
                                return "This channel will be deleted";
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
                    <Tooltip title="Delete">
                        <span>
                            <Button
                                onClick={handleDelete}
                                color="error"
                                variant="contained"
                                disabled={saving}
                                startIcon={saving ? <CircularProgress size={16} /> : <DeleteIcon />}
                            >
                                {saving ? 'Deleting...' : 'Delete'}
                            </Button>
                        </span>
                    </Tooltip>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default StreamerConfigTable;