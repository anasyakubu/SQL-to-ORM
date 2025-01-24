const User = require("../models/user.model");
const { hashPassword, comparePassword } = require("../utils/helpers/auth");
const UserOTPVerification = require("../models/userOTPVerification.modal");
const send = require("../config/mail.transporter");

const sendOTPVerificationEmail = async ({ _id, email }) => {
  try {
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    //*********** Mail Option ***********
    const mailOption = {
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: "Verify Your Email",
      html: `<p>Enter <b>${otp}</b> in the app to verify your email address and complete your signup</p>`,
    };
    //*********** hashed OTP ***********//
    const hashedOTP = await hashPassword(otp);
    const newOTPVerification = new UserOTPVerification({
      userID: _id, otp: hashedOTP,
      createdAt: Date.now(), expiresAt: Date.now() + 3600000,
    });
    //*********** save record to db ***********//
    await newOTPVerification.save();
    await send.sendMail(mailOption);

    return {
      status: "PENDING", message: "Verification OTP Sent", data: { userID: _id, email, },
    };
  } catch (error) {
    return { status: "FAILED", message: error.message, };
  }
};

module.exports = sendOTPVerificationEmail;
