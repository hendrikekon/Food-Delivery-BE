const mongoose = require('mongoose');
const {model, Schema} = mongoose;

const cartItemSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Nama makanan harus diisi'],
        minlength: [5, 'Panjang nama makanan minimal 3 karakter']
    },
    qty: {
        type: Number,
        required: [true, 'Jumlah qty harus diisi'],
        min: [1, 'Jumlah qty minimal 1']
    },
    price: {
        type: Number,
        default: 0
    },
    image_url: {
        type: String
    },
    user:{
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: 'product',
        required: [true, 'Produk harus dipilih']
    }
});

module.exports = model('CartItem', cartItemSchema);