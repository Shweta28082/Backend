const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "shweta854504@gmail.com",
    pass: "fgowrhrmbpissite",
  },
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

module.exports = { sendMail }; // Ensure it's exported as an object
