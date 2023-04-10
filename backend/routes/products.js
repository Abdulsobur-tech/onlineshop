const express = require("express");
const {Product} = require("../models/product");
const cloudinary = require("../utils/cloudinary");
const isAdmin = require("../middleware/auth")

const router = express.Router();

//CREATE A PRODUCT

router.post("/", isAdmin, async (req, res) => {
  const {name, brand, desc, price, image} = req.body;
  try {
    if (image) {
      const uploadRes = await cloudinary.uploader.upload(image, {
        upload_preset: "onlineShop",
      });
      if (uploadRes) {
        const product = new Product({
          name,
          brand,
          desc,
          price,
          image: uploadRes,
        });
        const savedProduct = await product.save();
        return res.status(200).send(savedProduct);
      }
    }
  } catch (error) {
   
    return res.status(500).send(error);
  }
});

//GET ALL PRODUCTS

router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
   
    return res.status(200).json(products);
  } catch (error) {
    return res.status(500).send(error);
  }
});

module.exports = router;
