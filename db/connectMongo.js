require('dotenv').config()
const mongoose = require('mongoose');
const logger = require('pino')()

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify:false })
.then(() => logger.info("Connected to Database"))
.catch((err) => {
    logger.error(`Error Connecting to Database`)
    logger.error(err)
})