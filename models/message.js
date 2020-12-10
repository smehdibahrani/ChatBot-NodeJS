const mongoose = require('mongoose');
const moment = require('jalali-moment');
const Schema = mongoose.Schema;


var messageSchema = new mongoose.Schema({
    chatId: {type: Schema.Types.ObjectId, ref: 'chatrooms'},
    type: {
        type: String,
        required: true
    },
    data: {
        type: String,
        required: true
    },
    owner: {
        type: String, ///t or a
        required: true
    },
    received: {
        type: Boolean,
        default: false
    },
    createAt: {
        type: Number,
        default: moment()
    },

});

messageSchema.methods.toJSON = function () {
    var message = this;
    return message.toObject();
};

messageSchema.pre('save', function (next) {
    var message = this;
    message.createAt = moment();
    next();
});

var Message = mongoose.model('messages', messageSchema);


module.exports = {Message};