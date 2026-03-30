const config = require('../config/env');
const redisClient = require('../config/redis');
const { isRedisReady } = require('../config/redis');

// In-memory OTP fallback when Redis is unavailable
const otpStore = new Map();

class WhatsAppService {
  constructor() {
    this.apiVersion = 'v21.0';
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
    this.phoneNumberId = config.WHATSAPP.PHONE_NUMBER_ID;
    this.accessToken = config.WHATSAPP.ACCESS_TOKEN;
    this.businessAccountId = config.WHATSAPP.BUSINESS_ACCOUNT_ID;
  }

  _isConfigured() {
    return (
      this.accessToken &&
      this.phoneNumberId &&
      this.accessToken !== 'your_whatsapp_access_token' &&
      this.phoneNumberId !== 'your_phone_number_id'
    );
  }

  /**
   * Format phone number to E.164 format (India default)
   */
  _formatPhone(phone) {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      cleaned = `91${cleaned}`;
    }
    if (!cleaned.startsWith('+')) {
      cleaned = `+${cleaned}`;
    }
    return cleaned;
  }

  /**
   * Send a WhatsApp message via Meta Cloud API
   */
  async _sendMessage(to, payload) {
    if (!this._isConfigured()) {
      console.log(`[WhatsApp Skipped] To: ${to}, Type: ${payload.type}`);
      return { success: true, skipped: true, reason: 'WhatsApp not configured' };
    }

    const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
    const body = {
      messaging_product: 'whatsapp',
      to: this._formatPhone(to),
      ...payload,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('WhatsApp API Error:', JSON.stringify(data));
        throw new Error(data.error?.message || 'WhatsApp API request failed');
      }

      console.log('WhatsApp message sent:', data.messages?.[0]?.id);
      return { success: true, messageId: data.messages?.[0]?.id, data };
    } catch (error) {
      console.error('WhatsApp send error:', error.message);
      throw error;
    }
  }

  /**
   * Send a template message
   */
  async _sendTemplate(to, templateName, languageCode = 'en', components = []) {
    return this._sendMessage(to, {
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components: components.length > 0 ? components : undefined,
      },
    });
  }

  /**
   * Send a text message (requires 24-hour conversation window)
   */
  async _sendText(to, text) {
    return this._sendMessage(to, {
      type: 'text',
      text: { body: text },
    });
  }

  // ─── OTP / Verification ──────────────────────────────────────

  /**
   * Generate and send OTP for phone verification
   */
  async sendOTP(phone, purpose = 'verification') {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const key = `otp:${phone}:${purpose}`;
    const ttl = 300; // 5 minutes

    // Store OTP in Redis or fallback to in-memory
    if (isRedisReady()) {
      await redisClient.setEx(key, ttl, JSON.stringify({ otp, attempts: 0 }));
    } else {
      otpStore.set(key, {
        otp,
        attempts: 0,
        expiresAt: Date.now() + ttl * 1000,
      });
    }

    // Send via WhatsApp template
    try {
      const result = await this._sendTemplate(phone, 'otp_verification', 'en', [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: otp },
          ],
        },
      ]);

      return {
        success: true,
        messageId: result.messageId,
        expiresIn: ttl,
        message: 'OTP sent via WhatsApp',
      };
    } catch (error) {
      // If WhatsApp fails, still return success — OTP is stored, user could re-request
      console.error('WhatsApp OTP send failed:', error.message);
      return {
        success: true,
        expiresIn: ttl,
        message: 'OTP generated (WhatsApp delivery may be delayed)',
        fallback: true,
      };
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(phone, otp, purpose = 'verification') {
    const key = `otp:${phone}:${purpose}`;
    let storedData;

    // Retrieve from Redis or in-memory
    if (isRedisReady()) {
      const data = await redisClient.get(key);
      if (!data) {
        return { verified: false, message: 'OTP expired or not found' };
      }
      storedData = JSON.parse(data);
    } else {
      storedData = otpStore.get(key);
      if (!storedData || storedData.expiresAt < Date.now()) {
        otpStore.delete(key);
        return { verified: false, message: 'OTP expired or not found' };
      }
    }

    // Check max attempts (5)
    if (storedData.attempts >= 5) {
      // Delete OTP after max attempts
      if (isRedisReady()) {
        await redisClient.del(key);
      } else {
        otpStore.delete(key);
      }
      return { verified: false, message: 'Maximum verification attempts exceeded' };
    }

    // Verify OTP
    if (storedData.otp === otp) {
      // OTP verified — delete it
      if (isRedisReady()) {
        await redisClient.del(key);
      } else {
        otpStore.delete(key);
      }
      return { verified: true, message: 'Phone number verified successfully' };
    }

    // Wrong OTP — increment attempts
    storedData.attempts += 1;
    if (isRedisReady()) {
      const ttl = await redisClient.ttl(key);
      await redisClient.setEx(key, ttl > 0 ? ttl : 300, JSON.stringify(storedData));
    }

    return {
      verified: false,
      message: 'Invalid OTP',
      attemptsRemaining: 5 - storedData.attempts,
    };
  }

  // ─── Order Notifications ─────────────────────────────────────

  /**
   * Send order confirmation via WhatsApp
   */
  async sendOrderConfirmation(phone, orderNumber, amount, itemCount) {
    try {
      return await this._sendTemplate(phone, 'order_confirmation', 'en', [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: orderNumber },
            { type: 'text', text: `₹${amount}` },
            { type: 'text', text: `${itemCount}` },
          ],
        },
      ]);
    } catch (error) {
      console.error('WhatsApp order confirmation failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send order shipped notification
   */
  async sendOrderShipped(phone, orderNumber, trackingNumber, carrier) {
    try {
      return await this._sendTemplate(phone, 'order_shipped', 'en', [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: orderNumber },
            { type: 'text', text: carrier || 'our courier partner' },
            { type: 'text', text: trackingNumber || 'N/A' },
          ],
        },
      ]);
    } catch (error) {
      console.error('WhatsApp order shipped failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send order cancellation notification
   */
  async sendOrderCancelled(phone, orderNumber, reason) {
    try {
      return await this._sendTemplate(phone, 'order_cancelled', 'en', [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: orderNumber },
            { type: 'text', text: reason || 'as per your request' },
          ],
        },
      ]);
    } catch (error) {
      console.error('WhatsApp order cancellation failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(phone, orderNumber, amount, paymentId) {
    try {
      return await this._sendTemplate(phone, 'payment_confirmation', 'en', [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: orderNumber },
            { type: 'text', text: `₹${amount}` },
            { type: 'text', text: paymentId },
          ],
        },
      ]);
    } catch (error) {
      console.error('WhatsApp payment confirmation failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a custom text message (within 24-hour window only)
   */
  async sendCustomMessage(phone, message) {
    try {
      return await this._sendText(phone, message);
    } catch (error) {
      console.error('WhatsApp custom message failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new WhatsAppService();
