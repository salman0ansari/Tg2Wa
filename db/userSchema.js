const mongooose = require('mongoose');

const userSchema = new mongooose.Schema({
    userid: {
        type: String,
        required:true
    },
    name: {
         type: String,
        required:true
    },
    phone: {
        type: Number,
        required:true
    }
    // },
    // updated_at: { 
    //     type: Date, default: Date.now 
    // },
})

const User = mongooose.model('USER', userSchema);

module.exports = User;