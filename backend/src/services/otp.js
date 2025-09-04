import redisClient from '../config/redis.js';

class OTPService {
  constructor() {
    this.OTP_EXPIRY = 300; // 5 minutes in seconds
  }

  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOTP(phone) {
    try {
      const otp = this.generateOTP();
      const key = `otp:${phone}`;
      
      // Store OTP in Redis with expiry
      await redisClient.setEx(key, this.OTP_EXPIRY, otp);
      
      // In production, integrate with Twilio or other SMS service
      if (process.env.NODE_ENV === 'development') {
        console.log(`📱 OTP for ${phone}: ${otp}`);
        return { success: true, message: 'OTP sent successfully (check console in dev mode)' };
      }
      
      // TODO: Implement actual SMS sending
      // const message = `Your Samriddhi OTP is: ${otp}. Valid for 5 minutes.`;
      // await this.sendSMS(phone, message);
      
      return { success: true, message: 'OTP sent successfully' };
    } catch (error) {
      console.error('Error sending OTP:', error);
      return { success: false, message: 'Failed to send OTP' };
    }
  }

  async verifyOTP(phone, otp) {
    try {
      const key = `otp:${phone}`;
      const storedOTP = await redisClient.get(key);
      
      if (!storedOTP) {
        return { success: false, message: 'OTP expired or not found' };
      }
      
      if (storedOTP !== otp) {
        return { success: false, message: 'Invalid OTP' };
      }
      
      // Delete OTP after successful verification
      await redisClient.del(key);
      
      return { success: true, message: 'OTP verified successfully' };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { success: false, message: 'Failed to verify OTP' };
    }
  }

  async sendSMS(phone, message) {
    // TODO: Implement Twilio or other SMS service
    // const client = twilio(accountSid, authToken);
    // await client.messages.create({
    //   body: message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phone,
    // });
  }
}

export default new OTPService();