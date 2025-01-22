const path = require('path');
const fs = require('fs');
const Product = require('./model');
const config = require('../config');
const Category = require('../category/model');
const Tags = require('../tag/model');
const mongoose = require('mongoose');
const db = require('../../database');

const store = async (req, res, next) => {
    try{
        let payload = req.body;

        //relasi category
        if(payload.category){
            let category = await Category.findOne({name: {$regex: payload.category, $options: 'i'}});
            if(category){
                payload= {...payload, category: category._id};
            }else{
                delete payload.category;
            }
        }

        // Relasi tags
        if (payload.tags && payload.tags.length > 0) {
            let tags = await Tags.find({ name: { $in: payload.tags } });
            if (tags.length > 0) {
                payload = { ...payload, tags: tags.map(tags => tags._id) };
            } else {
                delete payload.tags;
            }
        }


        // image upload (if any) using GridFS
        if(req.file){
            const { filename, mimetype, size, buffer } = req.file;

            // Create a GridFS bucket instance
            const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'images' });

           // Upload the file to GridFS using the buffer directly
           const uploadStream = bucket.openUploadStream(filename, { contentType: mimetype });
           uploadStream.write(buffer);
           uploadStream.end();

            // Once the file is uploaded to GridFS, save the product and image info
            uploadStream.on('finish', async () => {
                try {
                    console.log('File uploaded successfully to GridFS with ID:', uploadStream.id);
                    // Save product with GridFS file ID
                    let product = new Product({ ...payload, image: uploadStream.id });
                    await product.save();
                    console.log('Product saved with image ID:', uploadStream.id);
                    return res.status(200).json(product);
                } catch (err) {
                    // In case of error, clean up the file from GridFS
                    bucket.delete(uploadStream.id, (err) => {
                        if (err) console.error("Error deleting file from GridFS", err);
                    });
                    res.status(400).json({
                        error: 1,
                        message: err.message,
                        fields: err.errors
                    })
                    next(err);
                }
            });

            uploadStream.on('error', (err) => {
                // In case of upload error, clean up the temporary file
                fs.unlinkSync(path);
                next(err);
            });
        }else{
            // if no image uploaded, set image: null
            let product = new Product({ ...payload, image: null })
            await product.save();
            return res.status(200).json(product);
        }
    }catch(err){
        res.status(400).json({
            error: 1,
            message: err.message,
            fields: err.errors
        })
        next(err);
    }
}

const getImage = (req, res) => {
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'images' });
    const { id } = req.params;

    bucket.openDownloadStream(new mongoose.Types.ObjectId(id))
        .on('error', () => res.status(404).send('Image not found'))
        .pipe(res);
};


const index = async (req, res, next) => {
    try {
        let{skip = 0, limit=10, q= '', category = '', tags = []} = req.query;
        
        let criteria ={};

        if (q.length) {
            criteria = {
                ...criteria,
                name: { $regex: `${q}`, $options: 'i' } 
            }
        }
        if(category.length){
            let categoryResult = await Category.findOne({name: {$regex: `${category}`, $options: 'i'}});
            
            if(categoryResult){
                criteria= {...criteria, category: categoryResult._id};
            }
        }

        if (tags.length) {
            let tagsResult = await Tags.find({name: {$in: tags }});
            if(tagsResult.length){
                criteria = { ...criteria, tags: {$in: tagsResult.map(tags => tags._id)}};
            }
            
      
        }
        const count = await Product.countDocuments(criteria);
        // let count = await Product.find().countDocuments();
        const products = await Product.find(criteria)
        .skip(parseInt(skip))
        .limit(parseInt(limit))
        .populate('category')
        .populate('tags');
        return res.status(200).json({
            data: products,
            count
        });
    } catch (error) {
        res.status(500).json({
            error: 1,
            message: err.message,
            fields: err.errors
        })
        next(error);
    }
}

const indexbyId = async (req, res) => {
    const productId = req.params.id;
    try {
        const product = await Product.findById(productId)
        .populate('category')
        .populate('tags');;
        if (product) {
            return res.status(200).json(product);
        } else {
            res.status(404).send('Product not found');
        }
    } catch (error) {
        res.status(500).send(error);
    }
}


const update = async (req, res, next) => {
    try {
        let payload = req.body;
        let { id } = req.params;

        // Relasi Category
        if (payload.category) {
            let category = await Category.findOne({ name: { $regex: payload.category, $options: 'i' } });
            if (category) {
                payload = { ...payload, category: category._id };
            } else {
                delete payload.category;
            }
        }

        // Relasi tags
        if (payload.tags && payload.tags.length > 0) {
            let tags = await Tags.find({ name: { $in: payload.tags } });
            if (tags.length > 0) {
                payload = { ...payload, tags: tags.map(tags => tags._id) };
            } else {
                delete payload.tags;
            }
        }
        
        // image upload (if any) using GridFS
        if (req.file) {
            const { filename, mimetype, size, buffer } = req.file;

            // Create a GridFS bucket instance
            const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'images' });

            // Upload the file to GridFS using the buffer directly
            const uploadStream = bucket.openUploadStream(filename, { contentType: mimetype });
            uploadStream.write(buffer);
            uploadStream.end();

            // Once the file is uploaded, update the product with the new image ID
            uploadStream.on('finish', async () => {
                try {
                    // Find the current product to check if there's an existing image
                    let imgProduct = await Product.findById(id);
                    if (imgProduct && imgProduct.image) {
                        // Delete the old image from GridFS
                        const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'images' });
                        bucket.delete(imgProduct.image, (err) => {
                            if (err) {
                                console.error("Error deleting old image from GridFS", err);
                            } else {
                                console.log("Old image deleted from GridFS");
                            }
                        });
                    }

                    // Update product with new image ID
                    payload.image = uploadStream.id;
                    let updatedProduct = await Product.findByIdAndUpdate(id, payload, {
                        new: true,
                        runValidators: true
                    });

                    return res.status(200).json(updatedProduct);
                } catch (err) {
                    // If an error occurs, delete the uploaded file from GridFS
                    bucket.delete(uploadStream.id, (err) => {
                        if (err) console.error("Error deleting file from GridFS", err);
                    });

                    return res.status(400).json({
                        error: 1,
                        message: err.message,
                        fields: err.errors
                    });
                }
            });

            uploadStream.on('error', (err) => {
                // In case of upload error, log the error
                console.error("Upload error: ", err);
                next(err);
            });
        } else {
            // If no new image is uploaded, update the product without changing the image field
            let updatedProduct = await Product.findByIdAndUpdate(id, payload, {
                new: true,
                runValidators: true
            });

            return res.status(200).json(updatedProduct);
        }
    } catch (err) {
        if (err && err.name === 'ValidationError') {
            return res.status(400).json({
                error: 1,
                message: err.message,
                fields: err.errors
            });
        }
        next(err);
    }
};

const destroy = async (req, res) => {
    const { id } = req.params;
    try {
        let imgProduct = await Product.findById(id);
        if (imgProduct && imgProduct.image) {
            const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'images' });
            bucket.delete(imgProduct.image, (err) => {
                if (err) {
                    console.error("Error deleting old image from GridFS", err);
                    return res.status(500).json({ message: 'Error deleting image from GridFS' });
                } else {
                    console.log("Old image deleted from GridFS");
                }
            });
        }

        // Delete the product after the image deletion
        const product = await Product.findByIdAndDelete(id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        return res.status(200).json({ message: 'Product deleted successfully' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    index,
    indexbyId,
    store,
    update,
    destroy,
    getImage
}