// Modules / express Routes
const router = require('express').Router();

// Controllers
const ctrls = require('../controllers');

// User data access
router.use(ctrls.auth.isLoggedIn);

router.get('/logout', ctrls.auth.protect, ctrls.auth.logout);
router.get('/info', ctrls.auth.protect, ctrls.user.getUser);
router.post('/signin/new_token', ctrls.auth.newToken);

router.use(ctrls.auth.protectUser);

router.post('/signup', ctrls.auth.signUp);
router.post('/signin', ctrls.auth.signIn);

module.exports = router;