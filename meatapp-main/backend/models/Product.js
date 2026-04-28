const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: { type: String },
    title: { type: String, required: true },
    price: { type: String, required: true }, // Keeping as string to match frontend format "$220"
    originalPrice: { type: String },
    image: { type: String },
    imageUrl: { type: String },
    category: { type: String, default: 'Chicken' },
    description: { type: String },
    cutOptions: [{ type: String }], // e.g., ['Curry Cut', 'Whole']
    inStock: { type: Boolean, default: true },
});

ProductSchema.pre('validate', function syncNameAndTitle() {
    if (this.name && !this.title) {
        this.title = this.name;
    }

    if (this.title && !this.name) {
        this.name = this.title;
    }

    if (!this.image && this.imageUrl) {
        this.image = this.imageUrl;
    }

    if (!this.imageUrl && this.image) {
        this.imageUrl = this.image;
    }
});

module.exports = mongoose.model('Product', ProductSchema);
