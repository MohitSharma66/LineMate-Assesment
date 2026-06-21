const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, html) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: [to],
      subject,
      html
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error };
    }

    console.log('Email sent:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error };
  }
};

// Booking confirmation email with seat numbers
const sendBookingConfirmation = async (userEmail, userName, eventName, seats, bookingId, seatLabels = []) => {
  // Ensure seatLabels is an array
  const labels = Array.isArray(seatLabels) ? seatLabels : [];
  
  // Format seat labels for display
  const seatList = labels.length > 0 
    ? labels.join(', ') 
    : `${seats} seat${seats > 1 ? 's' : ''}`;

  console.log(`Sending email for ${userName}: ${seats} seats, labels:`, labels);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
      <h2 style="color: #2563eb; margin-bottom: 20px;">Booking Confirmed! 🎉</h2>
      <p>Hello <strong>${userName}</strong>,</p>
      <p>Your booking has been confirmed for:</p>
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p><strong>Event:</strong> ${eventName}</p>
        <p><strong>Seats:</strong> <span style="color: #2563eb; font-weight: bold;">${seatList}</span></p>
        <p><strong>Total Seats:</strong> ${seats}</p>
        <p><strong>Booking ID:</strong> ${bookingId}</p>
      </div>
      <p style="font-size: 14px; color: #6b7280;">Present this email or your QR code at the venue.</p>
      <a href="${process.env.CLIENT_URL}/bookings" 
         style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">
        View My Bookings
      </a>
      <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">Thank you for using our service!</p>
    </div>
  `;

  return sendEmail(userEmail, `Booking Confirmed: ${eventName} (${seatList})`, html);
};

// Waitlist notification email
const sendWaitlistNotification = async (userEmail, userName, eventName, seatLabels = []) => {
  const labels = Array.isArray(seatLabels) ? seatLabels : [];
  const seatList = labels.length > 0 ? labels.join(', ') : 'a seat';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
      <h2 style="color: #16a34a;">You're Off the Waitlist! 🎉</h2>
      <p>Hello <strong>${userName}</strong>,</p>
      <p>Good news! A spot has opened up for:</p>
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p><strong>Event:</strong> ${eventName}</p>
        <p><strong>Seat${labels.length > 1 ? 's' : ''}:</strong> <span style="color: #16a34a; font-weight: bold;">${seatList}</span></p>
      </div>
      <p>A seat has been automatically booked for you. Check your bookings to see the details!</p>
      <a href="${process.env.CLIENT_URL}/bookings" 
         style="display: inline-block; background: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">
        View My Bookings
      </a>
    </div>
  `;

  return sendEmail(userEmail, `Seat Available: ${eventName}`, html);
};

// Booking cancellation email
const sendBookingCancellation = async (userEmail, userName, eventName, seats, seatLabels = []) => {
  const labels = Array.isArray(seatLabels) ? seatLabels : [];
  const seatList = labels.length > 0 ? labels.join(', ') : `${seats} seat${seats > 1 ? 's' : ''}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
      <h2 style="color: #dc2626;">Booking Cancelled</h2>
      <p>Hello <strong>${userName}</strong>,</p>
      <p>Your booking has been cancelled for:</p>
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p><strong>Event:</strong> ${eventName}</p>
        <p><strong>Seats:</strong> ${seatList}</p>
      </div>
      <p>The seats have been released back to inventory.</p>
    </div>
  `;

  return sendEmail(userEmail, `Booking Cancelled: ${eventName}`, html);
};

module.exports = {
  sendBookingConfirmation,
  sendWaitlistNotification,
  sendBookingCancellation
};