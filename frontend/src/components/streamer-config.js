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
    const [selectedResort, setSelectedResort] = useState(null);
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
        {
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
        {
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
        {
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
            if (!selectedResort) {
                setVerticalData([]);
                setHorizontalData([]);
                setDataLoaded(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const url = `${process.env.REACT_APP_LOCALHOST}/statistics/getAllStreamerConfig?resort_id=${encodeURIComponent(selectedResort.resort_id)}`;

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
    }, [selectedResort]);

    // Handle resort filter change
    const handleResortChange = (event, newValue) => {
        setSelectedResort(newValue || null);
        setEditingRow(null);
        setAddingVertical(false);
        setAddingHorizontal(false);
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

    // Updated transformDataToTableRows function
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

                tableRows.push({
                    id: `${config.streamer_config_id}-${i}-${signalLevel}`,
                    configIndex: configIndex,
                    channelIndex: i,
                    streamer_config_id: config.streamer_config_id,
                    no: globalRowIndex++,
                    channel_name: channelName,
                    multicast_ip: multicastIp,
                    port: port,
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

    // Combine vertical and horizontal data with section headers
    const getAllTableRows = () => {
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
        if (section === 'vertical') {
            setAddingVertical(true);
        } else {
            setAddingHorizontal(true);
        }

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

            const channel_name = newConfigData.map(row => ({ key: row.channel_name || '' }));
            const multicast_ip = newConfigData.map(row => ({ key: row.multicast_ip || '' }));
            const port = newConfigData.map(row => ({ key: row.port || '' }));

            const payload = {
                resort_id: selectedResort.resort_id,
                channel_name: channel_name,
                multicast_ip: multicast_ip,
                port: port,
                stb_no: newConfigData[0].stb_no,
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

            const url = `${process.env.REACT_APP_LOCALHOST}/statistics/getAllStreamerConfig?resort_id=${encodeURIComponent(selectedResort.resort_id)}`;
            const refreshResponse = await fetch(url);
            const data = await refreshResponse.json();
            setVerticalData(data.vertical || []);
            setHorizontalData(data.horizontal || []);

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

        const currentData = row.signal_level === 'vertical' ? verticalData : horizontalData;
        const originalConfig = currentData[row.configIndex];

        const formData = {
            channel_name: row.channel_name,
            multicast_ip: row.multicast_ip,
            port: row.port,
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

            const currentData = row.signal_level === 'vertical' ? verticalData : horizontalData;
            const setDataFunction = row.signal_level === 'vertical' ? setVerticalData : setHorizontalData;
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
            const signalLevel = row.signal_level;
            const currentData = signalLevel === 'vertical' ? verticalData : horizontalData;
            const setDataFunction = signalLevel === 'vertical' ? setVerticalData : setHorizontalData;

            const configIndex = row.configIndex;
            const configToDeleteFrom = currentData[configIndex];
            const totalChannels = configToDeleteFrom.channel_name?.length || 0;

            const countNonEmptyRows = () => {
                let count = 0;
                for (let i = 0; i < totalChannels; i++) {
                    const channelName = extractSafeValue(configToDeleteFrom.channel_name?.[i]);
                    const multicastIp = extractSafeValue(configToDeleteFrom.multicast_ip?.[i]);
                    const port = extractSafeValue(configToDeleteFrom.port?.[i]);

                    if (channelName.trim() !== '' || multicastIp.trim() !== '' || port.trim() !== '') {
                        count++;
                    }
                }
                return count;
            };

            const nonEmptyRowCount = countNonEmptyRows();

            // If there's only one non-empty row, delete entire configuration
            if (nonEmptyRowCount <= 1) {
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

                const refreshUrl = `${process.env.REACT_APP_LOCALHOST}/statistics/getAllStreamerConfig?resort_id=${encodeURIComponent(selectedResort.resort_id)}`;
                const refreshResponse = await fetch(refreshUrl);
                const data = await refreshResponse.json();
                setVerticalData(data.vertical || []);
                setHorizontalData(data.horizontal || []);

                showToast('Configuration deleted successfully!');
            } else {
                // If there are 2 or 3 rows, delete only the selected row and generate empty row
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

                // Add empty row to maintain structure (always ensure we have empty rows)
                updatedConfig.channel_name.push({ key: '' });
                updatedConfig.multicast_ip.push({ key: '' });
                updatedConfig.port.push({ key: '' });

                updatedData[configIndex] = updatedConfig;
                setDataFunction(updatedData);

                showToast('Channel deleted successfully!');
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
        const firstRow = newConfigData[0];
        return firstRow.channel_name.trim() !== '' &&
            firstRow.multicast_ip.trim() !== '' &&
            firstRow.port.trim() !== '' &&
            firstRow.stb_no.trim() !== '' &&
            firstRow.vc_no.trim() !== '';
    };

    // Export function
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
                    const stbNo = i === 0 ? extractSafeValue(config.stb_no) : '';
                    const vcNo = i === 0 ? extractSafeValue(config.vc_no) : '';
                    const trfcIp = i === 0 ? extractSafeValue(config.trfc_ip) : '';
                    const mngmntIp = i === 0 ? extractSafeValue(config.mngmnt_ip) : '';
                    const strm = i === 0 ? extractSafeValue(config.strm) : '';
                    const card = i === 0 ? extractSafeValue(config.card) : '';

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

        const verticalResult = transformDataForExcelWithStructure(verticalData, 1);
        const horizontalResult = transformDataForExcelWithStructure(horizontalData, verticalResult.nextNumber);

        if (verticalResult.data.length === 0 && horizontalResult.data.length === 0) {
            showErrorToast("No data to export.");
            return;
        }

        const wb = XLSX.utils.book_new();
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
        const range = XLSX.utils.decode_range(ws['!ref']);

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

        XLSX.utils.book_append_sheet(wb, ws, "Streamer Configuration");
        const filename = selectedResort ? `streamer_config_${selectedResort.resort_name.replace(/\s+/g, '_')}.xlsx` : 'streamer_config_all_data.xlsx';
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

                {selectedResort && !loading && dataLoaded && (
                    <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>
                        Showing data for resort: <strong>{selectedResort.resort_name}</strong>
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

            {dataLoaded && !loading && selectedResort && (
                <>
                    {(allTableRows.length === 0 && !addingVertical && !addingHorizontal) ? (
                        <Alert severity="info" sx={{ m: 2 }}>
                            No streamer data available for resort: {selectedResort.resort_name}.
                        </Alert>
                    ) : null}

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
                                            width: '80px',
                                            backgroundColor: 'rgb(86, 159, 223) !important',
                                            color: 'white',
                                        }}>NO</TableCell>

                                        <TableCell sx={{
                                            minWidth: '200px',
                                            backgroundColor: 'rgb(86, 159, 223) !important',
                                            color: 'white'
                                        }}>CHANNEL NAME</TableCell>

                                        <TableCell sx={{
                                            minWidth: '155px',
                                            backgroundColor: 'rgb(86, 159, 223) !important',
                                            color: 'white'
                                        }}>MULTICAST IP</TableCell>

                                        <TableCell align="center" sx={{
                                            width: '130px',
                                            backgroundColor: 'rgb(86, 159, 223) !important',
                                            color: 'white'
                                        }}>PORT</TableCell>

                                        <TableCell sx={{
                                            minWidth: '180px',
                                            backgroundColor: 'rgb(86, 159, 223) !important',
                                            color: 'white'
                                        }}>STB NO</TableCell>

                                        <TableCell sx={{
                                            minWidth: '120px',
                                            backgroundColor: 'rgb(86, 159, 223) !important',
                                            color: 'white'
                                        }}>VC NO</TableCell>

                                        <TableCell sx={{
                                            minWidth: '150px',
                                            backgroundColor: 'rgb(86, 159, 223) !important',
                                            color: 'white'
                                        }}>TRFC IP</TableCell>

                                        <TableCell sx={{
                                            minWidth: '150px',
                                            backgroundColor: 'rgb(86, 159, 223) !important',
                                            color: 'white'
                                        }}>MNGMNT IP</TableCell>

                                        <TableCell align="center" sx={{
                                            width: '80px',
                                            backgroundColor: 'rgb(86, 159, 223) !important',
                                            color: 'white'
                                        }}>STRM</TableCell>

                                        <TableCell align="center" sx={{
                                            width: '80px',
                                            backgroundColor: 'rgb(86, 159, 223) !important',
                                            color: 'white'
                                        }}>CARD</TableCell>

                                        {canAccess("streamerConfig", "edit") && (
                                            <TableCell
                                                align="center"
                                                sx={{
                                                    width: '140px',
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
                                    {/* VERTICAL SECTION */}
                                    <>
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

                                        {verticalData.length > 0 && transformDataToTableRows(verticalData, 'vertical').map((row, index, array) => (
                                            <React.Fragment key={row.id}>
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
                                                                    sx={{ minWidth: '120px' }}
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

                                        {renderAddRows('vertical')}

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

                                    {/* HORIZONTAL SECTION */}
                                    <>
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

                                        {horizontalData.length > 0 && transformDataToTableRows(horizontalData, 'horizontal').map((row, index, array) => (
                                            <React.Fragment key={row.id}>
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

                                        {renderAddRows('horizontal')}

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