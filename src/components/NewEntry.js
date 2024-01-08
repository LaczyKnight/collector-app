import React, { useState } from 'react';
import styled from 'styled-components';

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
  border: 1px solid #ccc;
  border-radius: 8px;
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

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const SubmitButton = styled.button`
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  cursor: pointer;
  width: 100%;
  font-size: 16px;

  &:hover {
    background-color: #0056b3;
  }
`;

const NewEntry = () => {
  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [floor, setFloor] = useState('');
  const [door, setDoor] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');

  const handleZipcodeChange = (e) => {
    // Csak számokat engedünk át és az irányítószámot maximum 4 karakter hosszúnak korlátozzuk
    const sanitizedValue = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
    setZipcode(sanitizedValue);
  };

  const handleTelephoneChange = (e) => {
    // Csak számokat engedünk át és a telefonszámot maximum 11 karakter hosszúnak korlátozzuk
    const sanitizedValue = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
    setTelephone(sanitizedValue);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const isEmailValid = () => {
    // Egyszerű email validáció regex segítségével
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validációk ellenőrzése
    if (!isEmailValid()) {
      alert('Érvénytelen e-mail cím');
      return;
    }

    const formData = {
      name,
      street,
      zipcode,
      floor,
      door,
      telephone,
      email
    };

    // Itt meghívd az adatokat adatbázisba mentő függvényt vagy szolgáltatást
    console.log(formData);
    // Példa: fetch('szerver-url', { method: 'POST', body: JSON.stringify(formData) });
  };

  return (
    <NewEntryContainer>
      <h2>Új Bejegyzés Hozzáadása</h2>
      <NewEntryForm onSubmit={handleSubmit}>
        <FormGroup>
          <Label>Név:</Label>
          <Input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </FormGroup>
        <FormGroup>
          <Label>Cím:</Label>
          <Input type="text" value={street} onChange={(e) => setStreet(e.target.value)} />
          <Input
            type="text"
            value={zipcode}
            onChange={handleZipcodeChange}
            maxLength={4}
            placeholder="Irányítószám"
          />
          <Input type="text" value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="Emelet" />
          <Input type="text" value={door} onChange={(e) => setDoor(e.target.value)} placeholder="Ajtó" />
        </FormGroup>
        <FormGroup>
          <Label>Telefonszám:</Label>
          <Input type="text" value={telephone} onChange={handleTelephoneChange} maxLength={11} />
        </FormGroup>
        <FormGroup>
          <Label>Email:</Label>
          <Input type="email" value={email} onChange={handleEmailChange} />
        </FormGroup>
        <SubmitButton type="submit">Mentés</SubmitButton>
      </NewEntryForm>
    </NewEntryContainer>
  );
};

export default NewEntry;
