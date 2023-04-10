const express = require("express");
const Stripe = require("stripe");
const {Order} = require("../models/order");
require("dotenv").config();

const stripe = Stripe(process.env.STRIPE_KEY);

const router = express.Router();

router.post("/create-checkout-session", async (req, res) => {
  const customer = await stripe.customers.create({
    metadata: {
      userId: req.body.userId,
      cart: JSON.stringify(req.body.cartItems),
    },
  });
  const line_items = req.body.cartItems.map((item) => {
    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: [item.image],
          description: item.desc,
          metadata: {
            id: item.id,
          },
        },
        unit_amount: item.price * 100,
      },
      quantity: item.cartQuantity,
    };
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    shipping_address_collection: {allowed_countries: ["US", "CA", "KE", "NG"]},
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {amount: 0, currency: "usd"},
          display_name: "Free shipping",
          delivery_estimate: {
            minimum: {unit: "business_day", value: 5},
            maximum: {unit: "business_day", value: 7},
          },
        },
      },
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {amount: 1500, currency: "usd"},
          display_name: "Next day air",
          delivery_estimate: {
            minimum: {unit: "business_day", value: 1},
            maximum: {unit: "business_day", value: 1},
          },
        },
      },
    ],
    phone_number_collection: {
      enabled: true,
    },
    customer: customer.id,
    line_items,
    mode: "payment",
    success_url: `${process.env.CLIENT_URL}/checkout-success`,
    cancel_url: `${process.env.CLIENT_URL}/cart`,
  });

  res.send({url: session.url});
});
//Stripr Webhook

const createOrder = async (customer, data) => {
  const Items = JSON.parse(customer.metadata.cart);

  const newOrder = new Order({
    userId: customer.metadata.userId,
    customerId: data.customer,
    paymentIntentId: data.payment_intent,
    products: Items,
    subtotal: data.amount_subtotal,
    total: data.amount_total,
    shipping: data.customer_details,
    payment_status: data.payment_status,
  });
  try {
    const savedOrder = await newOrder.save();
    console.log("Proccessed Order : ", savedOrder);
  } catch (err) {
    console.log(err);
  }
};

let endpointSecret;
// endpointSecret =
//   "whsec_4a1f640062ba2be4d4756deadf36fb0bfe468e518eee0afb40e5f7db2c84cfb0";

router.post(
  "/webhook",
  express.raw({type: "application/json"}),
  (request, response) => {
    const sig = request.headers["stripe-signature"];

    let data;
    let eventType;

    if (endpointSecret) {
      let event;
      try {
        event = stripe.webhooks.constructEvent(
          request.body,
          sig,
          endpointSecret
        );
        console.log("Webhook Verified");
      } catch (err) {
        response.status(400).send(`Webhook Error: ${err.message}`);
        console.log(`Webhook Error: ${err.message}`);
        return;
      }
      data = event.data.object;
      eventType = event.data.type;
    } else {
      data = request.body.data.object;
      eventType = request.body.type;
    }
    if (eventType === "checkout.session.completed") {
      stripe.customers
        .retrieve(data.customer)
        .then((customer) => {
          createOrder(customer, data);
        })
        .catch((err) => {
          console.log(err.message);
        });
    }
    response.send().end();
  }
);

module.exports = router;
