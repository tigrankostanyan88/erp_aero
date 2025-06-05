module.exports = (app) => {
    const DB = require('../models');
    DB.con
        .sync({ alter: true })
        // .sync()
        .then(res => {
            const port = process.env.PORT || 3200;
            const server = app.listen(port, () => console.log(`App running on port ${port}...`));

            process.on('unhandledRejection', err => {
                console.log('UNHANDLED REJECTION! Shutting down...');
                console.log(err.name, err.message);
                server.close(() => {
                    process.exit(1);
                });
            })
        }).catch(err => console.log(err));
    return DB;
};