const nodemailer = require("nodemailer");

// Replace with your email and app password (or other SMTP)
const TRANSPORTER_CONFIG = {
  service: "gmail",
  auth: {
    user: "devensawant4554@gmail.com",       // <-- replace
    pass: "MumbaiS1$"           // <-- replace (app password)
  }
};

const transporter = nodemailer.createTransport(TRANSPORTER_CONFIG);

// Generate professional HTML email template for transactions
function generateTransactionEmailHTML(amount, balance, transactionType = "payment", fee = 0, previousBalance = null) {
  const transactionDate = new Date().toLocaleString('en-IN', { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Asia/Kolkata'
  });

  const isDebit = transactionType === "payment";
  const sign = isDebit ? "-" : "+";
  const color = isDebit ? "#EA4335" : "#34A853";
  const icon = isDebit ? "💳" : "💰";
  const action = isDebit ? "Paid" : "Received";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transaction Receipt</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 600px;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Elite Pay</h1>
              <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Digital Wallet Transaction</p>
            </td>
          </tr>
          
          <!-- Transaction Icon -->
          <tr>
            <td style="padding: 30px 20px 20px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: ${color}15; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                <span style="font-size: 40px;">${icon}</span>
              </div>
            </td>
          </tr>
          
          <!-- Transaction Amount -->
          <tr>
            <td style="padding: 0 20px 20px; text-align: center;">
              <p style="color: #666666; margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Amount ${action}</p>
              <h2 style="color: ${color}; margin: 0; font-size: 36px; font-weight: 700;">
                ${sign}₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </td>
          </tr>
          
          <!-- Transaction Details -->
          <tr>
            <td style="padding: 0 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; padding: 20px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
                    <table width="100%">
                      <tr>
                        <td style="color: #666666; font-size: 14px; padding-bottom: 8px;">Transaction Type</td>
                        <td align="right" style="color: #333333; font-size: 14px; font-weight: 600; padding-bottom: 8px;">${isDebit ? 'Payment' : 'Credit'}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${previousBalance !== null ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
                    <table width="100%">
                      <tr>
                        <td style="color: #666666; font-size: 14px; padding-bottom: 8px;">Previous Balance</td>
                        <td align="right" style="color: #333333; font-size: 14px; font-weight: 600; padding-bottom: 8px;">₹${previousBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ` : ''}
                ${fee > 0 ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
                    <table width="100%">
                      <tr>
                        <td style="color: #666666; font-size: 14px; padding-bottom: 8px;">Platform Fee</td>
                        <td align="right" style="color: #333333; font-size: 14px; font-weight: 600; padding-bottom: 8px;">₹${fee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
                    <table width="100%">
                      <tr>
                        <td style="color: #666666; font-size: 14px; padding-bottom: 8px;">Transaction Date</td>
                        <td align="right" style="color: #333333; font-size: 14px; font-weight: 600; padding-bottom: 8px;">${transactionDate}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table width="100%">
                      <tr>
                        <td style="color: #666666; font-size: 14px; padding-top: 8px;">Remaining Balance</td>
                        <td align="right" style="color: #34A853; font-size: 18px; font-weight: 700; padding-top: 8px;">₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 20px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
              <p style="color: #999999; margin: 0 0 10px 0; font-size: 12px;">This is an automated transaction receipt from Elite Pay</p>
              <p style="color: #999999; margin: 0; font-size: 12px;">If you didn't make this transaction, please contact support immediately.</p>
              <p style="color: #999999; margin: 15px 0 0 0; font-size: 11px;">© ${new Date().getFullYear()} Elite Pay. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

async function sendEmail(to, subject, text, html = null) {
  if (!to) return;
  try {
    await transporter.sendMail({
      from: `"Elite Pay" <${TRANSPORTER_CONFIG.auth.user}>`,
      to,
      subject,
      text,
      html: html || text
    });
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}

// Helper function to send transaction email
async function sendTransactionEmail(to, amount, balance, transactionType = "payment", fee = 0, previousBalance = null) {
  const subject = transactionType === "payment" 
    ? `Payment of ₹${amount.toLocaleString('en-IN')} - Elite Pay`
    : `Credit of ₹${amount.toLocaleString('en-IN')} - Elite Pay`;
  
  const totalDeducted = amount + fee;
  const text = transactionType === "payment"
    ? `Amount spent: ₹${amount.toLocaleString('en-IN')}. ${fee > 0 ? `Platform fee: ₹${fee.toLocaleString('en-IN')}. ` : ''}Total deducted: ₹${totalDeducted.toLocaleString('en-IN')}. ${previousBalance !== null ? `Previous balance: ₹${previousBalance.toLocaleString('en-IN')}. ` : ''}Remaining balance: ₹${balance.toLocaleString('en-IN')}`
    : `Amount received: ₹${amount.toLocaleString('en-IN')}. ${previousBalance !== null ? `Previous balance: ₹${previousBalance.toLocaleString('en-IN')}. ` : ''}New balance: ₹${balance.toLocaleString('en-IN')}`;
  
  const html = generateTransactionEmailHTML(amount, balance, transactionType, fee, previousBalance);
  
  await sendEmail(to, subject, text, html);
}

module.exports = { sendEmail, sendTransactionEmail };
