const jwt = require("jsonwebtoken");

//*********** Middleware to require authentication (JWT verification) ***********//
const requireAuth = async (req, res, next) => {
  try {
    //*********** Get the token from the Authorization header ***********//
    const authHeader = req.get("Authorization");

    if (!authHeader) {
      return res.status(401).json({ error: "Authentication token missing!" });
    }

    //*********** Extract the token (assumes 'Bearer <token>' format) ***********//
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token missing or malformed!" });
    }

    //*********** Verify the token using JWT secret ***********//
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err || !decodedToken) {
        return res.status(403).json({ error: "Invalid or expired token!" });
      }

      //*********** Attach the decoded token data to req.user ***********//
      req.user = decodedToken;

      //*********** Debugging: Log the decoded token for confirmation ***********//
      //console.log("Decoded Token:", decodedToken);

      next(); // Proceed to the next middleware or controller
    });
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

//*********** Middleware to check if the user is an admin ***********//
const requireAdmin = (req, res, next) => {
  //*********** Check if req.user exists and has a role of "admin" ***********//
  if (req.user && req.user.role === "admin") {
    next(); // User is admin, allow access
  } else {
    return res.status(403).json({ error: "Admin access required!" });
  }
};

//*********** Export the middlewares ***********//
module.exports = { requireAuth, requireAdmin };
