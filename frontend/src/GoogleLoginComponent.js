// GoogleLoginComponent.js
import React from 'react';
import { GoogleLogin } from 'react-google-login';
import { Button } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

const GoogleLoginComponent = ({ onSuccess, onFailure }) => {
  const clientId = '188656099171-j2toqn6u865c05epp4aggd8fgvm1k0oe.apps.googleusercontent.com'; 

  return (
    <GoogleLogin
      clientId={clientId}
      buttonText="Login with Google"
      onSuccess={onSuccess}
      onFailure={onFailure}
      cookiePolicy={'single_host_origin'}
      render={renderProps => (
        <Button
          onClick={renderProps.onClick}
          disabled={renderProps.disabled}
          variant="outlined"
          startIcon={<GoogleIcon />}
          className="login-icon"
          style={{ marginRight: '10px' }}
        >
          Google
        </Button>
      )}
    />
  );
};

export default GoogleLoginComponent;
