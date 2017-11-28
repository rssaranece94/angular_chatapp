// app/models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');


// define the schema for our chat model
var chatSchema = mongoose.Schema({

        chatdetails  :  {
                chatid   :  {type: String, index: { unique: true }},
                unread   : [],
                chat     :  [{
                                messageId   : String,
                                message     : String,
                                sender      : String,
                                receiver    : String,
                                dateTime    : String,
                                edited      : Boolean,
                                deleted     : Boolean,
                                files       : Boolean,
                                image       : Boolean,
                                archived    : Boolean
                            }]
            }
});
module.exports = mongoose.model('Chat', chatSchema);
