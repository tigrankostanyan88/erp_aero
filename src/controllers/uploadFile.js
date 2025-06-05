const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;

const DB = require("../models");

const {
    File,
    User
} = DB.models;

const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Files = require("./File");
const {
    log
} = require('console');


async function findFileWithExtension(baseName, dir) {
    const files = await fsPromises.readdir(dir);
    for (const file of files) {
        if (file.startsWith(baseName)) {
            return file;
        }
    }
    return null;
}


module.exports = {
    addFile: async (req, res, next) => {
        try {
            const currentUser = res.locals.user;

            if (!currentUser || !currentUser.id) return next(new AppError("User not authenticated", 401));
            if (!req.files) return next(new AppError("No file uploaded", 400));
            const user = await User.findByPk(currentUser.id, {
                include: "files"
            });

            const file = await new Files(user, req.files.user_file).add("user_file");

            if (file.status === "success") {
                await user.createFile(file.table);
                return res.status(200).json({
                    message: "Файл успешно загружен",
                    file: file
                });
            } else {
                return next(
                    new AppError(file.message ? Object.values(file.message).join(" ") : "File processing failed", 400)
                );
            }
        } catch (err) {
            next(err);
        }
    },
    getFile: async (req, res, next) => {
        try {
            const file = await File.findByPk(req.params.id, {
                raw: true,
                attributes: {
                    exclude: ['id', 'row_id', 'name_used', 'name', 'sort']
                }
            });
            if (!file) return next(new AppError('File is not define', 400));

            res.status(200).json({
                status: "success",
                message: "File downloaded successfully",
            });
        } catch (error) {
            next(error);
        }
    },
    getFileList: async (req, res, next) => {
        try {
            const listSize = parseInt(req.query.list_size) || 10;
            const page = parseInt(req.query.page) || 1;
            const offset = (page - 1) * listSize;

            const files = await File.findAndCountAll({
                limit: listSize,
                offset,
                order: [
                    ["id", "DESC"]
                ]
            });

            res.status(200).json({
                status: "success",
                files
            });
        } catch (error) {
            next(error);
        }
    },
    downloadFile: async (req, res, next) => {
        try {
            const fileRecord = await File.findOne({
                where: { id: req.params.id }
            });

            if (!fileRecord) return next(new AppError("File not found", 404));

            const baseName = fileRecord.name;
            const filesDir = './public/files';
            const downloadsDir = './public/downloads';

            const fileName = await findFileWithExtension(baseName, filesDir);
            if (!fileName) return next(new AppError("Physical file not found", 404));

            const sourcePath = path.join(filesDir, fileName);

            const today = new Date().toISOString().split('T')[0]; 

            // Get file extension ( .pdf, .zip)
            const ext = path.extname(fileName);

            // generate new name
            const newFileName = `${today} ${fileRecord.name_original}`;
            const destPath = path.join(downloadsDir, newFileName);

            if (!fs.existsSync(downloadsDir)) {
                fs.mkdirSync(downloadsDir, {
                    recursive: true
                });
            }

            if (!fs.existsSync(destPath)) {
                await fsPromises.copyFile(sourcePath, destPath);
            }

            res.download(destPath, newFileName, (err) => {
                if (err) {
                    console.error('Download error:', err);
                    return next(new AppError('Failed to download file', 500));
                }
            });
        } catch (error) {
            next(error);
        }
    },
    updateFile: async (req, res, next) => {
        try {
            const currentUser = res.locals.user;
            const fileRecord = await File.findOne({ where: { id: req.params.id }});
            
            if (!currentUser || !currentUser.id) return next(new AppError("User not authenticated", 401));
            const user = await User.findByPk(currentUser.id, {
                include: "files"
            });

            const file = await new Files(user, req.files.user_file).replace("user_file");
            if (file.status === "success") {
                if(file.status !== "success") {
                    return next(new AppError(file.message ? Object.values(file.message).join(" ") : "File processing failed", 400));
                } else {
                    await user.createFile(file.table);
                }
                
                return res.status(200).json({
                    message: "Файл успешно загружен",
                    user
                });
            } 
             res.status(200).json({
                status: 'success',
                message: 'File updated successfully',
                file: fileRecord
            });
        } catch (error) {
            next(error);
        }
    },
    deleteFile: async (req, res, next) => {
        try {
            const fileRecord = await File.findOne({
            where: { id: req.params.id }
        });

        if (!fileRecord) {
            return next(new AppError("File not found", 404));
        }

        await fileRecord.destroy();
        res.status(200).json({
            status: 'success',
            message: 'File deleted successfully'
        });
        } catch (error) {
            next(error);
        }
    }
}