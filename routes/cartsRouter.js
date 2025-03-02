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

module.exports = router;