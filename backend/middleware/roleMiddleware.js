// middleware/roleMiddleware.js
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

//*********** Middleware to check if the user is the owner of the post or an admin ***********//
const isOwnerOrAdmin = async (req, res, next) => {
  try {
    const authHeader = req.get("Authorization");
    if (!authHeader) {
      return res.status(401).json({ error: "Not Authenticated!" });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decodedToken.userID);

    if (!user) {
      return res.status(403).json({ error: "User not found!" });
    }

    //*********** Check if the user is the owner or an admin ***********//
    if (user.role === "admin" || req.params.userID === user.id) {
      req.user = user;
      next();
    } else {
      return res
        .status(403)
        .json({ error: "Not authorized to perform this action!" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { isAdmin, isOwnerOrAdmin };
