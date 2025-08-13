import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  Divider,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack
} from '@mui/material';
import {
  Download as DownloadIcon,
  Upload as UploadIcon,
  FileDownload as FileDownloadIcon,
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Styled components
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const UploadBox = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.primary.main}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(3),
  textAlign: 'center',
  backgroundColor: theme.palette.action.hover,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
    borderColor: theme.palette.primary.dark,
  },
}));

interface ImportResult {
  success: boolean;
  message: string;
  data?: {
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  };
  errors?: string[];
}

const CSVOperations: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'accounts' | 'stocks'>('accounts');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

  const showAlert = (type: 'success' | 'error' | 'info', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const downloadCSV = async (endpoint: string, filename: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/csv/export/${endpoint}`);
      
      if (!response.ok) {
        throw new Error(`Failed to export ${endpoint}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showAlert('success', `${filename} downloaded successfully`);
    } catch (error) {
      console.error('Export error:', error);
      showAlert('error', `Failed to export ${filename}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async (type: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/csv/template/${type}`);
      
      if (!response.ok) {
        throw new Error(`Failed to download ${type} template`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}_template.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showAlert('success', `${type} template downloaded successfully`);
    } catch (error) {
      console.error('Template download error:', error);
      showAlert('error', `Failed to download ${type} template`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
        setSelectedFile(file);
        setImportResult(null);
      } else {
        showAlert('error', 'Please select a CSV file');
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      showAlert('error', 'Please select a CSV file first');
      return;
    }

    try {
      setUploadLoading(true);
      const formData = new FormData();
      formData.append('csvFile', selectedFile);

      const response = await fetch(`${API_BASE_URL}/api/csv/import/${importType}`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setImportResult(result);

      if (result.success) {
        showAlert('success', result.message);
        setSelectedFile(null);
      } else {
        showAlert('error', result.message);
      }
    } catch (error) {
      console.error('Import error:', error);
      showAlert('error', 'Failed to import CSV file');
    } finally {
      setUploadLoading(false);
    }
  };

  const exportOptions = [
    { key: 'accounts', label: 'Accounts', filename: 'accounts_export.csv' },
    { key: 'stocks', label: 'Stocks', filename: 'stocks_export.csv' },
    { key: 'portfolios', label: 'Portfolios', filename: 'portfolios_export.csv' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        CSV Data Management
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Export portfolio data to CSV or import bulk updates from CSV files
      </Typography>

      {alert && (
        <Alert severity={alert.type} sx={{ mb: 3 }} onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* Export Section */}
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <DownloadIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                Export Data
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Download your portfolio data as CSV files
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Stack spacing={2}>
                {exportOptions.map((option) => (
                  <Button
                    key={option.key}
                    variant="outlined"
                    fullWidth
                    startIcon={<FileDownloadIcon />}
                    onClick={() => downloadCSV(option.key, option.filename)}
                    disabled={loading}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Export {option.label}
                  </Button>
                ))}
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                CSV Templates
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Download template files to see the expected format
              </Typography>

              <Box sx={{ display: 'flex', gap: 1 }}>
                {['accounts', 'stocks'].map((type) => (
                  <Button
                    key={type}
                    variant="text"
                    size="small"
                    startIcon={<DescriptionIcon />}
                    onClick={() => downloadTemplate(type)}
                    disabled={loading}
                    sx={{ flex: 1 }}
                  >
                    {type} template
                  </Button>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Import Section */}
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <UploadIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                Import Data
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Upload CSV files to bulk update your data
              </Typography>

              <Divider sx={{ my: 2 }} />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Import Type</InputLabel>
                <Select
                  value={importType}
                  label="Import Type"
                  onChange={(e) => setImportType(e.target.value as 'accounts' | 'stocks')}
                >
                  <MenuItem value="accounts">Accounts</MenuItem>
                  <MenuItem value="stocks">Stocks</MenuItem>
                </Select>
              </FormControl>

              <UploadBox>
                <Button
                  component="label"
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  disabled={uploadLoading}
                >
                  Select CSV File
                  <VisuallyHiddenInput
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                  />
                </Button>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Select a CSV file to upload
                </Typography>
              </UploadBox>

              {selectedFile && (
                <Box sx={{ mt: 2 }}>
                  <Chip
                    icon={<DescriptionIcon />}
                    label={selectedFile.name}
                    onDelete={() => setSelectedFile(null)}
                    color="primary"
                    variant="outlined"
                  />
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleImport}
                      disabled={uploadLoading}
                      startIcon={uploadLoading ? <CircularProgress size={20} /> : <UploadIcon />}
                    >
                      {uploadLoading ? 'Importing...' : `Import ${importType}`}
                    </Button>
                  </Box>
                </Box>
              )}

              {importResult && (
                <Box sx={{ mt: 2 }}>
                  <Alert severity={importResult.success ? 'success' : 'error'}>
                    {importResult.message}
                  </Alert>
                  
                  {importResult.success && importResult.data && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Import Statistics:
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemIcon>
                            <CheckCircleIcon color="success" />
                          </ListItemIcon>
                          <ListItemText primary={`Created: ${importResult.data.created}`} />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <InfoIcon color="info" />
                          </ListItemIcon>
                          <ListItemText primary={`Updated: ${importResult.data.updated}`} />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <InfoIcon color="warning" />
                          </ListItemIcon>
                          <ListItemText primary={`Skipped: ${importResult.data.skipped}`} />
                        </ListItem>
                        {importResult.data.errors > 0 && (
                          <ListItem>
                            <ListItemIcon>
                              <ErrorIcon color="error" />
                            </ListItemIcon>
                            <ListItemText primary={`Errors: ${importResult.data.errors}`} />
                          </ListItem>
                        )}
                      </List>
                    </Box>
                  )}

                  {importResult.errors && importResult.errors.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="error" gutterBottom>
                        Import Errors:
                      </Typography>
                      <List dense>
                        {importResult.errors.slice(0, 5).map((error, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <ErrorIcon color="error" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary={error}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                        {importResult.errors.length > 5 && (
                          <ListItem>
                            <ListItemText 
                              primary={`... and ${importResult.errors.length - 5} more errors`}
                              primaryTypographyProps={{ variant: 'body2', style: { fontStyle: 'italic' } }}
                            />
                          </ListItem>
                        )}
                      </List>
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default CSVOperations;
