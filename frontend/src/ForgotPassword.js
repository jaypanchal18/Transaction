import React, { useState } from 'react';
import Navbar from './navbar'; // Import your Navbar component
import { TextField, Button, Typography, Box } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Auth.css';  // Importing CSS for styling

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState('request'); // 'request' or 'reset'
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrors({});
    setMessage('');

    if (!email) {
      setErrors({ email: "Email is required" });
      return;
    }

    try {
      await axios.post(`http://localhost:5000/forgot-password`, { email });
      setStep('reset'); // Move to OTP entry step
      setMessage('OTP has been sent to your email.');
    } catch (error) {
      console.error('Error requesting OTP:', error);  // Log the error to console
      setMessage(error.response?.data?.msg || 'An error occurred while requesting OTP.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrors({});
    setMessage('');

    if (!otp) setErrors(prev => ({ ...prev, otp: "OTP is required" }));
    if (!newPassword) setErrors(prev => ({ ...prev, newPassword: "New password is required" }));

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      await axios.post(`http://localhost:5000/reset-password`, { email, otp, password: newPassword });
      navigate('/login'); // Redirect to login page
    } catch (error) {
      console.error('Error resetting password:', error);  // Log the error to console
      setMessage(error.response?.data?.msg || 'An error occurred while resetting password.');
    }
  };

  return (
    <div>
      <Navbar />
      <div className="forgot-password-container">
        <Box className="forgot-password-box">
          <Typography variant="h5" component="h1" className="forgot-password-title">
            {step === 'request' ? 'Forgot Password' : 'Reset Password'}
          </Typography>
          {step === 'request' ? (
            <form onSubmit={handleRequestOtp}>
              <TextField
                label="Enter Your Registered Email"
                type="email"
                variant="outlined"
                fullWidth
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
              />
              <Button
                variant="contained"
                className="forgot-password-button"
                fullWidth
                type="submit"
              >
                Request OTP
              </Button>
              {message && <Typography variant="body2" color={message.startsWith('Error') ? 'error' : 'primary'} className="forgot-password-message">{message}</Typography>}
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              <TextField
                label="OTP"
                type="text"
                variant="outlined"
                fullWidth
                margin="normal"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                error={!!errors.otp}
                helperText={errors.otp}
              />
              <TextField
                label="New Password"
                type="password"
                variant="outlined"
                fullWidth
                margin="normal"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={!!errors.newPassword}
                helperText={errors.newPassword}
              />
              <Button
                variant="contained"
                className="forgot-password-button"
                fullWidth
                type="submit"
              >
                Reset Password
              </Button>
              {message && <Typography variant="body2" color={message.startsWith('Error') ? 'error' : 'primary'} className="forgot-password-message">{message}</Typography>}
            </form>
          )}
        </Box>
      </div>
    </div>
  );
}

export default ForgotPassword;
