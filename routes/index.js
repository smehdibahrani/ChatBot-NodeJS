var express = require('express');
var _ = require('lodash');
var {authenticate} = require('./authenticate');
var router = express.Router();
const validator = require('validator');
var {ObjectID} = require('mongodb');
var {Account} = require('./../models/account');
var {ChatRoom} = require('./../models/chatroom');
var {Message} = require('./../models/message');

router.post('/login', function (req, res) {

    var body = _.pick(req.body, ['email', 'name', 'picUrl']);
    if (!validator.isEmail(body.email)) {
        return res.status(400).json({error: 'email invalid!'})
    }
    if (_.isEmpty(body.name)) {
        return res.status(400).json({error: 'name empty!'})
    }
    var account = new Account(body);

    Account.findByEmail(body.email).then((acct) => {
        return acct.generateAuthToken().then((token) => {
            res.json(acct.toJSON());
        })
    }).catch((err) => {
        account.save().then(() => {
            return account.generateAuthToken();
        }).then((token) => {
            res.json({token});
        }).catch((e) => {
            console.log(e);
            res.status(400).send(e)
        });
    });
});
/////////////////////////////////////////////////  CHAT ROOM ROUTE /////////////////////////////////////////////////////////////////////
router.post('/chatroom/create', authenticate, function (req, res) {
    var body = _.pick(req.body, ['name', 'color']);
    if (_.isEmpty(body.name)) {
        return res.status(400).json({error: 'name empty!'})
    }
    body.accountId = req.account._id;
    var chatroom = new ChatRoom(body);
    chatroom.save().then(() => {
        return chatroom.generateAuthToken();
    }).then((token) => {
        var message = new Message({
            type: 'text',
            data: 'your chat room Token is : \n\n' + token+ '\n\n put token in your python app and run it. \n after that type help \n enjoy this.',
            owner: 't',
            received: true,
            chatId: chatroom._id 
        });
        message.save().then(() => {
            res.json(chatroom.toJSON());
        });

    }).catch((e) => {
        res.status(400).send(e)
    });
});

router.get('/chatroom/list', authenticate, function (req, res) {
    let accountId =req.account._id;
    ChatRoom.find({accountId: new ObjectID(accountId)})
        .populate('lastMessage').exec(function (err, results) {
            res.json(results);
        });

});

router.get('/message/list/:chatId', authenticate, function (req, res) {
    Message.find({chatId: req.params.chatId}, function (error, result) {
        if (error) return res.status(400).json({error});
        res.json([result[result.length-1]]);
    });
});

router.delete('/chatroom/remove/:chatId', authenticate, function (req, res) {
    var chatId = req.params.chatId;
    ChatRoom.findOneAndDelete({_id: new ObjectID(chatId)}, function (error, result) {
        if (error) return res.status(400).json({error});

        Message.deleteMany({chatId: new ObjectID(chatId)}, function (error, result) {
            if (error) return res.status(400).json({error});
            res.json({message: "delete success"});
        });

    });
});

router.delete('/message/remove/:chatId', authenticate, function (req, res) {
    var chatId = req.params.chatId;


    Message.deleteMany({chatId: new ObjectID(chatId)}, function (error, result) {
        if (error) return res.status(400).json({error});
        res.json({message: "delete success"});
    });

});


module.exports = router;
