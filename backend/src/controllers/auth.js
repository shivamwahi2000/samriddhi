import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import otpService from '../services/otp-real.js';

const formatPhone = (phone) => {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Handle Indian numbers
  if (digits.length === 10) {
    return `+91${digits}`;
  } else if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  } else if (phone.startsWith('+91') && digits.length === 12) {
    return phone;
  }
  
  return phone; // Return as-is if format is unclear
};

export const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone || !/^\+?[1-9]\d{9,14}$/.test(phone)) {
      return res.status(400).json({ error: 'Valid phone number is required' });
    }

    const formattedPhone = formatPhone(phone);
    console.log(`🔍 Sending OTP: ${phone} → ${formattedPhone}`);
    const result = await otpService.sendOTP(formattedPhone);
    
    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(500).json({ error: result.message });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const verifyOTPAndLogin = async (req, res) => {
  try {
    const { phone, otp, pin, name, nameHindi, userType } = req.body;
    const isLoginAttempt = req.path === '/login';
    
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required' });
    }

    const formattedPhone = formatPhone(phone);
    console.log(`🔍 Verifying OTP: ${phone} → ${formattedPhone}`);
    const otpResult = await otpService.verifyOTP(formattedPhone, otp);
    
    if (!otpResult.success) {
      return res.status(400).json({ error: otpResult.message });
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { phone: formattedPhone },
    });

    if (isLoginAttempt) {
      // For login, user must exist and PIN must match
      if (!user) {
        return res.status(404).json({ error: 'Account not found. Please sign up first.' });
      }
      
      if (user.pin && pin) {
        const pinMatch = await bcrypt.compare(pin, user.pin);
        if (!pinMatch) {
          return res.status(400).json({ error: 'Invalid PIN' });
        }
      } else if (user.pin && !pin) {
        return res.status(400).json({ error: 'PIN is required' });
      }
    } else {
      // For verify-otp (sign up flow), create user if doesn't exist
      if (!user) {
        if (!name) {
          return res.status(400).json({ error: 'Name is required for new users' });
        }

        user = await prisma.user.create({
          data: {
            phone: formattedPhone,
            name,
            nameHindi,
            userType: userType || 'individual',
            kycStatus: 'pending',
            languagePreference: 'en',
          },
        });
      }
    }

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { userId: user.id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Remove sensitive data from response
    const { aadhaarHash, ...userResponse } = user;

    res.json({
      message: isLoginAttempt ? 'Login successful' : 'Verification successful',
      user: userResponse,
      token: accessToken,
      accessToken,
      refreshToken,
      userType: user.userType
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    const newAccessToken = jwt.sign(
      { userId: user.id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
};

export const register = async (req, res) => {
  try {
    const { phone, userType, fullName, email, pin, ...otherData } = req.body;
    
    if (!phone || !fullName || !email) {
      return res.status(400).json({ error: 'Phone, name and email are required' });
    }

    const formattedPhone = formatPhone(phone);
    
    // Hash PIN if provided
    let hashedPin = null;
    if (pin) {
      if (!/^\d{4}$/.test(pin)) {
        return res.status(400).json({ error: 'PIN must be 4 digits' });
      }
      hashedPin = await bcrypt.hash(pin, 10);
    }
    
    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { phone: formattedPhone },
    });

    if (user) {
      // Update existing user with KYC data
      user = await prisma.user.update({
        where: { phone: formattedPhone },
        data: {
          name: fullName,
          email,
          pin: hashedPin || user.pin,
          userType: userType || 'individual',
          kycStatus: 'completed',
        },
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          phone: formattedPhone,
          name: fullName,
          email,
          pin: hashedPin,
          userType: userType || 'individual',
          kycStatus: 'completed',
          languagePreference: 'hi',
        },
      });
    }

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { userId: user.id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    const { aadhaarHash, ...userResponse } = user;

    res.json({
      message: 'Registration successful',
      user: userResponse,
      token: accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logout = async (req, res) => {
  try {
    // In a production app, you might want to blacklist the token
    // For now, just send success response
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkUser = async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Phone number required' });
    }

    const formattedPhone = formatPhone(phone);
    const user = await prisma.user.findUnique({
      where: { phone: formattedPhone },
    });

    res.json({
      exists: !!user,
      hasPin: !!(user?.pin),
      userType: user?.userType
    });
  } catch (error) {
    console.error('Check user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove sensitive data
    const { pin, aadhaarHash, ...profileData } = user;

    res.json(profileData);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};