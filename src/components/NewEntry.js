import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';

const NewEntryContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
`;

const NewEntryForm = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  max-width: 400px;
  width: 100%;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  font-weight: bold;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px; /* Adjust the gap as needed */
`;

const Input = ({ value, setValue, placeholder }) => {
  return (
    <input
      className="my-custom-input-style"
      type="text"
      name="text"
      id="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      aria-label={placeholder}
    />
  );
};

const SubmitButton = ({ children, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="my-custom-button-style"
    >
      {children}
    </button>
  );
};

const NewEntry = () => {
  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [floor, setFloor] = useState('');
  const [door, setDoor] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');

  const navigate = useNavigate();

  const handleZipcodeChange = (e) => {
    const sanitizedValue = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
    setZipcode(sanitizedValue);
  };

  const handleTelephoneChange = (e) => {
    const sanitizedValue = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
    setTelephone(sanitizedValue);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const isEmailValid = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isEmailValid()) {
      alert('Invalid email address');
      return;
    }

    // Save data to the database or perform other actions

    // Navigate to another page
    navigate('/other-page');
  };

  return (
    <Layout isAuthenticated={true}>
      <NewEntryContainer>
        <h2>Add New Entry</h2>
        <NewEntryForm onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Name:</Label>
            <Input
              value={name}
              setValue={setName}
              placeholder="Enter your name"
            />
          </FormGroup>
          <FormGroup>
            <Label>Street:</Label>
            <Input
              type="text"
              value={street}
              setValue={setStreet}
              onChange={(e) => setStreet(e.target.value)}
            />
            <Input
              type="text"
              value={zipcode}
              setValue={setZipcode}
              onChange={(e) => setZipcode(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
              maxLength={4}
              placeholder="Postal code"
            />
            <Input
              type="text"
              value={floor}
              setValue={setFloor}
              onChange={(e) => setFloor(e.target.value)}
              placeholder="Floor"
            />
            <Input
              type="text"
              value={door}
              setValue={setDoor}
              onChange={(e) => setDoor(e.target.value)}
              placeholder="Door"
            />
          </FormGroup>
          <FormGroup>
            <Label>Telephone:</Label>
            <Input
              type="text"
              value={telephone}
              setValue={setTelephone}
              onChange={(e) => setTelephone(e.target.value.replace(/[^0-9]/g, '').slice(0, 11))}
              maxLength={11}
            />
          </FormGroup>
          <FormGroup>
            <Label>Email:</Label>
            <Input
              type="email"
              value={email}
              setValue={setEmail}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormGroup>
          <ButtonGroup>
            <SubmitButton type="submit">Save</SubmitButton>
            <SubmitButton type="button" onClick={() => navigate('/Dashboard')}>Back</SubmitButton>
          </ButtonGroup>
        </NewEntryForm>
      </NewEntryContainer>
    </Layout>
  );
};

export default NewEntry;
