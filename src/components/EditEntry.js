// frontend/src/components/EditEntry.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

// --- Styled Components (Assumed to be the same, with AddressGroup adjusted) ---
const EditEntryPageContainer = styled.div`
  padding: 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const EditEntryFormContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 30px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
  box-sizing: border-box;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const AddressGroup = styled.div`
  display: grid;
  /* Adjust grid for address lines, or make them full width */
  grid-template-columns: 1fr; /* Each address line input takes full width initially */
  gap: 10px; /* Spacing between addressLine1, addressLine2, then the grid items */

  /* The inner grid for zipcode, city, floor, door */
  .sub-address-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 15px;
    margin-top: 5px; /* Spacing after addressLine2 */
  }
`;

const Label = styled.label`
  font-weight: bold;
  margin-bottom: 2px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 20px;
`;


const EditEntry = () => {
    const { entryId } = useParams();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    // ---- MODIFIED FOR ADDRESS ----
    const [addressLine1, setAddressLine1] = useState('');
    const [addressLine2, setAddressLine2] = useState('');
    // ---- END MODIFICATION ----
    const [zipcode, setZipcode] = useState('');
    const [city, setCity] = useState('');
    const [floor, setFloor] = useState('');
    const [door, setDoor] = useState('');
    const [telephone, setTelephone] = useState('');
    const [email, setEmail] = useState('');

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [originalEntry, setOriginalEntry] = useState(null);

    useEffect(() => {
        const fetchEntryData = async () => {
            setIsLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    setError("Authentication required.");
                    setIsLoading(false);
                    navigate('/');
                    return;
                }
                const response = await fetch(`/api/entries/${entryId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) {
                    const errData = await response.json().catch(() => ({ message: "Failed to fetch entry details." }));
                    throw new Error(errData.message || `API Error: ${response.status}`);
                }
                const result = await response.json();
                if (result.success && result.data) {
                    const entry = result.data;
                    setOriginalEntry(entry);
                    setName(entry.name || '');
                    // ---- MODIFIED FOR ADDRESS ----
                    setAddressLine1(entry.addressLine1 || '');
                    setAddressLine2(entry.addressLine2 || '');
                    // ---- END MODIFICATION ----
                    setZipcode(entry.zipcode || '');
                    setCity(entry.city || '');
                    setFloor(entry.floor || '');
                    setDoor(entry.door || '');
                    setTelephone(entry.telephone || '');
                    setEmail(entry.email || '');
                } else {
                    throw new Error(result.message || "Could not retrieve entry data.");
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        if (entryId) fetchEntryData();
    }, [entryId, navigate]);

    const handleZipcodeChange = (e) => setZipcode(e.target.value.replace(/[^0-9]/g, '').slice(0, 4));
    const handleTelephoneChange = (e) => setTelephone(e.target.value.replace(/[^0-9]/g, '').slice(0, 11));
    const isEmailValid = (emailToCheck) => {
        if (!emailToCheck && (originalEntry && !originalEntry.email)) return true;
        if (!emailToCheck) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(emailToCheck);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        // ---- MODIFIED FOR ADDRESS VALIDATION ----
        if (!name || !addressLine1 || !zipcode || !city || !telephone || !email) { // Check addressLine1
            setError('Please fill in Name, Address Line 1, Zipcode, City, Telephone, and Email.');
            setIsSubmitting(false);
            return;
        }
        // ---- END MODIFICATION ----
        if (!isEmailValid(email)) {
          setError('Invalid email address format.');
          setIsSubmitting(false);
          return;
        }

        // ---- MODIFIED FOR ADDRESS DATA ----
        const updatedEntryData = {
            name,
            addressLine1,
            addressLine2,
            zipcode,
            city,
            floor,
            door,
            telephone,
            email
        };
        // ---- END MODIFICATION ----
        console.log(`[EditEntry] Attempting to update entry ID ${entryId} with data:`, updatedEntryData);

        const token = localStorage.getItem('authToken');
        if (!token) {
            setError('Authentication error. Please log in again.');
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch(`/api/entries/${entryId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedEntryData)
            });
            if (!response.ok) {
                let errorMsg = 'Failed to update entry.';
                try {
                    const errorData = await response.json();
                    if (response.status === 400 && errorData.errors) {
                        errorMsg = `Validation failed: ${errorData.errors.map(err => err.msg).join(', ')}`;
                    } else if (errorData.message) {
                        errorMsg = errorData.message;
                    } else {
                         errorMsg = `Error: ${response.status} ${response.statusText}`;
                    }
                } catch (parseError) { console.error("Could not parse error response:", parseError) }
                throw new Error(errorMsg);
            }
            const result = await response.json();
            if (result.success) {
                alert('Entry updated successfully!');
                navigate('/data-viewer');
            } else {
                throw new Error(result.message || "Update operation failed at the API.");
            }
        } catch (err) {
            setError(err.message || 'An unexpected error occurred during update.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <EditEntryPageContainer><p>Loading entry data...</p></EditEntryPageContainer>;
    if (error && !originalEntry && !isLoading) {
         return (
            <EditEntryPageContainer>
                <h2>Edit Entry</h2>
                <p style={{ color: 'red' }}>Error loading entry: {error}</p>
                <button className="my-custom-button-style" onClick={() => navigate('/data-viewer')}>Back to Data Viewer</button>
            </EditEntryPageContainer>
        );
    }

    return (
        <EditEntryPageContainer>
            <EditEntryFormContainer>
                <h2 style={{ textAlign: 'center', marginBottom: '25px' }}>Edit Entry</h2>
                <p style={{ textAlign: 'center', fontSize: '0.9em', color: '#666' }}>Editing ID: {entryId}</p>
                {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

                <Form onSubmit={handleSubmit}>
                    <FormGroup>
                        <Label htmlFor="nameInput">Name:</Label>
                        <input
                            id="nameInput"
                            className="my-custom-input-style"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter full name"
                            disabled={isSubmitting}
                            required
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>Address:</Label>
                        <AddressGroup>
                             {/* ---- MODIFIED FOR ADDRESS ---- */}
                            <input
                                className="my-custom-input-style"
                                value={addressLine1}
                                onChange={(e) => setAddressLine1(e.target.value)}
                                placeholder="Address Line 1 (e.g., Street and Number)"
                                disabled={isSubmitting}
                                required
                            />
                            <input
                                className="my-custom-input-style"
                                value={addressLine2}
                                onChange={(e) => setAddressLine2(e.target.value)}
                                placeholder="Address Line 2 (e.g., Apt, Suite, Unit) (Optional)"
                                disabled={isSubmitting}
                            />
                             {/* ---- END MODIFICATION ---- */}
                            <div className="sub-address-grid">
                                <input
                                    className="my-custom-input-style"
                                    value={zipcode}
                                    onChange={handleZipcodeChange}
                                    maxLength={4}
                                    placeholder="Zip Code"
                                    disabled={isSubmitting}
                                    required
                                />
                                <input
                                    className="my-custom-input-style"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    placeholder="City"
                                    disabled={isSubmitting}
                                    required
                                />
                                <input
                                    className="my-custom-input-style"
                                    value={floor}
                                    onChange={(e) => setFloor(e.target.value)}
                                    placeholder="Floor (Optional)"
                                    disabled={isSubmitting}
                                />
                                <input
                                    className="my-custom-input-style"
                                    value={door}
                                    onChange={(e) => setDoor(e.target.value)}
                                    placeholder="Door (Optional)"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </AddressGroup>
                    </FormGroup>

                    <FormGroup>
                        <Label htmlFor="telInput">Telephone:</Label>
                        <input
                            id="telInput"
                            type="tel"
                            className="my-custom-input-style"
                            value={telephone}
                            onChange={handleTelephoneChange}
                            maxLength={11}
                            placeholder="Enter phone number"
                            disabled={isSubmitting}
                            required
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label htmlFor="emailInput">Email:</Label>
                        <input
                            id="emailInput"
                            type="email"
                            className="my-custom-input-style"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter email address"
                            disabled={isSubmitting}
                            required
                        />
                    </FormGroup>

                    <ButtonGroup>
                        <button
                            type="submit"
                            className="my-custom-button-style"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                            type="button"
                            className="my-custom-button-style"
                            onClick={() => navigate('/data-viewer')}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                    </ButtonGroup>
                </Form>
            </EditEntryFormContainer>
        </EditEntryPageContainer>
    );
};

export default EditEntry;