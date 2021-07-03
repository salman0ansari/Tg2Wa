const { Telegraf } = require('telegraf')
const axios = require('axios')
require('dotenv').config()

const bot = new Telegraf(process.env.BOT_API)
bot.start(async (ctx) => {
    await ctx.reply('Hello')
    await ctx.reply('Send me a sticker and i will forward sticker to our whatsapp group')
    await ctx.reply('Join our group')
    await ctx.reply('https://chat.whatsapp.com/IYvVAuj5u61FBor3FL5Noa')
})

bot.help((ctx) => ctx.reply('Send me a sticker'))

bot.on('sticker', async (ctx) => {
    let { sticker } = await ctx.message
    if (sticker.is_animated) {
        ctx.reply('Sorry currently i dont support animated stickers')
    }
    else {
        ctx.reply('I have received the sticker please wait while i process')

        // getting sticker data
        let stickerId = await sticker.file_id
        let { file_id } = await ctx.telegram.getFile(stickerId)
        let { href } = await ctx.telegram.getFileLink(file_id);

        // converting sticker into base64 
        let image = await axios.get(href, { responseType: 'arraybuffer' });
        let returnedB64 = Buffer.from(image.data).toString('base64');

        let options = {
            method: 'POST',
            url: 'https://salman2015ansari-wa-automate.zeet.app/sendRawWebpAsSticker', // To get this url check readme.md
            headers: {
                accept: '*/*',
                'Content-Type': 'application/json',
                api_key: process.env.API_KEY
            },
            data: { args: { to: '13476672301-1625115028@g.us', webpBase64: returnedB64, animated: 'flase' } } 
            // (13476672301-1625115028@g.us) check api_docs
        };

        // sending sticker 
        await axios.request(options).then(function (response) {
            ctx.reply('Sticker sent')
        }).catch(function (error) {
            ctx.reply(error)
        });

    }


})
bot.launch()
