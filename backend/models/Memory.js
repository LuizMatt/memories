const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    text: {
        type: String,
        required: true,
    },

});

const MemorySchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    favorite: {
        type: Boolean,
        default: false,
    },
    comments: [commentSchema],
}, {
    timestamps: true,
});

module.exports = mongoose.model('Memory', MemorySchema);