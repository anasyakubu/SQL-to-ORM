const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../../../models/user.model");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback", // Callback URL after Google login
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Find or create user
        const existingUser = await User.findOne({ email: profile.emails[0].value, });
        if (existingUser) { return done(null, existingUser); }

        //*********** If user does not exist, create new user ***********//
        const newUser = new User({
          name: profile.displayName,
          email: profile.emails[0].value,
          password: "", // No password since using Google login
        });
        await newUser.save();
        done(null, newUser);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

//*********** Serialize and Deserialize User ***********//
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});
