const nodemailer = require('nodemailer');

/**
 * Send transaction email notifications
 * @param {string} email - Recipient email
 * @param {number} amount - Transaction amount
 * @param {number} balance - Current balance
 * @param {string} type - Transaction type (topup, payment, etc.)
 * @param {number} fee - Platform fee (if any)
 * @param {number} previousBalance - Balance before transaction
 */
async function sendTransactionEmail(email, amount, balance, type, fee = 0, previousBalance = 0) {
  // Skip if no email provided
  if (!email) {
    console.log('No email provided, skipping email notification');
    return;
  }

  try {
    // Create transporter (configure with your email service)
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email content based on transaction type
    let subject, html;

    if (type === 'topup') {
      subject = '✅ Elite Pay - Top-up Successful';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Top-up Successful</h2>
          <p>Your Elite Pay card has been topped up successfully.</p>
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Amount:</strong> ₹${amount.toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>New Balance:</strong> ₹${balance.toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p style="color: #6B7280; font-size: 12px;">Thank you for using Elite Pay!</p>
        </div>
      `;
    } else if (type === 'payment') {
      subject = '💳 Elite Pay - Payment Receipt';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Payment Receipt</h2>
          <p>Your payment has been processed successfully.</p>
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Amount Paid:</strong> ₹${amount.toFixed(2)}</p>
            ${fee > 0 ? `<p style="margin: 5px 0;"><strong>Platform Fee:</strong> ₹${fee.toFixed(2)}</p>` : ''}
            <p style="margin: 5px 0;"><strong>Previous Balance:</strong> ₹${previousBalance.toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>New Balance:</strong> ₹${balance.toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p style="color: #6B7280; font-size: 12px;">Thank you for using Elite Pay!</p>
        </div>
      `;
    } else {
      subject = '📧 Elite Pay - Transaction Notification';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Transaction Notification</h2>
          <p>A transaction was made on your Elite Pay card.</p>
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Amount:</strong> ₹${amount.toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Balance:</strong> ₹${balance.toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p style="color: #6B7280; font-size: 12px;">Thank you for using Elite Pay!</p>
        </div>
      `;
    }

    // Send email (only if credentials are configured)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail({
        from: `"Elite Pay" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: subject,
        html: html
      });
      console.log(`Email sent to ${email}`);
    } else {
      console.log(`Email would be sent to ${email}:`, subject);
      console.log('Configure EMAIL_USER and EMAIL_PASS in .env to enable email sending');
    }
  } catch (error) {
    console.error('Error sending email:', error.message);
    // Don't throw error - email failure shouldn't break the transaction
  }
}

module.exports = {
  sendTransactionEmail
};
