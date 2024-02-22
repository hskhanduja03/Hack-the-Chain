const mongoose = require('mongoose');
const plm=require("passport-local-mongoose");
const { stringify } = require('uuid');


mongoose.connect(process.env.MONGODB_URI);
// Define User Schema
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique:true
  },
  password: {
    type:String,
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  fullName: {
    type:String,
    required:true,
  },
  complaints: [{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Complaint"
  }],
  rollNo:{
    type: String,
    required: true,
    unique: true
  },
  profileImage: {
    type: String,
  },
  role: {
    type: String,
    enum: ["Student", "Admin"],
    default: "Student"
  },
  domain: {
    type: String,
    enum: ["Mess", "Network", "Academic"],
    default: ""
  },
  
});

UserSchema.plugin(plm);

// Create models based on schemas
module.exports = mongoose.model('User', UserSchema);

