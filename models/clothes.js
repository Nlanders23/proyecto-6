const mongoose = require('mongoose');

const clothesSchema = mongoose.Schema(   
 {
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: "usd"
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
    },
    stripe: {
        productId: {
            type: String
        },
        prices: [
            {
                id: {
                    type: String
                },
                sizeId: {
                    type: String
                },
                price: {
                    type: Number
                }
            }
        ]
    }
 },
 {
    timestamps: true
 }
);

const Clothes = mongoose.model('Clothes', clothesSchema);

module.exports = Clothes;