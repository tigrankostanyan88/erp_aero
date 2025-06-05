const fs = require('fs')
const path = require('path')
const fsPromises = require('fs').promises;
module.exports = (con, DataTypes) => {
    const File = con.define('files', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        table_name: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        row_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        col_name: {
            type: DataTypes.STRING(50),
        },
        title: {
            type: DataTypes.STRING,
        },
        name_original: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        name_used: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        ext: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        type: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        sizes: {
            type: DataTypes.JSON,
            allowNull: false,
        },
        date: {
            type: DataTypes.DATE,
            defaultValue: con.literal("CURRENT_TIMESTAMP"),
            allowNull: false,
        },
        sort: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
        }
    }, {
        hooks: {
            beforeDestroy: async (file, options) => {
                try {
                    const filesDir = './public/files';
                    const filePath = path.join(filesDir, `${file.name}${file.ext}`);

                    console.log(filePath)

                    await file.removeFromPath(filePath);

                    // console.log(`File deleted: ${filePath}`);
                } catch (err) {
                    if (err.code !== 'ENOENT') {
                        console.error('Error deleting file:', err);
                        throw err;
                    }
                }
            }
        }
    });
    File.prototype.removeFromPath = async path => {
        if (fs.existsSync(path)) fs.unlinkSync(path);
    }
    return File;
}