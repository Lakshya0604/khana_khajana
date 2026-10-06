import mongoose from "mongoose";

const shopSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    // Display-only listing seeded from public data. Never has real contact details; order mail goes to the platform inbox.
    isListing: { type: Boolean, default: false },
    hidden: { type: Boolean, default: false },
    // True when the menu is a sample copied from a well-known place in the same city (prices adjusted), not this restaurant's real menu
    sampleMenu: { type: Boolean, default: false },
    listingSource: { type: String },
    osmRef: { type: String },
    cuisines: { type: String },
    // URL of the public page the menu + prices were read from (only set when a menu is present)
    menuSource: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    items: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item"
    }]
}, { timestamps: true })

const Shop = mongoose.model("Shop", shopSchema)
export default Shop