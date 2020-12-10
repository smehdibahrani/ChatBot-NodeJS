let constsEvents = require('./constsEvents');
const {Account} = require('./../models/account');
const {ChatRoom} = require('./../models/chatroom');
const {Message} = require('./../models/message');
const {ObjectID} = require('mongodb');
const path = require('path');
const fs = require("fs");
let uuidv1 = require('uuid/v1');


function sendMessageByTrojan(socketClient, chatRoomToken, dataMessage) {
    var message = new Message(dataMessage);
    console.log("ct send message");
    message.save().then(() => {
        ChatRoom.updateOne({_id: message.chatId}, {
            lastMessage: message._id,
        }, function(err, affected, resp) {
            console.log("ct send message saved");
            socketClient.broadcast.to(chatRoomToken).emit(constsEvents.eventMessage, message.toJSON());
            console.log(chatRoomToken);
        });

    }).catch((e) => {
        console.log("ct error");
        socketClient.emit(constsEvents.eventError, 'error on saving message!');
    });
}


module.exports = function (io) {

    io.on(constsEvents.onConnection, (socketClient) => {
        console.log(`a new user ${socketClient.id} is connected`);

        socketClient.on(constsEvents.onDisconnect, (data) => {
            console.log(`user ${socketClient.id} is disconnected`);

        });

        ///client trojan////////////////////////////////////////////////////////////////////////////////

        socketClient.on(constsEvents.onTrojanAuth, (data) => {
            var token = data.token;
            ChatRoom.findByToken(token).then((chatroom) => {
                if (!chatroom) {
                    return Promise.reject();
                }
                socketClient.leave(token);
                socketClient.join(token);
                socketClient.emit(constsEvents.eventReady, 'authentication success');

                Message.find({
                    chatId: chatroom._id, owner: 'a', received: false
                }, function (error, messages) {
                    if (error)
                        return console.log(error);
                    socketClient.emit(constsEvents.eventPendingMessages, messages);
                });

            }).catch((error) => {
                socketClient.emit(constsEvents.eventAuthFailure, 'authentication failure');
                socketClient.disconnect();
            });
        });

        socketClient.on(constsEvents.onTrojanNewMessage, (dataMessage) => {

            dataMessage.owner = 't';
            ChatRoom.findOne({_id: dataMessage.chatId}).then((chatroom) => {
                if (!chatroom) {
                    return Promise.reject();
                }
                if (dataMessage.type === 'photo') {
                    const filename = uuidv1() + '.png';
                    var base64Data = dataMessage.data.replace(/^data:image\/png;base64,/, "");
                    fs.writeFile(path.join(__dirname, "./../public/uploads/" + filename), base64Data, 'base64', function (err) {
                        if (err)
                            return console.log(err);
                        dataMessage.data = '/uploads/' + filename;
                        sendMessageByTrojan(socketClient, chatroom.token, dataMessage);
                    });

                } else {
                    sendMessageByTrojan(socketClient, chatroom.token, dataMessage);
                }


            }).catch((error) => {
                socketClient.emit(constsEvents.eventAuthFailure, 'authentication failure');
                socketClient.disconnect();
            });

        });


        ///client app////////////////////////////////////////////////////////////////////////////////

        socketClient.on(constsEvents.onAppAuth, (token) => {
            Account.findByToken(token).then((account) => {
                if (!account) {
                    return Promise.reject();
                }

                ChatRoom.find(function (error, chatRooms) {
                    if (error)
                        return socketClient.emit(constsEvents.eventError, error);
                    var chatIds = [];
                    // for (var i = 0; i < chatRooms.length; i++) {
                    //
                    //
                    // }
                    console.log(chatRooms[0].token);
                    socketClient.leave(chatRooms[0].token,(f)=>{
                        socketClient.join(chatRooms[0].token);
                        chatIds.push(chatRooms[0]._id);
                        socketClient.emit(constsEvents.eventReady, 'authentication success');
                    });


                    Message.find({
                        chatId: {"$in": chatIds}, owner: 't', received: false
                    }, function (error, messages) {
                        if (error)
                            return console.log(error);
                        socketClient.emit(constsEvents.eventPendingMessages, messages);
                    });
                });


            }).catch((error) => {
                socketClient.emit(constsEvents.eventAuthFailure, 'authentication failure');
                socketClient.disconnect();
            });
        });


        socketClient.on(constsEvents.onAppNewMessage, (dataMessage) => {
            try {
                dataMessage = JSON.parse(dataMessage);
            }catch (e) {

            }
            var token = dataMessage.token;
            var type = dataMessage.type;
            var data = dataMessage.data;
            var owner = 'a';
            ChatRoom.findByToken(token).then((chatroom) => {
                if (!chatroom) {
                    return Promise.reject();
                }
                var chatId = chatroom._id;
                var message = new Message({type, data, owner, chatId});
                message.save().then(() => {
                    ChatRoom.updateOne({_id: message.chatId}, {
                        lastMessage: message._id,
                    }, function(err, affected, resp) {});
                    socketClient.broadcast.to(token).emit(constsEvents.eventMessage, message.toJSON());
                }).catch((e) => {
                    socketClient.emit(constsEvents.eventError, 'error on saving message!');
                });

            }).catch((error) => {
                socketClient.emit(constsEvents.eventAuthFailure, 'authentication failure');
                socketClient.disconnect();
            });

        });


        socketClient.on(constsEvents.onRequestJoin, (token) => {
            socketClient.leave(token);
            socketClient.join(token);
        });


        socketClient.on(constsEvents.onMessageReceived, (dataMessage) => {
            var messageId = '';
            try {
                messageId = JSON.parse(dataMessage).messageId;
            } catch (e) {
                messageId = dataMessage.messageId;
            }
            Message.updateOne({_id: new ObjectID(messageId)}, {$set: {received: true}}).then(() => {

            }).catch((e) => {
                socketClient.emit(constsEvents.eventError, e);
            });
        });

        socketClient.on(constsEvents.onPendingMessagesReceived, (dataMessage) => {

            var pendingMessageIds = JSON.parse(dataMessage).pendingMessageIds;

            Message.updateOne({_id: {"$in": pendingMessageIds}}, {$set: {received: true}}).then(() => {

            }).catch((e) => {
                socketClient.emit(constsEvents.eventError, e);
            });
        });
    });
};