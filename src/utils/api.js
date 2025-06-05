const routes = require('../routes');

module.exports = api = (app) => {
    // API RUOTES
    app.use('/api/v1/users', routes.user);
    app.use('/api/v1/file/', routes.file);
};      