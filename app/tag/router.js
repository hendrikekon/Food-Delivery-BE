const router = require('express').Router();
const tagController = require('./controller');
const multer = require('multer');
const upload = multer();
const { police_check } = require('../../middlewares');


router.get('/tags', tagController.index);
router.post('/tags', upload.none(), police_check('create', 'tags'), tagController.store);
router.patch('/tags/:id', upload.none(), police_check('update', 'tags'), tagController.update);
router.delete('/tags/:id', police_check('delete', 'tags'), tagController.destroy);

module.exports = router;