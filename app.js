// Moduls
const path = require("path");
const express = require("express");
const useragent = require('express-useragent');
const compression = require("compression");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const cors = require("cors");

require("dotenv").config({ path: "./.env" });

// Utils
const AppError = require("./src/utils/appError");
const helpers = require("./src/utils/helpers");
const Server = require("./src/utils/Server");
const Api = require("./src/utils/api");

// Controller / Global errors
const ctrls = require("./src/controllers");
const globalErrorHandler = ctrls.error;

// Server
const app = express();

app.set("view engine", "ejs");
app.set("views", "views");
app.use(useragent.express());

/* 1) GLOBAL MIDDLEWARES */
app.use(cors());
app.options("*", cors());
app.use(cookieParser());
app.use(compression());
app.use(fileUpload({ limits: { fileSize: 2 * 1024 * 1024 } }));

// Development logging
process.env.NODE_ENV === "development" ? app.use(morgan("dev")) : "";

// Limit requests from the same API
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: "Too many requests from this IP, please try again in an hour!",
});

// Body JSON parser
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, }));
app.use(express.static(path.join(__dirname, "public")));

app.use(async (req, res, next) => {
    req.body = helpers.encode(req.body);
    req.time = Date.now();
    req.date = new Date().toString();
    next(); 
}); 

// API limiter
app.use("/api", limiter);

const start = process.hrtime();
const end = process.hrtime(start);
console.log(`DB Query: Services took ${end[0]}s and ${end[1] / 1e6}ms`);

// API
Api(app);

// All 404 Errors
app.all("*", (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use(globalErrorHandler);
Server(app)