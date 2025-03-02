const Cloth = require('../models/clothes');

exports.createCloth = async (req, res) => {
    const { name, price, currency, description, img, sizes, category  } = req.body;
    try {
        const newCloth = await Cloth.create({ name, price, currency, description, img, sizes, category })
        res.json({ newCloth })
    } catch (error) {
        res.status(500).json({ msg: 'There was an error creating a new cloth' })
    }
}

exports.getAllClothes = async (req, res) => {
    try {
        const clothes = await Cloth.find({}).populate('sizes')
        return res.json({ clothes })
    } catch (error) {
        return res.status(500).json({ msg: "There was an error obtaining the data" })
    }
}

exports.getClothById = async (req, res) => {
    const {id} = req.params;
    try {
        const cloth = await Cloth.findById(id)
        return res.json({cloth})
    } catch (error) {
        return res.status(500).json({ msg: "There was an error obtaining the cloth" })
    }
}

exports.updateClothById = async (req, res) => {
    const {id} = req.params;
    const {  name, price, size } = req.body
    try {
        const actualizacionPrenda = 
	        await Cloth.findByIdAndUpdate(id, { name, price, size }, { new: true })
        res.json(actualizacionPrenda)
    } catch (error) {        
        res.status(500).json({
            msg: "There was an error updating the cloth"
        })
    }
}

exports.deleteClothById = async (req, res) => {
    const { id } = req.params;
    try {
        const prendaBorrada = await Cloth.findByIdAndDelete(id)
        return res.json({ prendaBorrada })
    } catch (error) {
        res.status(500).json({
            msg: "There was an error erasing the specified cloth",
            error
        })
    }
}