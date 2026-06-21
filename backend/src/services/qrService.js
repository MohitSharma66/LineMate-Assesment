const QRCode = require('qrcode');
const crypto = require('crypto');

// Generate a unique QR code for a booking
const generateQRCode = async (bookingId) => {
  try {
    const verifyUrl = `${process.env.APP_URL}/verify/${bookingId}`;
    const qrCodeData = await QRCode.toDataURL(verifyUrl);
    return qrCodeData;
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw error;
  }
};

// Generate verification token
const generateVerificationToken = (bookingId) => {
  const secret = process.env.JWT_SECRET;
  const token = crypto
    .createHmac('sha256', secret)
    .update(bookingId)
    .digest('hex')
    .substring(0, 12);
  return token;
};

module.exports = { generateQRCode, generateVerificationToken };