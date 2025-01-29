import React from 'react';
import styled from 'styled-components';
import logoImage from '../Rebel.PNG'; // Replace with the actual path to your logo image

const LogoContainer = styled.div`
  /* Add any styling for your logo container */
`;

const Logo = () => {
  return (
    <LogoContainer>
      <img src={logoImage} alt="Logo" />
      {/* You can customize the styling and size of your logo here */}
    </LogoContainer>
  );
};

export default Logo;