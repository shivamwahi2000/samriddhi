import twilio from 'twilio';
import axios from 'axios';

class OTPService {
  constructor() {
    this.OTP_EXPIRY = 300000; // 5 minutes in milliseconds
    this.otpStore = new Map(); // In-memory store
    
    // Initialize Twilio client if credentials are available
    this.twilioClient = null;
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    }
  }

  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOTP(phone) {
    try {
      const otp = this.generateOTP();
      const expiryTime = Date.now() + this.OTP_EXPIRY;
      
      // Store OTP in memory
      this.otpStore.set(phone, { otp, expiryTime });
      
      // Clean up expired OTPs
      this.cleanupExpiredOTPs();
      
      const message = `Your Samriddhi OTP is: ${otp}. Valid for 5 minutes. Do not share with anyone.`;
      
      // Try multiple delivery methods
      const deliveryResults = await this.tryMultipleDeliveryMethods(phone, message, otp);
      
      console.log(`📱 OTP for ${phone}: ${otp} (${deliveryResults.method})`);
      
      // Check if we had to fall back to console due to quota limits
      if (deliveryResults.method === 'Console (Development Mode)') {
        return { 
          success: true, 
          message: `OTP generated but delivery services are temporarily unavailable. In production, configure backup SMS service.`,
          deliveryMethod: deliveryResults.method,
          isConsoleFallback: true
        };
      }
      
      return { 
        success: true, 
        message: `OTP sent successfully via ${deliveryResults.method}`,
        deliveryMethod: deliveryResults.method
      };
    } catch (error) {
      console.error('Error sending OTP:', error);
      return { success: false, message: 'Failed to send OTP' };
    }
  }

  async tryMultipleDeliveryMethods(phone, message, otp) {
    const methods = [];
    
    // Method 1: Try Green API (WhatsApp Business API) first since it's configured
    if (process.env.GREEN_API_ID && process.env.GREEN_API_TOKEN) {
      try {
        await this.sendWhatsAppViaGreenAPI(phone, message);
        return { success: true, method: 'WhatsApp (Green API)' };
      } catch (error) {
        console.log('Green API delivery failed:', error.message);
        
        // Check if it's a quota exceeded error (status 466)
        if (error.message.includes('466')) {
          console.log('⚠️ Green API quota exceeded. Contact support to upgrade plan.');
          methods.push('Green API - Quota exceeded');
        } else {
          methods.push('Green API failed');
        }
      }
    }
    
    // Method 2: Try SMS via Twilio
    if (this.twilioClient && process.env.TWILIO_PHONE_NUMBER) {
      try {
        await this.sendSMS(phone, message);
        return { success: true, method: 'SMS (Twilio)' };
      } catch (error) {
        console.log('SMS delivery failed:', error.message);
        methods.push('SMS failed');
      }
    }
    
    // Method 3: Try WhatsApp via Twilio
    if (this.twilioClient && process.env.TWILIO_WHATSAPP_NUMBER) {
      try {
        await this.sendWhatsApp(phone, message);
        return { success: true, method: 'WhatsApp (Twilio)' };
      } catch (error) {
        console.log('WhatsApp delivery failed:', error.message);
        methods.push('WhatsApp failed');
      }
    }
    
    // Method 4: Try Fast2SMS (Indian SMS service)
    if (process.env.FAST2SMS_API_KEY) {
      try {
        await this.sendSMSViaFast2SMS(phone, otp);
        return { success: true, method: 'SMS (Fast2SMS)' };
      } catch (error) {
        console.log('Fast2SMS delivery failed:', error.message);
        methods.push('Fast2SMS failed');
      }
    }
    
    // Fallback: Console log (for development)
    console.log('All delivery methods failed, showing in console only');
    console.log(`📱 OTP for ${phone}: ${otp} (Console fallback due to quota limits)`);
    return { success: true, method: 'Console (Development Mode)' };
  }

  async sendSMS(phone, message) {
    if (!this.twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
      throw new Error('Twilio SMS not configured');
    }
    
    await this.twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
  }

  async sendWhatsApp(phone, message) {
    if (!this.twilioClient || !process.env.TWILIO_WHATSAPP_NUMBER) {
      throw new Error('Twilio WhatsApp not configured');
    }
    
    await this.twilioClient.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${phone}`,
    });
  }

  async sendWhatsAppViaGreenAPI(phone, message) {
    if (!process.env.GREEN_API_ID || !process.env.GREEN_API_TOKEN) {
      throw new Error('Green API not configured');
    }
    
    const cleanPhone = phone.replace('+', '').replace('-', '').replace(' ', '');
    console.log(`🔍 Green API: Sending to ${cleanPhone}@c.us`);
    
    const payload = {
      chatId: `${cleanPhone}@c.us`,
      message: message,
    };
    
    console.log('📤 Green API payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(
      `https://7105.api.greenapi.com/waInstance${process.env.GREEN_API_ID}/sendMessage/${process.env.GREEN_API_TOKEN}`,
      payload
    );
    
    console.log('📥 Green API response:', response.data);
    
    if (!response.data.idMessage) {
      throw new Error('Green API failed to send message');
    }
  }

  async sendSMSViaFast2SMS(phone, otp) {
    if (!process.env.FAST2SMS_API_KEY) {
      throw new Error('Fast2SMS not configured');
    }
    
    const cleanPhone = phone.replace('+91', '').replace('+', '');
    
    const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
      params: {
        authorization: process.env.FAST2SMS_API_KEY,
        variables_values: otp,
        route: 'otp',
        numbers: cleanPhone,
      }
    });
    
    if (response.data.return === false) {
      throw new Error('Fast2SMS failed: ' + response.data.message);
    }
  }

  async verifyOTP(phone, otp) {
    try {
      console.log(`🔍 Verifying OTP for ${phone}, provided: ${otp}`);
      console.log(`📦 Stored OTPs:`, Array.from(this.otpStore.entries()));
      const storedData = this.otpStore.get(phone);
      
      if (!storedData) {
        console.log(`❌ No OTP found for ${phone}`);
        return { success: false, message: 'OTP expired or not found' };
      }
      
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