const mongoose = require('mongoose');
const moment = require('jalali-moment');
const jwt = require('jsonwebtoken');

const Schema = mongoose.Schema;

var chatroomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    color: {
        type: Number,
    },
    token: {
        type: String,
    },
    createAt: {
        type: Number,
        default:moment.now()
    },
    lastMessage: {type: Schema.Types.ObjectId, ref: 'messages'},
    accountId: {type: Schema.Types.ObjectId, ref: 'accounts'},
});


chatroomSchema.methods.generateAuthToken = function () {
    var chatroom = this;
    var access = 'auth';
    var token = jwt.sign({_id: chatroom._id.toHexString(), access}, '123abc').toString();

    chatroom.token = token;

    return chatroom.save().then(() => {
        return token
    })
};
chatroomSchema.statics.findByToken = function (token) {
    var chatroom = this;
    var decoded;

    try {
        decoded = jwt.verify(token, '123abc')
    } catch (e) {
        return Promise.reject();
    }

    return chatroom.findOne({
        '_id': decoded._id,
        'token': token
    });
};

chatroomSchema.methods.toJSON = function () {
    var chrm = this;
    return chrm.toObject();
};

var ChatRoom = mongoose.model('chatrooms', chatroomSchema);
module.exports = {ChatRoom};