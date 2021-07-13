require('dotenv').config()
const mongoose = require('mongoose');
const DB = process.env.MONGO_URI

mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify:false
}).then(() => {
    console.log(`Connnection to DB Successful`);
}).catch((err) => console.error(`No Connection`));