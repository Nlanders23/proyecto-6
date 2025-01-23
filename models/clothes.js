const mongoose = require('mongoose');

const clothesSchema = mongoose.Schema(   
 {
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
    },
    description: {
        type: String
    },
    item: {
        type: String,
    },
    size: {
        type: String,
    },   
 },
 {
    tymestamps: true
 }
);

const Clothes = mongoose.model('Clothes', clothesSchema);

module.exports = Clothes;