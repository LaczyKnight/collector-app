import React, { useState } from 'react';
import styled from 'styled-components';
import '../Global.css';
import Layout from './Layout';


const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
`;

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
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

const Input = ({ type = 'text', value, setValue, placeholder }) => {
  return (
    <input
      className="my-custom-input-style"
      type={type}
      name="text"
      id="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      aria-label={placeholder}
    />
  );
};

const SaveButton = ({ children, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="my-custom-button-style"
    >
      {children}
    </button>
  );
};

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    // Your login logic goes here
  };

  return (
    <Layout isLoginPage={true}>
    <LoginContainer>
      <LoginForm onSubmit={handleLogin}>
        <FormGroup>
          <Label>Username:</Label>
          <Input
            value={username}
            setValue={setUsername}
            placeholder="Enter your username"
          />
        </FormGroup>
        <FormGroup>
          <Label>Password:</Label>
          <Input
            type="password"
            value={password}
            setValue={setPassword}
            placeholder="Enter your password"
          />
        </FormGroup>
        <SaveButton type="submit">Login</SaveButton>
      </LoginForm>
    </LoginContainer>
    </Layout>
  );
};

export default Login;
