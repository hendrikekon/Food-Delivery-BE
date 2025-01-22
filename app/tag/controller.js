const Tags = require('./model');


const store = async (req, res, next) => {
    try{
        let payload = req.body;
        let tags = new Tags(payload)
        await tags.save();
        return res.json(tags);
    
    }catch(err){
        if(err && err.name === 'ValidationError'){
            return res.json({
                error: 1,
                message: err.message,
                fields: err.errors
            })
        }

        next(err);
    }
}


const index = async (req, res, next) => {
    try {
        const{skip = 0, limit=10} = req.query;
        const tags = await Tags.find()
        .skip(parseInt(skip))
        .limit(parseInt(limit));
        res.json(tags);
    } catch (error) {
        next(error);
    }
}

const update = async (req, res) => {
    try{
        let payload = req.body;
        let { id } = req.params;
        
        let tags = await Tags.findByIdAndUpdate(id, payload, {
            new: true,
            runValidators: true
        });
        return res.json(tags);
        
    }catch(err){
        if(err && err.name === 'ValidationError'){
            return res.json({
                error: 1,
                message: err.message,
                fields: err.errors
            })
        }

        next(err);
    }
}

const destroy = async (req, res) => {
    const { id } = req.params;
    try {
        const tags = await Tags.findByIdAndDelete(id);
        
        if (!tags) {
            return res.status(404).json({ message: 'Tag not found' });
        }
        res.status(200).json({ message: 'Tag deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


module.exports = {
    index,
    store,
    update,
    destroy
}