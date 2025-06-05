// Modules
const jwt = require("jsonwebtoken");

const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const DB = require("../models");
const { User } = DB.models;

const createSendToken = (user, statusCode, req, res, target = false) => {
    const jwtExpire = req.body.remember == 1 ? process.env.JWT_EXPIRES_IN : 1;
 
    const token = jwt.sign({ id: user.id },
        process.env.JWT_SECRET, {
            expiresIn: `${jwtExpire} d`,
        }
    );

    const cookieOptions = {
        expires: new Date(Date.now() + jwtExpire * 24 * 60 * 60 * 1000),
        httpOnly: true,
    };
    
    if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

    res.cookie("jwt", token, cookieOptions);
    res.locals.token = token;

    if (!target) {
        user.password = undefined;
        user.deleted = undefined;

        res.status(statusCode).json({
            status: "success",
            time: `${Date.now()} - ${req.tiem} - ms`,
            token,
            user,
        });
    }
};

const logOut = (res) => {
    res.cookie("jwt", "loggedout", {
        expires: new Date(Date.now() + 2 * 1000), // 2 seconds      
        httpOnly: true,
        sameSite: "Lax",  
    });
};

module.exports = {
    signUp: catchAsync(async (req, res) => {
        const user = await User.create(req.body);
        // await new Email(user, `${req.protocol}://${req.get('host')}`).sendWelcome();
        createSendToken(user, 201, req, res);
        res.status(201).json({
            status: "success",
            message: "You have successfully registered.",
        });
    }),
    signIn: catchAsync(async (req, res, next) => {
        const { email, password } = req.body;

    
        // 1) Check if email and password exist
        if (!email || !password) {
            return next(new AppError("Please provide email and password!", 400));
        }
    
        // 2) Check if user exists
        const user = await User.findOne({ where: { email } });
    
        if (!user || !(await user.correctPassword(password, user.password))) {
            return next(new AppError("Incorrect email or password", 401));
        }
    
        // 3) If everything is ok, send token to client
        createSendToken(user, 200, req, res, true);
    
        res.status(200).json({
            status: "success",
            token: res.locals.token,
            time: `${Date.now() - req.time} ms`,
            reload: true,
        });
    }),
    logout: (req, res) => {
        logOut(res);
        res.status(200).json({
            status: "success",
            reload: true,
        });
    },
    isLoggedIn: async (req, res, next) => {
        res.locals.user = undefined;
        console.log(req.cookies.jwt)
    
        if (!req.cookies.jwt) return next();
    
        try {
            // Logout user if rate limit exceeded
            if (res.getHeader("x-ratelimit-remaining") == 0) {
                logOutUser(res);
                return next();
            }
    
            // Verify JWT
            const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);
            const currentUser = await User.findOne({ where: { id: decoded.id } });
            if (!currentUser) return next();
    
            // Check if password was changed after token was issued
            if (currentUser.changedPasswordAfter(decoded.iat)) {
                res.clearCookie("jwt"); // Clear stale token
                return next();
            }
    
            // Store user in response locals
            res.locals.user = currentUser.toJSON();
            return next();
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                res.clearCookie("jwt"); // Clear expired token
            }
            return next();
        }
    },   
    protect: catchAsync(async (req, res, next) => {
        res.locals.user = undefined;

        // 1) Getting token and check if it's there
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        } else if (req.cookies.jwt) {
            token = req.cookies.jwt;
        }

        if (!token) return next(new AppError('You are not logged in! Please log in to get access.', 401));

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3) Check if user still exists
        const currentUser = await User.findOne({ where: { id: decoded.id } });
        

        if (!currentUser)
            return next(new AppError("The user belonging to this token no longer exists.", 401));

        // 4) Check if user changed password after the token was issued
        if (currentUser.changedPasswordAfter(decoded.iat))
            return next(
                new AppError( "User recently changed password! Please log in again.", 401)
            );

        // GRANT ACCESS TO PROTECTED ROUTE
        req.user = currentUser;
        // THERE IS A LOGGED IN USER
        res.locals.user = currentUser.toJSON();
        next();
    }),
    protectUser: (req, res, next) => {       
        if (res.locals.user) return next(new AppError('You are already logged in!', 403));
        next();
    },
    // Creating a new updated token
    newToken: catchAsync(async (req, res, next) => {
        const jwtExpire = req.body.remember == 1 ? process.env.JWT_EXPIRES_IN : 1;
        const token = req.cookies.jwt;

        if (!token) return next(new AppError('Token not found in cookies', 403));
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) return next(new AppError('Invalid or expired token', 403));

            // Creating a new updated token
            const newToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
                expiresIn: `${jwtExpire}d`
            });

            const cookieOptions = {
                expires: new Date(Date.now() + jwtExpire * 24 * 60 * 60 * 1000), 
                httpOnly: true
            };

            if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

            res.cookie('jwt', newToken, cookieOptions);

            res.locals.token = newToken;
            res.status(200).json({
                status: 'success',
                token: newToken,
            });
        });
    })
};