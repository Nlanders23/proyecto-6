// Importa los modelos de Cart y User
const Cart = require("../models/carts");
const User = require("../models/user");

// Importa stripe y configura con la clave de stripe en las variables de entorno
const stripe = require("stripe")(process.env.STRIPE_KEY);

/**
 * Encuentra al usuario y su carrito
 * @param {string} userID - ID del usuario
 * @returns {Object} - Objeto con el usuario y su carrito
 */
const findUserAndCart = async (userID) => {
  if (!userID) {
    throw new Error("ID de usuario no proporcionado");
  }
  
  const foundUser = await User.findOne({ _id: userID });
  if (!foundUser) {
    throw new Error("Usuario no encontrado");
  }
  
  const foundCart = await Cart.findById(foundUser.cart).populate({
    path: "products",
  });
  if (!foundCart) {
    throw new Error("Carrito no encontrado");
  }
  
  return { foundUser, foundCart };
};

/**
 * Función para crear una sesión de checkout en Stripe
 */
exports.createCheckoutSession = async (req, res) => {
  try {
    const userID = req.user?.id;
    
    // Encuentra al usuario y su carrito
    const { foundUser, foundCart } = await findUserAndCart(userID);
    
    // Verifica que el carrito tenga productos
    if (!foundCart.products || foundCart.products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "El carrito está vacío"
      });
    }
    
    // Crea line_items para la sesión de Stripe
    const line_items = foundCart.products.map((e) => {
      if (!e.priceID) {
        throw new Error(`Producto sin priceID: ${e._id}`);
      }
      return {
        price: e.priceID,
        quantity: e.quantity || 1,
      };
    });
    
    // Crea una sesión de checkout en Stripe
    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${process.env.SUCCESS_BASE_URL}`,
      cancel_url: `${process.env.CANCEL_BASE_URL}`,
      customer_email: foundUser.email,
    });
    
    // Envia la respuesta con formato consistente
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

/**
 * Función para procesar webhooks de Stripe y crear órdenes
 */
exports.createOrder = async (req, res) => {
  try {
    // Obtiene la firma de Stripe de los headers
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
      // Construye el evento de Stripe
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error("Error al verificar webhook:", err);
      return res.status(400).json({
        success: false, 
        message: "Hubo un problema relacionado con el evento de Stripe",
        error: err.message
      });
    }
    
    // Dependiendo del tipo de evento
    switch (event.type) {
      case "charge.succeeded":
        // Si la carga fue exitosa
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
        
        // Actualiza el usuario con los datos del recibo
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
    
    // Envía una respuesta exitosa
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

/**
 * Función para crear un carrito
 */
exports.createCart = async (req, res) => {
  try {
    // Valida que se proporcionen los datos necesarios
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionaron datos para crear el carrito"
      });
    }
    
    // Crea un carrito con los datos de la solicitud
    const newCart = await Cart.create(req.body);
    
    // Envía el nuevo carrito en la respuesta
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

/**
 * Función para obtener un carrito
 */
exports.getCart = async (req, res) => {
  try {
    const userID = req.user?.id;
    
    // Encuentra al usuario y su carrito
    const { foundCart } = await findUserAndCart(userID);
    
    // Envía el carrito encontrado en la respuesta
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

/**
 * Función para editar un carrito
 */
exports.editCart = async (req, res) => {
  try {
    const userID = req.user?.id;
    
    // Encuentra al usuario y su carrito
    const { foundUser } = await findUserAndCart(userID);
    
    // Toma los nuevos datos de los productos de la solicitud
    const { products } = req.body;
    
    if (!products) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionaron productos para actualizar"
      });
    }
    
    // Actualiza el carrito con los nuevos datos de los productos
    const updatedCart = await Cart.findByIdAndUpdate(
      foundUser.cart,
      { products },
      { new: true }
    );
    
    if (!updatedCart) {
      throw new Error("Error al actualizar el carrito");
    }
    
    // Envía un mensaje y el carrito actualizado en la respuesta
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