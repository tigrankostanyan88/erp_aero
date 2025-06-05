// DB module
const DB = require('../models');
const { User } = DB.models;

// Utils
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const helpers = require('../utils/helpers');
const Files = require('./File');


module.exports = {
    getUser: catchAsync(async (req, res) => {
        // 3) Update user
        const user = await User.findAll({
            raw: true,
            attributes: ['id', 'name', 'email'],
            order: [
                ["id", "ASC"]
            ]
        });
        res.status(200).json({
            user,
            time: (Date.now() - req.time) + ' ms'
        });
    }),
    updateMe: catchAsync(async (req, res, next) => {
        // 1) Create error if user POSTs password data
        if (req.body.password || req.body.passwordConfirm) {
            return next(new AppError('This route is not for password updates. Please use /updateMyPassword.', 400));
        }
    
        // 2) Updated only allowed fields
        const filteredBody = helpers.filterObj(req.body, 'name', 'phone', 'gender');
    
        // 3) Update user
        const user = await User.findByPk(req.user.id, { include: 'files' });
    
        if (req.files) {
            if (req.files.avatar) {
                const image = await new Files(user, req.files.avatar).replace('user-avatar');
                if (image.status == 'success') {
                    // create row
                    await user.createFile(image.table);
                } else {
                    return next(new AppError(Object.values(image.message).join(' '), 400));
                }
            }
            if (req.files.cover) {
                const image = await new Files(user, req.files.cover).replace('user-cover');
    
                if (image.status == 'success') {
                    // create row
                    await user.createFile(image.table);
                } else {
                    return next(new AppError(Object.values(image.message).join(' '), 400));
                }
            }
        }
    
        user.set(filteredBody);
        await user.save();
    
        res.status(200).json({
            status: 'success',
            // user,
            time: (Date.now() - req.time) + ' ms'
        });
    }),
};