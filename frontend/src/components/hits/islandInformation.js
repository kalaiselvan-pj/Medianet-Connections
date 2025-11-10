import React, { useState, useEffect } from 'react';
import AddIslandInformation from '../modals/addIslandInformation';
import ViewIslandDialog from '../modals/viewIslandModal.js'
import {
    Box,
    Button,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Tooltip,
    Chip,
    CircularProgress,
    Menu,
    MenuItem,
    Checkbox,
    Dialog,
    DialogTitle,
    DialogActions,
    TextField,
    Pagination,
    InputAdornment,
    FormControl,
    Select
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    MoreVert as MoreVertIcon,
    GetApp as DownloadIcon,
    Search as SearchIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter } from '@fortawesome/free-solid-svg-icons';
import { showErrorToast, showToast } from '../common/toaster';
import { canAccess } from '../../rbac/canAccess.js';
import * as XLSX from 'xlsx';


const IslandInformations = () => {
    const [showAddComponent, setShowAddComponent] = useState(false);
    const [islands, setIslands] = useState([]);
    const [loading, setLoading] = useState(true);

    // Menu state for each row - similar to RBAC example
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [selectedIsland, setSelectedIsland] = useState(null);

    const [selectedIslands, setSelectedIslands] = useState([]);
    const [editData, setEditData] = useState(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [viewIsland, setViewIsland] = useState(null);

    // Delete dialog state
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [deleteIsland, setDeleteIsland] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Search, Filter and Pagination states
    const [searchTerm, setSearchTerm] = useState('');
    const [atollFilter, setAtollFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [islandsPerPage] = useState(8);

    // Fetch islands data
    useEffect(() => {
        fetchIslands();
    }, []);

    const fetchIslands = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_LOCALHOST}/statistics/getIslandInformations`);

            if (!response.ok) {
                throw new Error('Failed to fetch island data');
            }

            const data = await response.json();
            let islandsData = [];

            if (Array.isArray(data)) {
                islandsData = data;
            } else if (data && Array.isArray(data.data)) {
                islandsData = data.data;
            } else if (data && data.success && Array.isArray(data.result)) {
                islandsData = data.result;
            } else if (data && data.islands) {
                islandsData = data.islands;
            } else {
                if (data && data.island_id) {
                    islandsData = [data];
                }
            }

            setIslands(islandsData);
        } catch (err) {
            console.error('Error fetching islands:', err);
            showErrorToast(err.message, 'error');
            setIslands([]);
        } finally {
            setLoading(false);
        }
    };

    // Filter islands based on search and filter
    const filteredIslands = islands.filter(island => {
        const matchesSearch = searchTerm === '' ||
            island.island_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            island.atoll?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            island.register_names?.some(name =>
                name?.toLowerCase().includes(searchTerm.toLowerCase())
            );

        const matchesAtoll = atollFilter === '' || island.atoll === atollFilter;

        return matchesSearch && matchesAtoll;
    });

    // Pagination
    const indexOfLastIsland = currentPage * islandsPerPage;
    const indexOfFirstIsland = indexOfLastIsland - islandsPerPage;
    const currentIslands = filteredIslands.slice(indexOfFirstIsland, indexOfLastIsland);
    const totalPages = Math.ceil(filteredIslands.length / islandsPerPage);

    // Get unique atolls for filter dropdown
    const atollOptions = [...new Set(islands.map(island => island.atoll).filter(Boolean))].sort();

    // Search handlers
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setCurrentPage(1);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
    };

    const handleAtollFilterChange = (event) => {
        setAtollFilter(event.target.value);
        setCurrentPage(1);
    };

    const handleClearAtollFilter = () => {
        setAtollFilter('');
    };

    // Menu handlers - similar to RBAC example
    const handleMenuOpen = (event, island) => {
        setMenuAnchorEl(event.currentTarget);
        setSelectedIsland(island);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
        setSelectedIsland(null);
    };

    // Island selection handlers
    const handleSelectIsland = (islandId) => {
        setSelectedIslands(prev => {
            if (prev.includes(islandId)) {
                return prev.filter(id => id !== islandId);
            } else {
                return [...prev, islandId];
            }
        });
    };

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            const currentPageIslandIds = currentIslands.map(island => island.island_id);
            setSelectedIslands(prev => {
                const newSelection = [...prev];
                currentPageIslandIds.forEach(id => {
                    if (!newSelection.includes(id)) {
                        newSelection.push(id);
                    }
                });
                return newSelection;
            });
        } else {
            const currentPageIslandIds = currentIslands.map(island => island.island_id);
            setSelectedIslands(prev => prev.filter(id => !currentPageIslandIds.includes(id)));
        }
    };

    const isAllSelected = currentIslands.length > 0 &&
        currentIslands.every(island => selectedIslands.includes(island.island_id));

    const isSomeSelected = currentIslands.some(island => selectedIslands.includes(island.island_id)) &&
        !isAllSelected;

    // Action handlers
    const handleAddClick = () => {
        setEditData(null);
        setShowAddComponent(true);
    };

    const handleCloseAddComponent = () => {
        setShowAddComponent(false);
        setEditData(null);
    };

    const handleSaveSuccess = () => {
        fetchIslands();
        handleCloseAddComponent();
    };

    const handleViewDetails = () => {
        if (selectedIsland) {
            setViewIsland(selectedIsland);
            setViewDialogOpen(true);
            handleMenuClose();
        }
    };

    const handleEdit = () => {
        if (selectedIsland) {
            const transformedData = {
                ...selectedIsland,
            };

            setEditData(transformedData);
            setShowAddComponent(true);
            handleMenuClose();
        }
    };

    const handleDelete = () => {
        if (selectedIsland) {
            setDeleteIsland(selectedIsland);
            setOpenDeleteDialog(true);
            handleMenuClose();
        }
    };

    // Delete confirmation
    const handleConfirmDelete = async () => {
        if (!deleteIsland) return;

        setDeleteLoading(true);
        try {
            const response = await fetch(
                `${process.env.REACT_APP_LOCALHOST}/statistics/deleteIslandInformation/${deleteIsland.island_id}`,
                {
                    method: 'DELETE',
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete island');
            }

            const result = await response.json();

            if (result.success) {
                showToast(`Island "${deleteIsland.island_name}" deleted successfully`, 'success');
                fetchIslands();
                setOpenDeleteDialog(false);
                setDeleteIsland(null);
            } else {
                throw new Error(result.error || 'Failed to delete island');
            }

        } catch (err) {
            console.error('Error deleting island:', err);
            showErrorToast(err.message, 'error');
        } finally {
            setDeleteLoading(false);
        }
    };

    // Helper functions for display
    const formatRegisterNames = (registerNames) => {
        if (!registerNames || registerNames.length === 0) {
            return '-';
        }

        const firstRegister = registerNames[0];
        if (registerNames.length === 1) {
            return firstRegister;
        }

        return (
            <Tooltip title={registerNames.join(', ')} arrow>
                <span>
                    {firstRegister} +{registerNames.length - 1}
                </span>
            </Tooltip>
        );
    };

    const StatusChip = ({ active, total }) => {
        if (active === null || active === undefined || total === null || total === undefined) {
            return '-';
        }

        const activeNum = parseInt(active) || 0;
        const totalNum = parseInt(total) || 0;
        const percentage = totalNum > 0 ? Math.round((activeNum / totalNum) * 100) : 0;
        let color = 'default';

        if (percentage >= 80) color = 'success';
        else if (percentage >= 50) color = 'warning';
        else color = 'error';

        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                    {activeNum}/{totalNum}
                </Typography>
                <Chip
                    label={`${percentage}%`}
                    color={color}
                    size="small"
                    variant="outlined"
                    sx={{
                        height: '22px',
                        '& .MuiChip-label': {
                            fontSize: '0.7rem',
                            px: 1
                        }
                    }}
                />
            </Box>
        );
    };

    // Download selected islands as CSV with proper column widths
    const exportToExcel = () => {
        if (selectedIslands.length === 0) {
            showErrorToast('Please select at least one island to download');
            return;
        }

        const selectedIslandsData = islands.filter(island =>
            selectedIslands.includes(island.island_id)
        );

        // Create CSV content WITHOUT the TVRO columns
        const headers = [
            'Island Name',
            'Atoll',
            'Total DTV Markets',
            'Active DTV Markets',
            'Total Corporate Markets',
            'Active Corporate Markets',
            'Register Names'
        ];

        // Map data to match the header order (without TVRO fields)
        const csvData = selectedIslandsData.map(island => [
            island.island_name || '',
            island.atoll || '',
            island.total_dtv_markets || 0,
            island.active_dtv_markets || 0,
            island.total_corporate_markets || 0,
            island.active_corporate_markets || 0,
            island.register_names ? island.register_names.join(', ') : ''
        ]);

        // Create CSV content with column width information
        const csvContent = [
            // Add column width information as a comment (Excel might ignore this in CSV, but it's good practice)
            '# Column Widths: Island Name=20, Atoll=15, Total DTV Markets=18, Active DTV Markets=18, Total Corporate Markets=22, Active Corporate Markets=22, Register Names=30',
            '\uFEFF' + headers.join(','), // BOM for UTF-8
            ...csvData.map(row =>
                row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
            )
        ].join('\n');

        // Create Excel file with proper column widths using SheetJS
        const createExcelWithColumnWidths = () => {
            // Check if SheetJS is available
            if (typeof XLSX === 'undefined') {
                console.warn('SheetJS not available, falling back to CSV');
                return null;
            }

            try {
                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.aoa_to_sheet([headers, ...csvData]);

                // Set column widths
                const colWidths = [
                    { wch: 20 }, // Island Name
                    { wch: 15 }, // Atoll
                    { wch: 18 }, // Total DTV Markets
                    { wch: 18 }, // Active DTV Markets
                    { wch: 22 }, // Total Corporate Markets
                    { wch: 22 }, // Active Corporate Markets
                    { wch: 30 }  // Register Names
                ];
                ws['!cols'] = colWidths;

                XLSX.utils.book_append_sheet(wb, ws, 'Islands Data');
                return wb;
            } catch (error) {
                console.error('Error creating Excel file:', error);
                return null;
            }
        };

        // Determine filename based on number of selected islands
        let filename;
        if (selectedIslands.length === 1) {
            // Single island - use "island name -island.csv" format
            const islandName = selectedIslandsData[0]?.island_name || 'island';
            // Clean the filename to remove any invalid characters
            const cleanIslandName = islandName.replace(/[^a-zA-Z0-9\s\-_]/g, '').replace(/\s+/g, ' ').trim();
            filename = `${cleanIslandName} -island.xlsx`;
        } else {
            // Multiple islands - use default name with date
            filename = `islands_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        }

        // Try to create Excel file first, fall back to CSV if SheetJS is not available
        const excelWorkbook = createExcelWithColumnWidths();
        if (excelWorkbook) {
            try {
                XLSX.writeFile(excelWorkbook, filename);
                showToast(`Downloaded ${selectedIslands.length} island(s) with formatted columns`, 'success');
                return;
            } catch (error) {
                console.error('Error downloading Excel file:', error);
                // Fall back to CSV
            }
        }

        // Fallback to CSV download
        const blob = new Blob([csvContent], {
            type: 'text/csv;charset=utf-8'
        });

        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename.replace('.xlsx', '.csv'));
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 100);

        showToast(`Downloaded ${selectedIslands.length} island(s) as CSV`, 'success');
    };

    return (
        <div>
            {/* Header Section - Similar to RBAC example */}
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: "20px" }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        {/* Search Field */}
                        <TextField
                            variant="outlined"
                            size="small"
                            placeholder="Search islands"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon className="mui-search-icon" />
                                    </InputAdornment>
                                ),
                                endAdornment: searchTerm && (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={handleClearSearch}
                                            edge="end"
                                            size="small"
                                        >
                                            <CloseIcon />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                width: '250px',
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
                                }
                            }}
                            className="mui-search-input"
                        />

                        <FormControl size="small" sx={{ width: "9.5rem" }}>
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
                                    zIndex: 1,
                                }}
                            />
                            <Select
                                value={atollFilter}
                                onChange={handleAtollFilterChange}
                                displayEmpty
                                sx={{
                                    pl: 4,
                                    borderRadius: "10px",
                                    fontWeight: "bold",
                                    fontSize: "14px",
                                    backgroundColor: "#f0f0f0",
                                    height: "2.3rem",
                                }}
                            >
                                <MenuItem value=""><em>All Atolls</em></MenuItem>
                                {atollOptions.map((atoll) => (
                                    <MenuItem key={atoll} value={atoll}>
                                        {atoll}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<DownloadIcon />}
                            onClick={exportToExcel}
                            sx={{
                                borderRadius: "9px",
                                textTransform: "none",
                                backgroundColor: "green",
                                '&:hover': { backgroundColor: '#2e7d32' },
                                minWidth: 150
                            }}
                        >
                            Download {selectedIslands.length > 0 ? `(${selectedIslands.length})` : ''}
                        </Button>

                        {canAccess("islandInformations", "edit") && (
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleAddClick}
                                sx={{
                                    borderRadius: "10px",
                                    textTransform: "none",
                                    backgroundColor: "#1976d2",
                                    color: "white",
                                    fontWeight: "bold",
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "8px 12px",
                                    height: "2.3rem",
                                    width: "5rem",
                                    '&:hover': { backgroundColor: '#1e5dbd' },
                                }}
                            >
                                Add
                            </Button>
                        )}
                    </Box>
                </Box>
            </div>

            {/* Table Section - Clean like RBAC example */}
            <Paper sx={{ height: "76vh", overflow: "auto" }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox" sx={{ backgroundColor: '#0670a4', color: 'white' }}>
                                <Checkbox
                                    indeterminate={isSomeSelected}
                                    checked={isAllSelected}
                                    onChange={handleSelectAll}
                                    sx={{ color: 'white' }}
                                    size="small"
                                />
                            </TableCell>
                            <TableCell sx={{ backgroundColor: '#0670a4', color: 'white', fontWeight: 'bold' }}>
                                Island Name
                            </TableCell>
                            <TableCell sx={{ backgroundColor: '#0670a4', color: 'white', fontWeight: 'bold' }}>
                                Atoll
                            </TableCell>
                            <TableCell sx={{ backgroundColor: '#0670a4', color: 'white', fontWeight: 'bold' }}>
                                Register Name(s)
                            </TableCell>
                            <TableCell sx={{ backgroundColor: '#0670a4', color: 'white', fontWeight: 'bold' }} align="center">
                                DTV Markets
                            </TableCell>
                            <TableCell sx={{ backgroundColor: '#0670a4', color: 'white', fontWeight: 'bold' }} align="center">
                                Corporate Markets
                            </TableCell>
                            <TableCell sx={{ backgroundColor: '#0670a4', color: 'white', fontWeight: 'bold' }} align="center">
                                Actions
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {currentIslands.map((island) => (
                            <TableRow key={island.island_id} hover>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={selectedIslands.includes(island.island_id)}
                                        onChange={() => handleSelectIsland(island.island_id)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>{island.island_name || 'N/A'}</TableCell>
                                <TableCell>{island.atoll || 'N/A'}</TableCell>
                                <TableCell>
                                    {formatRegisterNames(island.register_names)}
                                </TableCell>
                                <TableCell align="center">
                                    <StatusChip
                                        active={island.active_dtv_markets}
                                        total={island.total_dtv_markets}
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <StatusChip
                                        active={island.active_corporate_markets}
                                        total={island.total_corporate_markets}
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Tooltip title="Actions" arrow>
                                        <IconButton onClick={(e) => handleMenuOpen(e, island)}>
                                            <MoreVertIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>

            {/* Footer with Pagination */}
            <Box sx={{ marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#638499" }}>
                    Total Islands: {filteredIslands.length}
                    {atollFilter && ` (Filtered by: ${atollFilter})`}
                </Typography>

                <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={(event, value) => setCurrentPage(value)}
                    color="primary"
                    size="medium"
                    showFirstButton
                    showLastButton
                />
            </Box>

            {/* Action Menu*/}
            <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <MenuItem onClick={handleViewDetails}>
                    <ViewIcon fontSize="small" style={{ marginRight: 8, color: "#1976d2" }} />
                    View
                </MenuItem>
                {canAccess("islandInformations", "edit") && (
                    <MenuItem onClick={handleEdit}>
                        <EditIcon fontSize="small" style={{ marginRight: 8, color: "#1976d2" }} />
                        Edit
                    </MenuItem>
                )}
                {canAccess("islandInformations", "edit") && (
                    <MenuItem onClick={handleDelete} style={{ color: '#d32f2f' }}>
                        <DeleteIcon fontSize="small" style={{ marginRight: 8 }} />
                        Delete
                    </MenuItem>
                )}
            </Menu>

            {/* Delete Confirmation Dialog - Similar to RBAC example */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>
                    Are you sure you want to delete island "{deleteIsland?.island_name}"?
                </DialogTitle>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
                    <Button
                        onClick={handleConfirmDelete}
                        color="error"
                        disabled={deleteLoading}
                        startIcon={deleteLoading ? <CircularProgress size={16} /> : null}
                    >
                        {deleteLoading ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add/Edit Modal */}
            {showAddComponent && (
                <AddIslandInformation
                    open={showAddComponent}
                    onClose={handleCloseAddComponent}
                    onSave={handleSaveSuccess}
                    editData={editData}
                />
            )}

            {/* View Modal */}
            <ViewIslandDialog
                viewDialogOpen={viewDialogOpen}
                setViewDialogOpen={setViewDialogOpen}
                viewIsland={viewIsland}
            />
        </div>
    );
};

export default IslandInformations;