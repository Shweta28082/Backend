const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",   // Make sure this is set
  port: 465,                // Port for SSL
  secure: true,    
  auth: {
    user: "shweta854504@gmail.com",
    pass: "fgowrhrmbpissite",
  },
  debug: true, 
});

async function sendMail(to, subject, text, html) {
  const info = await transporter.sendMail({
    from: '"Rising_Star 👻" <shweta854504@gmail.com>',
    to,
    subject,
    text,
    html,
  });

  console.log("Message sent: %s", info.messageId);
}

const sendApprovalEmail = (req, res) => {
  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: "Email and Name are required." });
  }

  const subject = "Your Video Has Been Approved";
  const text = `Dear ${name},\n\nYour video has been approved and successfully uploaded to YouTube.\n\nBest regards,\nYour Team`;
  const html = `<p>Dear ${name},</p><p>Your video has been approved and successfully uploaded to YouTube.</p><p>Best regards,<br>Your Team</p>`;

  // Call sendMail function to send the email
  sendMail(email, subject, text, html)
    .then(() => {
      res.json({ message: "Approval email sent successfully." });
    })
    .catch((err) => {
      console.error("Error sending approval email:", err);
      res.status(500).json({ error: "Failed to send approval email." });
    });
};

// Export the sendApprovalEmail function to be used in routes
module.exports = { sendApprovalEmail };
