require('dotenv').config()
const { Telegraf, Scenes, session } = require('telegraf');
const con = require('./core/connect')
const wa = require('./core/helper')
const User = require("./Db/userSchema");
const connect = require("./Db/connectMongo")
const ADMIN = "306549960";
const rateLimit = require('telegraf-ratelimit')
const bot = new Telegraf(process.env.BOT_TOKEN);
con.connect()

// Set limit to 5 message per 5 seconds
const limitConfig = {
    window: 5000,
    limit: 5,
    onLimitExceeded: async (ctx, next) => {
        await ctx.reply('rate limit exceeded Deleting...').then(console.log('Done')).catch((e) => console.log('Bot Blocked'))
        await ctx.deleteMessage()
    }
}
bot.use(rateLimit(limitConfig))

bot.use(session());
const KEY = process.env.KEY // invitation code
// async function isValidPhone(phone) {
//     const re = /^[7-9][0-9]{9}$/
//     return re.test(String(phone).toLowerCase())
// }

const Tg2Wa = new Scenes.WizardScene(
    'TelegramToWhatsapp',
    async (ctx) => {
        await ctx.reply(`Send invitation code to access this bot! :)`).then(console.log('Done')).catch((e) => console.log('Bot Blocked'))
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.wizard.state.key = ctx.message.text;
        if (ctx.wizard.state.key === KEY) {
            await ctx.reply('Success !!').then(console.log('Done')).catch((e) => console.log('Bot Blocked'))
            await ctx.reply('Hit /continue').then(console.log('Done')).catch((e) => console.log('Bot Blocked'))
            return ctx.wizard.next();
        }
        else {
            await ctx.reply(`Invalid invitation code\nStart again ?? /setup`).then(console.log('Done')).catch((e) => console.log('Bot Blocked'))
            return ctx.scene.leave();
        }
    },
    async (ctx) => {
        await ctx.reply("Enter your name").then(console.log('Done')).catch((e) => console.log('Bot Blocked'))
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.wizard.state.name = ctx.message.text;
        await ctx.reply(`Enter your mobile no in international format\ne.g. +919876543210`).then(console.log('Done')).catch((e) => console.log('Bot Blocked'))
        return ctx.wizard.next();
    },
    async (ctx) => {
        try {
            ctx.wizard.state.mobile = ctx.message.text;
            const { name, mobile } = ctx.wizard.state;
        if (!mobile.includes('+91') && !Number.isInteger(mobile)) {
            // if(isValidPhone(mobile)
            await ctx.reply(`Not an Indian Number Or\nInvalid Format\ne.g. +919876543210 `).then(console.log('Done')).catch((e) => console.log('Bot Blocked'))
            return ctx.scene.leave();}
        else{
            await ctx.reply(`Your name: ${name}\nYour Number: ${mobile}`).then(console.log('Done')).catch((e) => console.log('Bot Blocked'))
            await ctx.tg.sendMessage(ADMIN, `Name: ${name}\nMobile Number: ${mobile}\nUser chat: ${JSON.stringify(ctx.chat)}`)
            let alreadyThere = await User.findOne({ userid: JSON.stringify(ctx.chat.id) }).exec();
            if (alreadyThere) {
                ctx.reply('Welcome Back').then(console.log('Done')).catch((e) => console.log('Bot Blocked'))
                    return ctx.scene.leave();
                }
                await ctx.reply('Saving your number to db...').then(console.log('Done')).catch((e) => console.log('Bot Blocked'))
                const added = await new User({ userid: JSON.stringify(ctx.chat.id), name: name, phone: mobile });
                added.save(function (err) {
                    if (err) return handleError(err);
                    // saved!
                });
                if (added) {
                    ctx.reply('Done').then(console.log('Done')).catch((e) => console.log('Bot Blocked'))
                    ctx.reply('Now you can start sending me stickers').then(console.log('Done')).catch((e) => console.log('Bot Blocked'))
                } else {
                    ctx.reply('Something Wrong').then(console.log('Done')).catch((e) => console.log('Bot Blocked'))
                }
                return ctx.scene.leave();
        }
    
        
        } catch (error) {
            console.log('Error')
        }
        
        
        
        
    },
)
const stage = new Scenes.Stage([Tg2Wa])
bot.use(stage.middleware())

bot.command('start', (ctx) => {
    ctx.reply(`Hello \nStart Setup: /setup \nUpdate Number /update\nInfo: /me \nKey:`).then(console.log('Done')).catch((e) => console.log('Bot Blocked'))
});

bot.command('setup', (ctx) => {
    ctx.scene.enter('TelegramToWhatsapp');
});


bot.command('me', async (ctx) => {
    try {
        const { userid, name, phone } = await User.findOne({ userid: JSON.stringify(ctx.chat.id) }).exec();
        ctx.reply(`Your name: ${name}\nYour Number: ${phone}`).then(console.log('Done')).catch((e) => console.log('Bot Blocked'))
    } catch (error) {
        ctx.reply(`Error`).then(console.log('Done')).catch((e) => console.log('Bot Blocked'))
    }

})

bot.command('update', async (ctx) => {
    ctx.reply('Enter new number').then(console.log('Done')).catch((e) => console.log('Bot Blocked'))
    try {
        bot.on('message', async (ctx) => {
            const newNum = ctx.message.text
            if (!newNum.includes('+91') && !Number.isInteger(newNum)) {
                await ctx.reply(`Not an Indian Number Or\nInvalid Format\ne.g. +919876543210 `).then(console.log('Done')).catch((e) => console.log('Bot Blocked'))
            }
            else {
                ctx.reply(`Updating...`).then(console.log('Done')).catch((e) => console.log('Bot Blocked'))
                const filter = { userid: JSON.stringify(ctx.chat.id) }
                const update = { phone: newNum }
                const updateNum = await User.findOneAndUpdate(filter, update);
                await ctx.reply(`Updated Check Here: /me`).then(console.log('Done')).catch((e) => console.log('Bot Blocked'))
            }
        })
    } catch (error) {
        ctx.reply(`Error`).then(console.log('Done')).catch((e) => console.log('Bot Blocked'))
    }
})

bot.on('sticker', async (ctx) => {
    try {
    const {phone} = await User.findOne({ userid: JSON.stringify(ctx.chat.id) }).exec();
    let { sticker } = await ctx.message
    if (sticker.is_animated) {
        return ctx.reply('Sorry currently i dont support animated sticker').then(console.log('Done')).catch((e) => console.log('Bot Blocked'))
    }
    else {
        let stickerId = await sticker.file_id
        let { file_id } = await ctx.telegram.getFile(stickerId)
        let { href } = await ctx.telegram.getFileLink(file_id);
        wa.sendSticker(phone, href)
    }
    } catch (error) {
        ctx.reply('Error: Run /setup again').then(console.log('Done')).catch((e) => console.log('Bot Blocked'))
    }  
})

bot.command('help', async (ctx) => {
    ctx.reply(`Start Setup: /setup \nUpdate Number /update\nInfo: /me \nKey:`).then(console.log('Done')).catch((e) => console.log('Bot Blocked'))
})

// bot.command('/ban
bot.launch();