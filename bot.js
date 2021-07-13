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
        await ctx.reply('rate limit exceeded Deleting...')
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
        await ctx.reply(`Send invitation code to access this bot! :)`)
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.wizard.state.key = ctx.message.text;
        if (ctx.wizard.state.key === KEY) {
            await ctx.reply('Success !!')
            await ctx.reply('Hit /continue')
            return ctx.wizard.next();
        }
        else {
            await ctx.reply(`Invalid invitation code\nStart again ?? /setup`);
            return ctx.scene.leave();
        }
    },
    async (ctx) => {
        await ctx.reply("Enter your name")
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.wizard.state.name = ctx.message.text;
        await ctx.reply(`Enter your mobile no in international format\ne.g. +919876543210`)
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.wizard.state.mobile = ctx.message.text;
        const { name, mobile } = ctx.wizard.state;
        if (!mobile.includes('+91') && !Number.isInteger(mobile)) {
            // if(isValidPhone(mobile)
            await ctx.reply(`Not an Indian Number Or\nInvalid Format\ne.g. +919876543210 `);
            return ctx.scene.leave();
        }
        await ctx.reply(`Your name: ${name}\nYour Number: ${mobile}`);
        await ctx.tg.sendMessage(ADMIN, `Name: ${name}\nMobile Number: ${mobile}\nUser chat: ${JSON.stringify(ctx.chat)}`)

        let alreadyThere = await User.findOne({ userid: JSON.stringify(ctx.chat.id) }).exec();
        if (alreadyThere) {
            ctx.reply('Welcome Back');
            return ctx.scene.leave();
        }
        await ctx.reply('Saving your number to db...');
        const added = await new User({ userid: JSON.stringify(ctx.chat.id), name: name, phone: mobile });
        added.save(function (err) {
            if (err) return handleError(err);
            // saved!
        });
        if (added) {
            ctx.reply('Done')
            ctx.reply('Now you can start sending me stickers')
        } else {
            ctx.reply('Something Wrong')
        }
        return ctx.scene.leave();
    },
)
const stage = new Scenes.Stage([Tg2Wa])
bot.use(stage.middleware())

bot.command('start', (ctx) => {
    ctx.reply(`Hello \nStart Setup: /setup \nUpdate Number /update\nInfo: /me \nKey:`);
});

bot.command('setup', (ctx) => {
    ctx.scene.enter('TelegramToWhatsapp');
});


bot.command('me', async (ctx) => {
    try {
        const { userid, name, phone } = await User.findOne({ userid: JSON.stringify(ctx.chat.id) }).exec();
        ctx.reply(`Your name: ${name}\nYour Number: ${phone}`);
    } catch (error) {
        ctx.reply(`Error`);
    }

})

bot.command('update', async (ctx) => {
    ctx.reply('Enter new number');
    try {
        bot.on('message', async (ctx) => {
            const newNum = ctx.message.text
            if (!newNum.includes('+91') && !Number.isInteger(newNum)) {
                await ctx.reply(`Not an Indian Number Or\nInvalid Format\ne.g. +919876543210 `);
            }
            else {
                ctx.reply(`Updating...`);
                const filter = { userid: JSON.stringify(ctx.chat.id) }
                const update = { phone: newNum }
                const updateNum = await User.findOneAndUpdate(filter, update);
                await ctx.reply(`Updated Check Here: /me`);
            }
        })
    } catch (error) {
        ctx.reply(`Error`);
    }
})

bot.on('sticker', async (ctx) => {
    try {
    const {phone} = await User.findOne({ userid: JSON.stringify(ctx.chat.id) }).exec();
    let { sticker } = await ctx.message
    if (sticker.is_animated) {
        ctx.reply('Sorry currently i dont support animated sticker')
    }
    let stickerId = await sticker.file_id
    let { file_id } = await ctx.telegram.getFile(stickerId)
    let { href } = await ctx.telegram.getFileLink(file_id);
    wa.sendSticker(phone, href)
    } catch (error) {
        ctx.reply('Error: Run /setup again')
    }  
})

bot.command('help', async (ctx) => {
    ctx.reply(`Start Setup: /setup \nUpdate Number /update\nInfo: /me \nKey:`);
})

// bot.command('/ban
bot.launch();