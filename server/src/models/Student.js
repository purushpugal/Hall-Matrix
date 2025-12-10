const mongoose = require("mongoose");
const StudentSchema = new mongoose.Schema({
  regNo: { type: String, required: true, unique: true },
  name: String,
  program: String,
  year: Number,
  roll: String,
  specialNeeds: { type: Boolean, default: false },
  tags: [String],
});
module.exports = mongoose.model("Student", StudentSchema);

// server/src/models/Hall.js
const HallSchema = new mongoose.Schema({
  name: String,
  building: String,
  rows: Number,
  cols: Number,
  capacity: Number,
  accessibleSeats: [String], // seat labels
});
module.exports = mongoose.model("Hall", HallSchema);
