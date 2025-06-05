// Modules / express Routes
const router = require('express').Router();

// Controllers
const ctrls = require('../controllers');

// User data access
router.use(ctrls.auth.isLoggedIn);

router.post('/upload', ctrls.file.addFile);
router.get('/list', ctrls.file.getFileList);
router.get('/:id', ctrls.file.getFile);
router.get('/download/:id', ctrls.file.downloadFile);
router.delete('/delete/:id', ctrls.file.deleteFile);
router.patch('/update/:id', ctrls.file.updateFile);

module.exports = router;