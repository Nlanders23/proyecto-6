const mongoose = require('mongoose');

const sizeSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        }
    }
)

const SizeCloth = mongoose.model('SizeCloth', sizeSchema);

module.exports = SizeCloth;