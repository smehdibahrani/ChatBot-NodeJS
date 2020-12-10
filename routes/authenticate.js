const {Account} = require('./../models/account');

var authenticate = (req, res, next) =>{
    var token = req.header('auth');
    Account.findByToken(token).then((account)=>{
        if(!account){
            return Promise.reject();     
        }
        req.account = account;
        req.token = token;
        next();
    }).catch((error)=>{
        res.status(401).send()
    })
};

module.exports = {authenticate};