// Demo OTP service without Redis dependency
class OTPService {
  constructor() {
    this.OTP_EXPIRY = 300000; // 5 minutes in milliseconds
    this.otpStore = new Map(); // In-memory store for demo
  }

  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOTP(phone) {
    try {
      const otp = this.generateOTP();
      const expiryTime = Date.now() + this.OTP_EXPIRY;
      
      // Store OTP in memory with expiry time
      this.otpStore.set(phone, { otp, expiryTime });
      
      // Clean up expired OTPs periodically
      this.cleanupExpiredOTPs();
      
      // In development mode, show OTP in console
      if (process.env.NODE_ENV === 'development') {
        console.log(`📱 OTP for ${phone}: ${otp} (valid for 5 minutes)`);
        return { success: true, message: 'OTP sent successfully (check console in dev mode)' };
      }
      
      return { success: true, message: 'OTP sent successfully' };
    } catch (error) {
      console.error('Error sending OTP:', error);
      return { success: false, message: 'Failed to send OTP' };
    }
  }

  async verifyOTP(phone, otp) {
    try {
      const storedData = this.otpStore.get(phone);
      
      if (!storedData) {
        return { success: false, message: 'OTP expired or not found' };
      }
      
      // Check if OTP has expired
      if (Date.now() > storedData.expiryTime) {
        this.otpStore.delete(phone);
        return { success: false, message: 'OTP expired' };
      }
      
      if (storedData.otp !== otp) {
        return { success: false, message: 'Invalid OTP' };
      }
      
      // Delete OTP after successful verification
      this.otpStore.delete(phone);
      
      return { success: true, message: 'OTP verified successfully' };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { success: false, message: 'Failed to verify OTP' };
    }
  }

  // Clean up expired OTPs to prevent memory leaks
  cleanupExpiredOTPs() {
    const now = Date.now();
    for (const [phone, data] of this.otpStore.entries()) {
      if (now > data.expiryTime) {
        this.otpStore.delete(phone);
      }
    }
  }
}

export default new OTPService();