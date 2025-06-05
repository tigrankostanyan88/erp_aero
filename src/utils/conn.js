const Sequelize = require('sequelize');

class Database {
    constructor() {
        this.dbName = process.env.DB_NAME;
        this.userName = process.env.DB_USERNAME;
        this.password = process.env.DB_PASSWORD;
        this.host = 'localhost';
        this.dialect = 'mysql';
        this.connect = null;
        this.runConnect();
    }


    // Initialize Sequelize and establish a connection
    runConnect() {
        try {
            this.connect = new Sequelize(this.dbName, this.userName, this.password, {
                host: this.host,
                dialect: this.dialect,
                logging: false,
                define: {
                    timestamp: false,
                    createdAt: false,
                    updatedAt: false,
                    freezeTableName: true
                }
            });

            // Test the connection
            this.connect.authenticate()
                .then(() => console.log('Connection to the database has been established successfully. 👏'))
                .catch((error) => console.log('Error connection', error));
            return {
                con: this.connect,
                Sequelize
            };
        } catch (error) {
            console.error('Unable to connect to the database:', error);
        }
    }
}

const database = new Database();
const DB = database.runConnect();

module.exports = DB;
