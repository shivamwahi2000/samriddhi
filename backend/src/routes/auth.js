import express from 'express';
import { sendOTP, verifyOTPAndLogin, register, refreshToken, logout, checkUser, getProfile } from '../controllers/auth.js';

const router = express.Router();

// Send OTP to phone number
router.post('/send-otp', sendOTP);

// Verify OTP and login/register
router.post('/verify-otp', verifyOTPAndLogin);

// Login existing user with OTP
router.post('/login', verifyOTPAndLogin);

// Register with KYC data
router.post('/register', register);

// Check if user exists and has PIN
router.post('/check-user', checkUser);

// Get user profile
router.get('/profile', getProfile);

// Refresh access token
router.post('/refresh', refreshToken);

// Logout
router.post('/logout', logout);

export default router;