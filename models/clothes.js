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
    currency: {
        type: String
    },
    description: {
        type: String
    },
    img: {
        type: Array,
        required: true
    },  
     sizes: [
         {
             type: mongoose.Schema.Types.ObjectId,
             ref: 'SizeCloth',
             required: true
         } 
     ],
     category: {
        type: String,
     }
 },
 {
    timestamps: true
 }
);

const Clothes = mongoose.model('Clothes', clothesSchema);

module.exports = Clothes;