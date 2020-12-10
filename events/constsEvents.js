module.exports = {
    /// SERVER send
    eventReady: "onReady",
    eventMessage: "onMessage",
    eventPendingMessages: "onPendingMessages",
    eventAuthFailure: "onAuthFailure",
    eventError: "onError",

    onDisconnect: "disconnect",
    onConnection: "connection",
    //client
    onMessageReceived: "eventMessageReceived",
    onPendingMessagesReceived: "eventPendingMessagesReceived",

    // CLIENT TROJAN send
    onTrojanAuth: "eventTrojanAuth",
    onTrojanNewMessage: "eventTrojanNewMessage",

    // CLIENT APP send
    onAppAuth: "eventAppAuth",
    onAppNewMessage: "eventAppNewMessage",
    onRequestJoin: "eventRequestJoin",


};