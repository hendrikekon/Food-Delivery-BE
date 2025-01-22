const mongoose = require('mongoose');
const { model, Schema} = mongoose;

const productSchema = Schema({
    name: {
        type: String,
        minlength: [3, 'Panjang nama makanan minimal 3 karakter'],
        required: [true, 'Nama makanan harus diisi']
    },
    description: {
        type: String,
        maxlength: [1000, 'Panjang deskripsi makanan maksimal 1000 karakter']
    },
    price: {
        type: Number,
        default: 0
    },
    image: {
        type: Schema.Types.ObjectId,
        ref: 'images.files', // Reference to GridFS files collection
        required: false
    },

    category:{
        type: Schema.Types.ObjectId,
        ref: 'category'
        //catatan belajar: ref diambil dari 
        //.category/model 
        //const Category = model('category '(yang diambil yang di dalam model), categorySchema); 
    },

    tags: [{
        type: Schema.Types.ObjectId,
        ref: 'tags'
        
    }]
},{timestamps: true});

const Product = model('product', productSchema);

module.exports = Product;