const User = require("../models/user.model");
const { hashPassword, comparePassword } = require("../utils/helpers/auth");
const jwt = require("jsonwebtoken");
const UserOTPVerification = require("../models/userOTPVerification.modal");
const sendOTPVerificationEmail = require("../services/sendOTPVerificationEmail");

//*********** Test Endpoint ***********//
const test = (req, res) => { res.json("Protected routes"); };

//*********** List user ***********//
const listUser = async (req, res) => {
  try {
    const users = await User.find({});

    if (users.length === 0) { res.status(200).json({ status: 204, message: "No content found", }); }

    res.status(200).json({ status: 200, message: "All User Fetch Successfull", data: users, });
  } catch (error) {
    res.status(500).json({ status: 500, message: "Fail to get all Users", error: error });
  }
};

//*********** Fetch user [One] ***********//
const getUser = async (req, res) => {
  try {
    const id = req.params.id;
    const users = await User.find({ _id: id });
    if (users.length === 0) { res.status(200).json({ status: 204, message: "No content found", }); }

    res.status(200).json({ status: 200, message: "All User Fetch Successfull", data: users, });
  } catch (error) {
    res.status(500).json({ status: 500, message: "Fail to get all Users", error: error });
  }

};

//***********  Register Endpoint ***********//
const registerUser = async (req, res) => {
  try {
    const { name, email, username, userImage, password } = req.body;

    // check for missing fields
    const checkMissingFields = (fields) => {
      for (const [key, value] of Object.entries(fields)) {
        if (!value) { return key; }
      }
      return null; // All fields are valid
    };

    const fieldsToCheck = { name, email, phone, address };
    const missingField = checkMissingFields(fieldsToCheck);

    if (missingField) { return res.status(400).json({ error: `${missingField} is required` }); }

    //*********** check if password is good ***********//
    if (!password || password.length < 4) {
      return res.status(400).json({ status: 400, error: "Password is required and it should be 4 characters long", });
    }
    //*********** check email exist ***********//
    const exist = await User.findOne({ email });
    if (exist) {
      return res.status(400).json({ status: 400, error: "Email Already Taken", });
    }
    const hashedPassword = await hashPassword(password); //hased password

    //*********** create user in db ***********//
    const user = await User.create({
      name, email, username, userImage:
        userImage ||
        "https://firebasestorage.googleapis.com/v0/b/first-crud-f85ea.appspot.com/o/daily-invoice%2Fuser-1.jpg?alt=media&token=9a6a8751-647e-4202-a1e7-42d7b23e0764",
      password: hashedPassword, verified: false, isPremium: false,
    });

    //*********** Send OTP verification email ***********//
    const otpResponse = await sendOTPVerificationEmail(user);
    if (otpResponse.status === "FAILED") { return res.status(500).json(otpResponse); }

    return res.status(201).json({ status: 201, message: "User Created Successful", data: user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "FAILED", message: "Internal Server Error", });
  }
};

//*********** Login Endpoint ***********//
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    //*********** Check Empty Field  ***********//
    if (!email) {
      return res.status(400).json({ status: 400, error: "Email is required", });
    }
    // check if password is good
    if (!password) {
      return res.status(400).json({ status: 400, error: "Password is required", });
    }

    //*********** check if user exists  ***********//
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ status: 400, error: "No User Found", });
    }

    const match = await comparePassword(password, user.password);
    if (!match) {
      // throw new Error("Invalid credentials!");
      return res.status(400).json({ status: 400, error: "Invalid credentials", });
    }

    const token = jwt.sign(
      { email: user.email, _id: user._id, userID: user.userID, role: user.role, },
      process.env.JWT_SECRET, { expiresIn: "5hr" }
    );

    return res.status(200).json({
      status: 200, message: "User logged in successfully!", token: token,
      userID: user._id, name: user.name, email: user.email,
      username: user.username, userImage: user.userImage,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

//*********** Verify OTP ***********//
const verifyOTP = async (req, res) => {
  try {
    const { userID, opt } = req.body;

    if (!userID || !opt) {
      return res.status(400).json({ status: "400", message: "Empty OTP details are not allowed", });
    }
    //*********** check for record if it exist ***********//
    const userOTPVerificationRecord = await UserOTPVerification.find({ userID, });

    if (userOTPVerificationRecord.length <= 0) {
      return res.status(400).json({
        status: "400", message: "Account record doesn't exist or has been verified already. Please signup or login",
      });
    }

    const { expiresAt, otp: hashedOTP } = userOTPVerificationRecord[0];

    if (expiresAt < Date.now()) {
      await UserOTPVerification.deleteMany({ userID });
      return res.status(500).json({ status: "500", message: "Code has expired. Please request again", });
    }
    //*********** compare the otp ***********//
    const validOTP = await comparePassword(opt, hashedOTP);

    if (!validOTP) {
      return res.status(400).json({ status: 400, message: "Invalid OTP. Check your inbox", });
    }
    //*********** update user document ***********//
    await User.updateOne({ _id: userID }, { verified: true });
    // await UserOTPVerification.deleteMany({ userID });

    return res.json({ status: "VERIFY", message: "User email verified successfully", });
  } catch (error) {
    return res.status(500).json({ status: "500", message: error.message, });
  }
};

//*********** Resend verification ***********//
const resendOPTVerification = async (req, res) => {
  try {
    const { userID, email } = req.body;
    if (!userID || !email) {
      return res.status(400).json({ status: "400", message: "Empty User details are not allowed", });
    } else {
      //*********** delete existing record and resend ***********//
      await UserOTPVerification.deleteMany({ userID });
      sendOTPVerificationEmail({ _id: userID, email }, res);
    }
  } catch (error) {
    return res.status(500).json({ status: "500", message: error.message, });
  }
};

//*********** update User ***********//
const updateUser = async (req, res) => {
  const id = req.params.id;
  try {
    const { name, email, phone, username, userImage, address } = req.body;

    // check for missing fields
    const checkMissingFields = (fields) => {
      for (const [key, value] of Object.entries(fields)) {
        if (!value) {
          return key;
        }
      }
      return null; // All fields are valid
    };

    const fieldsToCheck = { name, email, phone, username, userImage, address, };
    const missingField = checkMissingFields(fieldsToCheck);

    if (missingField) {
      return res.status(400).json({ error: `${missingField} is required` });
    }

    const update = await User.findByIdAndUpdate(
      { _id: id }, { name, email, username, phone, address, userImage }
    ).then((update) => res.json(update)).catch((err) => console.log(err));
  } catch (error) {
    console.log(error);
  }
};

//*********** Get Profile ***********//
const getProfile = (req, res) => {
  res.json({ message: "Authorized", status: 200, });
};

module.exports = {
  test, getUser, listUser, registerUser, updateUser, loginUser, verifyOTP, resendOPTVerification, getProfile,
};
