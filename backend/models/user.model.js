const { mongoose } = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, require: true },
    username: { type: String },
    email: { type: String, require: true, unique: true },
    phone: { type: String },
    password: { type: String, require: true },
    address: { type: String },
    userImage: String,
    verified: Boolean,
    isPremium: Boolean,
  },
  { timestamps: true }
); // This will automatically add createdAt and updatedAt fields

const UserModel = mongoose.model("Users", userSchema);

module.exports = UserModel;
