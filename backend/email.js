// Email functionality placeholder

function sendEmail(to, subject, html) {
  // Placeholder for email sending
  console.log(`📧 Email would be sent to: ${to}`);
  console.log(`Subject: ${subject}`);
  return Promise.resolve();
}

function sendTransactionEmail(email, amount, balance, type, fee = 0, previousBalance = 0) {
  if (!email) return;
  
  console.log(`📧 Transaction Email:`);
  console.log(`   To: ${email}`);
  console.log(`   Type: ${type}`);
  console.log(`   Amount: ₹${amount}`);
  console.log(`   Fee: ₹${fee}`);
  console.log(`   New Balance: ₹${balance}`);
  
  return Promise.resolve();
}

module.exports = {
  sendEmail,
  sendTransactionEmail
};