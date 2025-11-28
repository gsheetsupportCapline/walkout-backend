const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/database");

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ message: "Welcome to Walkout Backend API" });
});

app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/regions", require("./routes/regionRoutes"));
app.use("/api/offices", require("./routes/officeRoutes"));
app.use("/api/teams", require("./routes/teamRoutes"));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
