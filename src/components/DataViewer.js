// frontend/src/components/DataViewer.js
import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';

// --- Styled Components Definitions (Keep these as they are from your previous file) ---
const FullPageContainer = styled.div`
  padding: 20px 30px;
  min-height: 100vh;
  box-sizing: border-box;
  background-color: #e9ecef;
  display: flex;
  flex-direction: column;
`;

const HeaderSection = styled.div`
  margin-bottom: 20px;
  border-bottom: 1px solid #ced4da;
  padding-bottom: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    margin-top: 0;
    margin-bottom: 5px;
    color: #343a40;
  }
  p {
    color: #495057;
    font-size: 0.9rem;
    margin-top: 0;
  }
`;

const BackLink = styled(Link)`
  font-size: 0.9rem;
  color: #007bff;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const ControlsContainer = styled.div`
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  margin-bottom: 25px;
`;

const SearchForm = styled.form`
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
  margin-bottom: 15px;
`;

const SearchInput = styled.input`
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  flex-grow: 1;
  min-width: 250px;
  font-size: 1rem;
  &:focus {
    border-color: #80bdff;
    box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
    outline: none;
  }
`;

const SearchButton = styled.button`
  padding: 10px 20px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.15s ease-in-out;
  &:hover { background-color: #218838; }
  &:disabled { background-color: #cccccc; cursor: not-allowed; }
`;

const QueryButtonsContainer = styled.div`
  h4 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #495057;
    font-size: 0.95rem;
  }
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center; /* To align Export button if it's taller */
`;

const QueryButton = styled.button`
  padding: 8px 15px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  &:hover { background-color: #5a6268; }
  &:disabled { background-color: #cccccc; cursor: not-allowed; }
`;

const ExportButton = styled(QueryButton)` // Can extend QueryButton or use global styles
  background-color: #17a2b8; // A different color for export
  &:hover { background-color: #138496; }
`;


const DataTableContainer = styled.div`
  overflow-x: auto;
  width: 100%;
`;

const DataTable = styled.table`
  width: 100%;
  min-width: 800px;
  border-collapse: collapse;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  border-radius: 8px;
  overflow: hidden;

  th, td {
    border: 1px solid #dee2e6;
    padding: 10px 12px;
    text-align: left;
    font-size: 0.875rem;
    white-space: nowrap;
  }

  td {
    &.allow-wrap {
        white-space: normal;
    }
    &.actions-cell {
      text-align: center;
      white-space: nowrap;
    }
  }

  th {
    background-color: #f1f3f5;
    font-weight: 600;
    color: #495057;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  tbody tr:nth-of-type(even) { background-color: #f8f9fa; }
  tbody tr:hover { background-color: #e9ecef; }
`;

const ActionButtonContainer = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
`;


const StatusMessage = styled.p`
  padding: 15px;
  margin-top: 20px;
  border-radius: 4px;
  text-align: center;
  font-weight: 500;
  &.loading { background-color: #cce5ff; color: #004085; border: 1px solid #b8daff; }
  &.error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
  &.no-data { background-color: #fff3cd; color: #856404; border: 1px solid #ffeeba; }
`;

const PaginationControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);

  button {
    padding: 8px 12px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    &:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
  }
  span {
    font-size: 0.9rem;
    color: #495057;
  }
`;
// --- End Styled Components Definitions ---

const TABLE_COLUMNS = [
    { key: 'name', header: 'Name' },
    { key: 'addressLine1', header: 'Address Line 1', allowWrap: true },
    { key: 'addressLine2', header: 'Address Line 2', allowWrap: true },
    { key: 'zipcode', header: 'Zip Code' },
    { key: 'city', header: 'City' },
    { key: 'floor', header: 'Floor' },
    { key: 'door', header: 'Door' },
    { key: 'telephone', header: 'Telephone' },
    { key: 'email', header: 'Email', allowWrap: true },
    { key: 'createdAt', header: 'Created At'},
    { key: 'actions', header: 'Actions', notSortable: true }
];

const ITEMS_PER_PAGE = 10;

const DataViewer = () => {
    const [data, setData] = useState([]);
    const [currentQuery, setCurrentQuery] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalRecords, setTotalRecords] = useState(0);
    // --- NEW STATE FOR EXPORT LOADING ---
    const [isExporting, setIsExporting] = useState(false);

    const navigate = useNavigate();

    const fetchDataFromAPI = useCallback(async (searchQuery, page = 1) => {
        // ... (fetchDataFromAPI logic remains the same as your last version) ...
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError("Authentication token not found. Please log in.");
                setIsLoading(false);
                return;
            }
            const params = new URLSearchParams();
            if (searchQuery && searchQuery.trim() !== "") {
                params.append('search', searchQuery.trim());
            }
            params.append('page', page.toString());
            params.append('limit', ITEMS_PER_PAGE.toString());
            const response = await fetch(`/api/entries/query?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Server error: ${response.statusText} (Status: ${response.status})` }));
                throw new Error(errorData.message || `API Error: ${response.status}`);
            }
            const result = await response.json();
            if (result.success) {
                setData(result.data);
                setCurrentPage(result.pagination.currentPage);
                setTotalPages(result.pagination.totalPages);
                setTotalRecords(result.pagination.totalRecords);
                setCurrentQuery(searchQuery);
            } else {
                throw new Error(result.message || "Failed to fetch data from API.");
            }
        } catch (err) {
            console.error("DataViewer: Error in fetchDataFromAPI", err);
            setError(err.message);
            setData([]);
            setTotalPages(0);
            setTotalRecords(0);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDataFromAPI(currentQuery, currentPage);
    }, [fetchDataFromAPI, currentQuery, currentPage]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        setCurrentQuery(searchInput);
    };

    const handlePredefinedQuery = (predefinedQueryString) => {
        setSearchInput(predefinedQueryString);
        setCurrentPage(1);
        setCurrentQuery(predefinedQueryString);
    };

    const goToPage = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
            setCurrentPage(newPage);
        }
    };

    const handleEdit = (entryId) => {
        console.log("Edit entry with ID:", entryId);
        navigate(`/edit-entry/${entryId}`);
    };

    const handleDelete = async (entryId, entryName) => {
        // ... (handleDelete logic remains the same as your last version) ...
        console.log("Attempting to delete entry with ID:", entryId);
        if (window.confirm(`Are you sure you want to delete the entry "${entryName || 'this entry'}"? This action cannot be undone.`)) {
            setIsSubmitting(true);
            setError(null);
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    setError("Authentication token not found.");
                    setIsSubmitting(false);
                    return;
                }
                const response = await fetch(`/api/entries/${entryId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: "Failed to delete entry. Server error."}));
                    throw new Error(errorData.message || `API Error: ${response.status}`);
                }
                const result = await response.json();
                if (result.success) {
                    alert('Entry deleted successfully!');
                    if (data.length === 1 && currentPage > 1) {
                        setCurrentPage(prevPage => prevPage -1);
                    } else {
                        fetchDataFromAPI(currentQuery, currentPage);
                    }
                } else {
                    throw new Error(result.message || "Failed to delete entry despite OK response.");
                }
            } catch (err) {
                console.error("Error deleting entry:", err);
                setError(err.message || "Failed to delete entry.");
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    // --- NEW FUNCTION FOR CSV EXPORT ---
    const handleExportCSV = async () => {
        console.log("Attempting to export entries to CSV...");
        setIsExporting(true); // Use new loading state
        setError(null); // Clear previous errors
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError("Authentication token not found. Please log in.");
                setIsExporting(false);
                return;
            }

            const exportUrl = '/api/entries/export/csv';
            const response = await fetch(exportUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                let errorMsg = 'Failed to export CSV.';
                // Try to parse error from backend if it's JSON
                if (response.headers.get('content-type')?.includes('application/json')) {
                    const errorData = await response.json().catch(() => null);
                    errorMsg = errorData?.message || `Server error during export: ${response.status}`;
                } else {
                    const textError = await response.text(); // Get raw text if not JSON
                    errorMsg = `Server error during export: ${response.status} - ${textError || response.statusText}`;
                }
                throw new Error(errorMsg);
            }

            // Create a Blob from the CSV data and trigger download
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;

            // Try to get filename from Content-Disposition header
            const contentDisposition = response.headers.get('content-disposition');
            let filename = 'entries.csv'; // Default filename
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
                if (filenameMatch && filenameMatch.length > 1) {
                    filename = filenameMatch[1];
                }
            }
            link.setAttribute('download', filename);

            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl); // Clean up

            console.log("CSV export download triggered.");
            // Optionally show a success message via state, or just rely on browser download
            // alert("CSV export started. Your browser will download the file.");

        } catch (err) {
            console.error("Error exporting CSV:", err);
            setError(err.message || "Failed to export data."); // Show error in existing error display
        } finally {
            setIsExporting(false);
        }
    };
    // --- END OF NEW FUNCTION ---


    return (
        <FullPageContainer>
            <HeaderSection>
                <div>
                    <h2>Customer Data Viewer</h2>
                    <p>Query, view, and manage customer information.</p>
                </div>
                <BackLink to="/dashboard">Back to Dashboard</BackLink>
            </HeaderSection>

            <ControlsContainer>
                <SearchForm onSubmit={handleSearchSubmit}>
                    <SearchInput
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search by Name, Address, City, Email etc..."
                        disabled={isLoading || isSubmitting || isExporting}
                    />
                    <SearchButton type="submit" disabled={isLoading || isSubmitting || isExporting}>
                        {isLoading ? 'Searching...' : 'Search'}
                    </SearchButton>
                </SearchForm>
                <QueryButtonsContainer>
                    <h4>Example Searches:</h4>
                    <QueryButton onClick={() => handlePredefinedQuery("New York")} disabled={isLoading || isSubmitting || isExporting}>City: New York</QueryButton>
                    <QueryButton onClick={() => handlePredefinedQuery("acme.com")} disabled={isLoading || isSubmitting || isExporting}>Email @acme.com</QueryButton>
                    <QueryButton onClick={() => handlePredefinedQuery("")} disabled={isLoading || isSubmitting || isExporting}>Show All</QueryButton>
                     {/* --- NEW EXPORT BUTTON --- */}
                    <ExportButton onClick={handleExportCSV} disabled={isLoading || isSubmitting || isExporting}>
                        {isExporting ? 'Exporting...' : 'Export All to CSV'}
                    </ExportButton>
                     {/* --- END OF NEW BUTTON --- */}
                </QueryButtonsContainer>
            </ControlsContainer>

            {/* Adjust loading messages to reflect multiple types of loading */}
            {(isLoading && !isSubmitting && !isExporting) && <StatusMessage className="loading">Loading data...</StatusMessage>}
            {isSubmitting && <StatusMessage className="loading">Processing action...</StatusMessage>}
            {isExporting && <StatusMessage className="loading">Preparing export...</StatusMessage>}
            {error && <StatusMessage className="error">Error: {error}</StatusMessage>}


            {!isLoading && !error && data.length === 0 && (
                <StatusMessage className="no-data">No data found for your query.</StatusMessage>
            )}

            {!isLoading && data.length > 0 && (
                <>
                    <DataTableContainer>
                        <DataTable>
                            <thead>
                                <tr>
                                    {TABLE_COLUMNS.map(col => <th key={col.key}>{col.header}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item) => (
                                    <tr key={item._id}>
                                        {TABLE_COLUMNS.map(col => {
                                            if (col.key === 'actions') {
                                                return (
                                                    <td key={`${item._id}-actions`} className="actions-cell">
                                                        <ActionButtonContainer>
                                                            <button
                                                                onClick={() => handleEdit(item._id)}
                                                                className="my-custom-button-style my-custom-button-style--edit"
                                                                disabled={isLoading || isSubmitting || isExporting}
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(item._id, item.name)}
                                                                className="my-custom-button-style my-custom-button-style--delete"
                                                                disabled={isLoading || isSubmitting || isExporting}
                                                            >
                                                                Delete
                                                            </button>
                                                        </ActionButtonContainer>
                                                    </td>
                                                );
                                            }
                                            return (
                                                <td key={`${item._id}-${col.key}`} className={col.allowWrap ? 'allow-wrap' : ''}>
                                                    { (col.key === 'createdAt' || col.key === 'updatedAt') && item[col.key]
                                                        ? new Date(item[col.key]).toLocaleString()
                                                        : (item[col.key] !== undefined && item[col.key] !== null && item[col.key] !== '') ? String(item[col.key]) : 'N/A'
                                                    }
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </DataTable>
                    </DataTableContainer>
                    <PaginationControls>
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage <= 1 || isLoading || isSubmitting || isExporting}>
                            Previous
                        </button>
                        <span>Page {currentPage} of {totalPages || 1} (Total: {totalRecords} records)</span>
                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage >= totalPages || isLoading || isSubmitting || isExporting}>
                            Next
                        </button>
                    </PaginationControls>
                </>
            )}
        </FullPageContainer>
    );
};
export default DataViewer;