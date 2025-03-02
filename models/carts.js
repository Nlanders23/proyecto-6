const mongoose = require("mongoose");

const cartSchema = mongoose.Schema({
  products: [
    {
      quantity: {
        type: Number,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      sizeId: {
        type: String,
        required: true,
      },
      description: {
        type: String,
      },
      img: {
        type: String,
      },
      category: {
        type: String,
      },
    },
  ],
});

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;