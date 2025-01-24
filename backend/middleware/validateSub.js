const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

//*********** Middleware to check if the user is an admin ***********//
const isAdmin = async (req, res, next) => {
  try {
    const authHeader = req.get("Authorization");
    if (!authHeader) {
      return res.status(401).json({ error: "Not Authenticated!" });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decodedToken.userID);

    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required!" });
    }

    req.user = user; // Attach user to the request for further use
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//*********** Middleware to check if the user has a premium subscription ***********//
const isPremium = async (req, res, next) => {
  try {
    const authHeader = req.get("Authorization");
    if (!authHeader) {
      return res.status(401).json({ error: "Not Authenticated!" });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decodedToken.userID);

    if (!user) {
      return res.status(401).json({ error: "User not found!" });
    }

    if (!user.isPremium) {
      return res.status(403).json({ error: "Premium access required. Please subscribe to access this feature.", });
    }
    req.user = user; // Attach user to the request for further use
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { isAdmin, isPremium };
