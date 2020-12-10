const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

var accountSchema = new mongoose.Schema({

    email: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,

    },
    name: {
        type: String,
        required: true
    },

    picUrl: {
        type: String,
    },

    token: {
        type: String,
    }

});
accountSchema.methods.toJSON = function () {
    var account = this;
    return account.toObject();
};
accountSchema.methods.generateAuthToken = function () {
    var account = this;
    var access = 'auth';
    var token = jwt.sign({_id: account._id.toHexString(), access}, '123abc').toString();

    account.token = token;

    return account.save().then(() => {
        return token
    })
};

accountSchema.statics.findByEmail = function(email){
    var account = this;
    return account.findOne({email}).then((user)=>{
        if(!user){
            return Promise.reject();
        }
        return Promise.resolve(user);
    })
};

accountSchema.statics.findByToken = function (token) {
    var account = this;
    var decoded;

    try {
        decoded = jwt.verify(token, '123abc')
    } catch (e) {
        return Promise.reject();
    }

    return account.findOne({
        '_id': decoded._id,
        'token': token
    })
};
var Account = mongoose.model('accounts', accountSchema);

module.exports = {Account};