const express = require("express");
const router = express.Router();

const authorization = require("../middlewares/authorization");

const checkoutController = require("../controllers/checkoutController");

router.get(
    "/create-checkout-session",
    authorization,
    checkoutController.createCheckoutSession
  );

  router.post(
    "/create-order",
    express.raw({ type: "application/json" }),
    checkoutController.createOrder
  );

  router.post("/create-cart", checkoutController.createCart);

  router.get("/get-cart", authorization, checkoutController.getCart);

  router.put("/edit-cart", authorization, checkoutController.editCart);

  router.post(
    "/create-order",
    authorization, 
    async (req, res) => {
      try {
        const userID = req.user?.id;
        const { items } = req.body;
        
        if (!items || !Array.isArray(items) || items.length === 0) {
          return res.status(400).json({
            success: false,
            message: "No items provided"
          });
        }
        
        const products = items.map(item => ({
          quantity: item.quantity || 1,
          name: item.name,
          price: item.price,
          sizeId: item.size || "standard",
          description: item.description || item.name,
          img: item.img || "",
          category: item.category || "general"
        }));
        
      
        const newCart = await Cart.create({ products });
        
       
        if (userID) {
          await User.findByIdAndUpdate(userID, { cart: newCart._id });
        }
        
        
        const line_items = [];
        
        for (const product of products) {
          const stripeProduct = await stripe.products.create({
            name: product.name,
            description: product.description || `${product.name}`,
            images: product.img ? [product.img] : undefined,
            metadata: {
              sizeId: product.sizeId,
              category: product.category || 'general'
            }
          });
          
          const stripePrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: Math.round(product.price * 100),
            currency: 'usd',
          });
          
          line_items.push({
            price: stripePrice.id,
            quantity: product.quantity
          });
        }
        
        const session = await stripe.checkout.sessions.create({
          line_items,
          mode: "payment",
          success_url: `${process.env.SUCCESS_BASE_URL || "http://localhost:5173/success"}`,
          cancel_url: `${process.env.CANCEL_BASE_URL || "http://localhost:5173/carrito"}`,
          metadata: {
            cartId: newCart._id.toString(),
            userId: userID || "anonymous"
          }
        });
        
        res.status(200).json({
          success: true,
          url: session.url  
        });
      } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({
          success: false,
          message: "Error creating order",
          error: error.message
        });
      }
    }
  );

module.exports = router;