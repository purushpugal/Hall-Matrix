const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const config = require("./config");

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(config.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// Routes (import from files)
const allocRoutes = require("./routes/allocRoutes");
app.use("/api", allocRoutes);

const PORT = config.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
