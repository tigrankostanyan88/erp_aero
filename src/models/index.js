// Connection DB
const DB = require('../utils/conn');

const connect = DB.con;
const Sequelize = DB.Sequelize;

// Import and create models
DB.models = {
    User: require('./user')(connect, Sequelize.DataTypes),
    File: require('./file')(connect, Sequelize.DataTypes),
}


DB.models.User.hasMany(DB.models.File, {
    foreignKey: 'row_id',
    as: 'files',
    constraints: false
});

DB.models.File.belongsTo(DB.models.User, {
    foreignKey: 'row_id',
    as: 'user_files',
    constraints: false
});


module.exports = DB;