const router = require('express').Router();
const multer = require('multer');
const productController = require('./controller');
const os = require('os');
const gfs = require('gridfs-stream');
// const upload = multer({ dest: os.tmpdir() });
// const upload = multer({ dest: os.tmpdir() }).single('image');
const { police_check } = require('../../middlewares');

const upload = multer({ storage: multer.memoryStorage() }).single('image');



router.get('/products', productController.index);

router.get('/products/:id', productController.indexbyId);

router.post('/products', upload, police_check('create', 'Product'),productController.store);

router.patch('/products/:id', upload, police_check('update', 'Product'),productController.update);

router.delete('/products/:id', police_check('delete', 'Product'), productController.destroy);

router.get('/images/:id', productController.getImage);


module.exports = router;