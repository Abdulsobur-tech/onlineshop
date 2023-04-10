const express = require("express");
const cors = require("cors");
const products = require("./products");
const mongoose = require("mongoose");
const register = require("./routes/register");
const login = require("./routes/login");
const stripe = require("./routes/stripe");
const productsRoute = require("./routes/products");
const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/register", register);
app.use("/api/login", login);
app.use("/api/stripe", stripe);
app.use("/api/products", productsRoute);

require("dotenv").config();

app.get("/", (req, res) => {
  res.send("Welcome to our online shopping");
});

app.get("/products", (req, res) => {
  res.send(products);
});

const PORT = process.env.PORT || 5000;
const URI = process.env.DB_URI;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

mongoose
  .connect(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connection successful....");
  })
  .catch((erro) => {
    console.log("MogoDb connection failed!", erro.message);
  });
