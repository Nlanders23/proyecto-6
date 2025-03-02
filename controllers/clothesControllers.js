require('dotenv').config();
const Cloth = require('../models/clothes');
const stripe = require("stripe")(process.env.STRIPE_KEY);

exports.createCloth = async (req, res) => {
    const { name, price, currency, description, img, sizes, category } = req.body;

    try {
        // Create the Stripe product first
        const product = await stripe.products.create({
            name,
            description,
            images: Array.isArray(img) ? img : [img],
            metadata: {
                productDescription: description || '',
                slug: name.toLowerCase().replace(/\s+/g, '-') || '',
            },
        });

        // Create prices for each size
        const stripePrices = await Promise.all(
            sizes.map(async (sizeId) => {
                return await stripe.prices.create({
                    unit_amount: Math.round(price * 100),
                    currency: currency || "usd",
                    product: product.id,
                    metadata: {
                        sizeId: sizeId.toString() // Ensure sizeId is a string
                    },
                });
            })
        );

        // Format prices for MongoDB
        const clothPrices = stripePrices.map((e) => {
            return {
                id: e.id,
                sizeId: e.metadata.sizeId,
                price: e.unit_amount / 100,
            };
        });

        // Create the cloth in MongoDB with Stripe information
        const newCloth = await Cloth.create({
            name,
            price,
            currency: currency || "usd",
            description,
            img,
            sizes,
            category,
            stripe: {
                productId: product.id,
                prices: clothPrices
            }
        });

        // Send a single response
        return res.status(201).json({
            success: true,
            data: { newCloth }
        });

    } catch (error) {
        console.error("Error creating cloth:", error);
        return res.status(500).json({
            success: false,
            message: 'There was an error creating a new cloth',
            error: error.message
        });
    }
};


exports.getAllClothes = async (req, res) => {
    try {
        const clothes = await Cloth.find({}).populate('sizes');
        return res.status(200).json({
            success: true,
            data: { clothes }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "There was an error obtaining the data",
            error: error.message
        });
    }
};

exports.getClothById = async (req, res) => {
    const { id } = req.params;
    try {
        const cloth = await Cloth.findById(id).populate('sizes');

        if (!cloth) {
            return res.status(404).json({
                success: false,
                message: "Cloth not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: { cloth }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "There was an error obtaining the cloth",
            error: error.message
        });
    }
};

exports.updateClothById = async (req, res) => {
    const { id } = req.params;
    const { name, price, currency, description, img, sizes, category } = req.body;

    try {
        const existingCloth = await Cloth.findById(id);
        if (!existingCloth) {
            return res.status(404).json({
                success: false,
                message: "Cloth not found"
            });
        }

        if (existingCloth.stripe && existingCloth.stripe.productId) {
            await stripe.products.update(existingCloth.stripe.productId, {
                name: name || existingCloth.name,
                description: description || existingCloth.description,
                images: img || existingCloth.img,
                metadata: {
                    productDescription: description || existingCloth.description,
                    category: category || existingCloth.category
                }
            });

            if (price && price !== existingCloth.price) {
                if (existingCloth.stripe && existingCloth.stripe.prices) {
                    await Promise.all(
                        existingCloth.stripe.prices.map(async (priceObj) => {
                            if (priceObj.id) {
                                await stripe.prices.update(priceObj.id, { active: false });
                            }
                        })
                    );
                }

                const newStripePrices = await Promise.all(
                    (sizes || existingCloth.sizes).map(async (sizeId) => {
                        return await stripe.prices.create({
                            product: existingCloth.stripe.productId,
                            unit_amount: Math.round(price * 100),
                            currency: currency || existingCloth.currency || "usd",
                            metadata: {
                                sizeId
                            }
                        });
                    })
                );

                const newClothPrices = newStripePrices.map((e) => {
                    return {
                        id: e.id,
                        sizeId: e.metadata.sizeId,
                        price: e.unit_amount / 100
                    };
                });

                existingCloth.stripe.prices = newClothPrices;
            }
        }

        const updatedCloth = await Cloth.findByIdAndUpdate(id, {
            name: name || existingCloth.name,
            price: price || existingCloth.price,
            currency: currency || existingCloth.currency,
            description: description || existingCloth.description,
            img: img || existingCloth.img,
            sizes: sizes || existingCloth.sizes,
            category: category || existingCloth.category,
            stripe: existingCloth.stripe
        }, { new: true });

        res.status(200).json({
            success: true,
            data: { cloth: updatedCloth }
        });
    } catch (error) {
        console.error("Error updating cloth:", error);
        res.status(500).json({
            success: false,
            message: "There was an error updating the cloth",
            error: error.message
        });
    }
};

exports.deleteClothById = async (req, res) => {
    const { id } = req.params;
    try {
        const cloth = await Cloth.findById(id);

        if (!cloth) {
            return res.status(404).json({
                success: false,
                message: "Cloth not found"
            });
        }

        if (cloth.stripe && cloth.stripe.productId) {
            await stripe.products.update(cloth.stripe.productId, {
                active: false
            });

            if (cloth.stripe.prices && cloth.stripe.prices.length > 0) {
                await Promise.all(
                    cloth.stripe.prices.map(async (priceObj) => {
                        if (priceObj.id) {
                            await stripe.prices.update(priceObj.id, { active: false });
                        }
                    })
                );
            }
        }

        const deletedCloth = await Cloth.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Cloth deleted successfully",
            data: { deletedCloth }
        });
    } catch (error) {
        console.error("Error deleting cloth:", error);
        res.status(500).json({
            success: false,
            message: "There was an error erasing the specified cloth",
            error: error.message
        });
    }
};