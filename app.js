if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
require("./models/user");
const express = require("express");
const app = express();
const session = require("express-session");
const mongoose = require("mongoose");
const MongoDBStore = require("connect-mongo");
const bodyParser = require("body-parser");
const ExpressError = require("./utils/ExpressError");
const cors = require("cors");
const authRoutes = require("./routes/auth");

// Variables
const PORT = process.env.PORT || 3000;
const mongoURi = process.env.MONGODB_URI || "mongodb://localhost:27017/dropview";
const secret = "thisisnotagoodsecret";

const store = MongoDBStore.create({
  mongoUrl: mongoURi,
  secret,
  touchAfter: 24 * 60 * 60,
});

const sessionConfig = {
  store,
  secret,
  name: "session",
  resave: false,
  saveUninitialized: false,
};

const allowedOrigins = [
  process.env.DOMAIN_FRONTEND,
  process.env.DOMAIN_SECOND,
  process.env.DOMAIN_THIRD,
  process.env.DOMAIN_FOURTH,
  process.env.DOMAIN_BACKEND,
];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: "GET,POST,PUT,DELETE,PATCH",
  allowedHeaders: "Content-Type,Authorization",
};

// Using the app
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session(sessionConfig));


// Routes
app.use("/api/auth", authRoutes)

// initializing Mongoose
mongoose
  .connect(mongoURi, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Mongoose is connected");
  })
  .catch((e) => {
    console.log(e);
  });

// handling the error message
app.all("*", (req, res, next) => {
  next(new ExpressError("Page not found", 404));
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  const { status = 500 } = err;
  if (!err.message) err.message = "Oh No, Something Went Wrong!";
  res.status(status).json({ error: err.message });
});

// Listen for the port Number
app.listen(PORT, () => {
  console.log(`App is listening on http://localhost:${PORT}`);
});