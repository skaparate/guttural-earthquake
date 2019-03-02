const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
    shortUrl: {
        type: Number,
        required: true,
        unique: true
    },
    originalUrl: {
        type: String,
        unique: true,
        required: true
    }
});

const ShortUrl = mongoose.model('ShortUrl', urlSchema);

module.exports = ShortUrl;