const Cart = require("../models/carts");
const User = require("../models/user");
const Cloth = require("../models/clothes");


const stripe = require("stripe")(process.env.STRIPE_KEY);


const findUserAndCart = async (userID) => {
  if (!userID) {
    throw new Error("ID de usuario no proporcionado");
  }
  
  const foundUser = await User.findOne({ _id: userID });
  if (!foundUser) {
    throw new Error("Usuario no encontrado");
  }
  
  const foundCart = await Cart.findById(foundUser.cart);
  if (!foundCart) {
    throw new Error("Carrito no encontrado");
  }
  
  return { foundUser, foundCart };
};

const getOrCreateStripePrice = async (product) => {
  try {
   
    const existingProducts = await stripe.products.list({
      limit: 100,
    });
    
    let stripeProduct = existingProducts.data.find(p => 
      p.name === product.name && p.metadata.sizeId === product.sizeId
    );
    
    
    if (!stripeProduct) {
      stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description || `${product.name} - ${product.sizeId}`,
        images: product.img ? [product.img] : undefined,
        metadata: {
          sizeId: product.sizeId,
          category: product.category || 'general'
        }
      });
      
      console.log(`Producto creado en Stripe: ${stripeProduct.id}`);
    }
    
    
    const existingPrices = await stripe.prices.list({
      product: stripeProduct.id,
      limit: 100,
    });
    
    let stripePrice = existingPrices.data.find(p => 
      p.unit_amount === Math.round(product.price * 100)
    );
    
   
    if (!stripePrice) {
      stripePrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: Math.round(product.price * 100),
        currency: 'usd', 
      });
      
      console.log(`Precio creado en Stripe: ${stripePrice.id}`);
    }
    
    return stripePrice.id;
  } catch (error) {
    console.error(`Error al crear producto/precio en Stripe: ${error.message}`);
    throw error;
  }
};

exports.createCheckoutSession = async (req, res) => {
  try {
    const userID = req.user?.id;
    
    const { foundUser, foundCart } = await findUserAndCart(userID);
  
    if (!foundCart.products || foundCart.products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "El carrito está vacío"
      });
    }
    
    const line_items = [];
    
    for (const product of foundCart.products) {
      const priceId = await getOrCreateStripePrice(product);
      
      line_items.push({
        price: priceId,
        quantity: product.quantity || 1,
      });
      
      product.priceID = priceId;
    }
    
    await foundCart.save();
    
    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${process.env.SUCCESS_BASE_URL}`,
      cancel_url: `${process.env.CANCEL_BASE_URL}`,
      customer_email: foundUser.email,
      metadata: {
        userId: userID,
        cartId: foundCart._id.toString()
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        session_url: session.url,
        session: session,
      }
    });
  } catch (error) {
    console.error("Error al crear sesión de checkout:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear la sesión de checkout",
      error: error.message
    });
  }
};


exports.createOrder = async (req, res) => {
  try {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WH_SIGNING_SECRET;
    
    if (!sig || !endpointSecret) {
      return res.status(400).json({
        success: false,
        message: "Falta la firma de Stripe o la clave secreta del webhook"
      });
    }
    
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error("Error al verificar webhook:", err);
      return res.status(400).json({
        success: false, 
        message: "Hubo un problema relacionado con el evento de Stripe",
        error: err.message
      });
    }
    
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        
        const userId = session.metadata.userId;
        const cartId = session.metadata.cartId;
        
        console.log(`Checkout completado: userId=${userId}, cartId=${cartId}`);
        break;
        
      case "charge.succeeded":
       
        const paymentIntent = event.data.object;
        const email = paymentIntent.billing_details.email;
        
        if (!email) {
          throw new Error("Email no encontrado en los detalles de facturación");
        }
        
        const receiptURL = paymentIntent.receipt_url;
        const receiptID = receiptURL
          .split("/")
          .filter((item) => item)
          .pop();
        
        const amount = paymentIntent.amount;
        const date_created = paymentIntent.created;
        
        const updatedUser = await User.findOneAndUpdate(
          { email },
          {
            $push: {
              receipts: {
                receiptURL,
                receiptID,
                date_created,
                amount,
              },
            },
          },
          { new: true }
        );
        
        if (!updatedUser) {
          throw new Error(`Usuario con email ${email} no encontrado`);
        }
        
        console.log(`Recibo creado para ${email}: ${receiptID}`);
        break;
        
      default:
        console.log(`Tipo de evento no manejado: ${event.type}`);
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Error al procesar webhook:", error);
    res.status(500).json({
      success: false,
      message: "Error al procesar el webhook",
      error: error.message
    });
  }
};

exports.createOrderFromItems = async (req, res) => { 
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
      success_url: `${process.env.SUCCESS_BASE_URL || "http://localhost:5173/compra-exitosa"}`,
      cancel_url: `${process.env.CANCEL_BASE_URL || "http://localhost:5173/compra-cancelada"}`,
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
},



exports.createCart = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionaron datos para crear el carrito"
      });
    }
    
    const newCart = await Cart.create(req.body);
    
    res.status(201).json({
      success: true,
      message: "Carrito creado exitosamente",
      data: {
        cart: newCart,
      }
    });
  } catch (error) {
    console.error("Error al crear carrito:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear el carrito",
      error: error.message
    });
  }
};


exports.getCart = async (req, res) => {
  try {
    const userID = req.user?.id;
    
    const { foundCart } = await findUserAndCart(userID);
    
    res.status(200).json({
      success: true,
      data: {
        cart: foundCart,
      }
    });
  } catch (error) {
    console.error("Error al obtener carrito:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el carrito",
      error: error.message
    });
  }
};

exports.editCart = async (req, res) => {
  try {
    const userID = req.user?.id;
    
    const { foundUser } = await findUserAndCart(userID);
    
    const { products } = req.body;
    
    if (!products) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionaron productos para actualizar"
      });
    }
    
    const updatedCart = await Cart.findByIdAndUpdate(
      foundUser.cart,
      { products },
      { new: true }
    );
    
    if (!updatedCart) {
      throw new Error("Error al actualizar el carrito");
    }
    
    res.status(200).json({
      success: true,
      message: "Tu carrito fue actualizado exitosamente",
      data: {
        cart: updatedCart,
      }
    });
  } catch (error) {
    console.error("Error al editar carrito:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el carrito",
      error: error.message
    });
  }
};