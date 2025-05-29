// frontend/src/components/NewEntry.js
import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

// --- Styled Components (Assumed to be the same) ---
const NewEntryPageContainer = styled.div`
  padding: 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const NewEntryFormContainer = styled.div`
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

// Input and SubmitButton components are assumed to be the same (using className for global styles)


const NewEntry = () => {
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
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleZipcodeChange = (e) => {
    setZipcode(e.target.value.replace(/[^0-9]/g, '').slice(0, 4));
  };

  const handleTelephoneChange = (e) => {
    setTelephone(e.target.value.replace(/[^0-9]/g, '').slice(0, 11));
  };

  const isEmailValid = (emailToCheck) => {
    if (!emailToCheck) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailToCheck);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsLoading(true);

    // ---- MODIFIED FOR ADDRESS VALIDATION ----
    if (!name || !addressLine1 || !zipcode || !city || !telephone || !email) { // Check addressLine1
        setFormError('Please fill in Name, Address Line 1, Zipcode, City, Telephone, and Email.');
        setIsLoading(false);
        return;
    }
    // ---- END MODIFICATION ----
    if (!isEmailValid(email)) {
      setFormError('Invalid email address format.');
      setIsLoading(false);
      return;
    }

    // ---- MODIFIED FOR ADDRESS DATA ----
    const entryData = {
        name,
        addressLine1,
        addressLine2, // Will be empty string if not filled, which is fine for optional
        zipcode,
        city,
        floor,
        door,
        telephone,
        email
    };
    // ---- END MODIFICATION ----
    console.log('Attempting to save data:', entryData);

    const token = localStorage.getItem('authToken');
    if (!token) {
        setFormError('Authentication error. Please log in again.');
        setIsLoading(false);
        return;
    }

    const TARGET_URL = '/api/entries';
    try {
        const response = await fetch(TARGET_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(entryData)
        });

        if (!response.ok) {
            let errorMsg = 'Failed to save entry. Please try again.';
            try {
                const errorData = await response.json();
                if (response.status === 400 && errorData.errors) {
                     errorMsg = `Validation failed: ${errorData.errors.map(err => err.msg).join(', ')}`;
                } else if (errorData.message) {
                    errorMsg = errorData.message;
                } else {
                    errorMsg = `Error: ${response.status} ${response.statusText}`;
                }
            } catch (parseError) {
                 console.error("Could not parse error response:", parseError)
                 errorMsg = `Server returned status ${response.status}. Please try again.`;
            }
            if (response.status === 401 || response.status === 403) {
                 errorMsg = 'Authentication failed. Please log in again.';
            }
            throw new Error(errorMsg);
        }

        const savedEntry = await response.json();
        console.log('Entry saved successfully:', savedEntry);
        alert('Entry saved successfully!');
        navigate('/dashboard');

    } catch (error) {
        console.error("Failed to save entry:", error);
        setFormError(error.message || 'An unexpected error occurred.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <NewEntryPageContainer>
      <NewEntryFormContainer>
        <h2 style={{ textAlign: 'center', marginBottom: '25px' }}>Add New Entry</h2>
        {formError && <p style={{ color: 'red', textAlign: 'center' }}>{formError}</p>}
        <Form onSubmit={handleSubmit}>
           <FormGroup>
            <Label htmlFor="nameInput">Name:</Label>
            <input
              id="nameInput"
              className="my-custom-input-style"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter full name"
              disabled={isLoading}
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
                    disabled={isLoading}
                    required // Assuming addressLine1 is required
                />
                <input
                    className="my-custom-input-style"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="Address Line 2 (e.g., Apt, Suite, Unit) (Optional)"
                    disabled={isLoading}
                />
                {/* ---- END MODIFICATION ---- */}
                <div className="sub-address-grid"> {/* Inner grid for remaining address parts */}
                    <input
                        className="my-custom-input-style"
                        value={zipcode}
                        onChange={handleZipcodeChange}
                        maxLength={4}
                        placeholder="Zip Code"
                        disabled={isLoading}
                        required
                    />
                    <input
                        className="my-custom-input-style"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        disabled={isLoading}
                        required
                    />
                    <input
                        className="my-custom-input-style"
                        value={floor}
                        onChange={(e) => setFloor(e.target.value)}
                        placeholder="Floor (Optional)"
                        disabled={isLoading}
                    />
                    <input
                        className="my-custom-input-style"
                        value={door}
                        onChange={(e) => setDoor(e.target.value)}
                        placeholder="Door (Optional)"
                        disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
              required
            />
          </FormGroup>

          <ButtonGroup>
            <button type="submit" className="my-custom-button-style" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Entry'}
            </button>
            <button type="button" className="my-custom-button-style" onClick={() => navigate('/dashboard')} disabled={isLoading}>
                Cancel
            </button>
          </ButtonGroup>
        </Form>
      </NewEntryFormContainer>
    </NewEntryPageContainer>
  );
};

export default NewEntry;