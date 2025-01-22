const Product = require('../product/model');
const cartItem = require('../cart-item/model');

const update = async (req, res, next) => {
    try {
        console.log(req.body)
        const {items} = req.body;
        // if (!items || !Array.isArray(items)) {
        //     return res.status(400).json({
        //         error: 1,
        //         message: 'Items must be an array and cannot be empty'
        //     });
        // }
        // const { product, qty } = req.body; // Directly extract product and qty

        // if (!product || !qty) {
        //     return res.status(400).json({
        //         error: 1,
        //         message: 'Product and quantity must be provided'
        //     });
        // }

        // // Construct items array manually
        // const items = [{ product: { _id: product }, qty: parseInt(qty) }];

        const productId = items.map(item => item.product._id);
        const products = await Product.find({_id: {$in: productId}});
        let cartItems  = items.map(item => {
            let relatedProduct = products.find(product => product._id.toString() === item.product._id);
            return {
                product: relatedProduct._id,
                price: relatedProduct.price,
                image_url: relatedProduct.image_url,
                name: relatedProduct.name,
                user: req.user._id,
                qty: item.qty
            };
        });

        await cartItem.deleteMany({user: req.user._id});
        await cartItem.bulkWrite(cartItems.map(item => {
            return {
                updateOne: {
                    filter: {
                        user: req.user._id,
                        product: item.product
                    },
                    update: { $set: item },
                    upsert: true
                }
            }
        }));
        return res.json(cartItems);
    } catch (err) {
        if(err && err.name === 'ValidationError'){
            return res.status(400).json({
                error: 1,
                message: err.message,
                fields: err.errors
            })
        }

        next(err);
    }
};

const index = async (req, res, next) => {
    try {
        let items = await cartItem.find({user: req.user._id}).populate('product');

        return res.json(items);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    update,
    index
}