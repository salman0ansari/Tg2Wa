require("dotenv").config();
const { Telegraf, Scenes, session } = require("telegraf");
const connection = require("./core/connect");
const { sendText, sendSticker } = require("./core/helper");
const User = require("./db/userSchema");
const connect = require("./db/connectMongo");
const ADMIN = "306549960";
const rateLimit = require("telegraf-ratelimit");
const bot = new Telegraf(process.env.BOT_TOKEN);
const logger = require("pino")();

const sock = connection.makeWASocket();

// Set limit to 5 message per 5 seconds
const limitConfig = {
  window: 3.6e+6, // 1hr milisecond
  limit: 1, // 3 sticker allowed per hr
  onLimitExceeded: async (ctx, next) => {
    try {
      await ctx.reply("rate limit exceeded deleting...");
      await ctx.deleteMessage();
    } catch (e) {}
  },
};
bot.use(rateLimit(limitConfig));
bot.use(session());
const KEY = process.env.KEY; // invitation code

const Tg2Wa = new Scenes.WizardScene(
  "TelegramToWhatsapp",
  async (ctx) => {
    try {
      await ctx.reply(`Send invitation code to access this bot! :)`);
      return ctx.wizard.next();
    } catch (e) {
      logger.error(`Bot Blocked || Something Wrong`);
    }
  },
  async (ctx) => {
    try {
      ctx.wizard.state.key = await ctx.message.text;
      if (ctx.wizard.state.key === KEY) {
        await ctx.reply("Success !!");
        await ctx.reply("Hit /continue");
        return ctx.wizard.next();
      } else {
        await ctx.reply(`Invalid invitation code\nStart again ?? /setup`);
        return ctx.scene.leave();
      }
    } catch (e) {
      logger.error(`Bot Blocked || Something Wrong`);
    }
  },
  async (ctx) => {
    try {
      await ctx.reply("Enter your name");
      return ctx.wizard.next();
    } catch (e) {
      logger.error(`Bot Blocked || Something Wrong`);
    }
  },
  async (ctx) => {
    try {
      ctx.wizard.state.name = await ctx.message.text;
      await ctx.reply(
        `Enter your mobile no in international format\ne.g. +919876543210`
      );
      return ctx.wizard.next();
    } catch (e) {
      logger.error(`Bot Blocked || Something Wrong`);
    }
  },
  async (ctx) => {
    try {
      ctx.wizard.state.mobile = await ctx.message.text;
      const { name, mobile } = await ctx.wizard.state;
      if (!mobile.includes("+91") && !Number.isInteger(mobile)) {
        // if(isValidPhone(mobile)
        await ctx.reply(
          `Not an Indian Number Or\nInvalid Format\ne.g. +919876543210 `
        );
        return await ctx.scene.leave();
      } else {
        await ctx.reply(`Your name: ${name}\nYour Number: ${mobile}`);
        await ctx.tg.sendMessage(
          ADMIN,
          `Name: ${name}\nMobile Number: ${mobile}\nUser chat: ${JSON.stringify(
            ctx.chat
          )}`
        );
        let alreadyThere = await User.findOne({
          userid: JSON.stringify(ctx.chat.id),
        }).exec();
        if (alreadyThere) {
          await ctx.reply("Welcome Back");
          return await ctx.scene.leave();
        }
        await ctx.reply("Saving your number to db...");
        const added = await new User({
          userid: JSON.stringify(ctx.chat.id),
          name: name,
          phone: mobile,
        });
        added.save(function (err) {
          if (err) return handleError(err);
          // saved!
        });
        if (added) {
          await ctx.reply("Done");
          await ctx.reply("Now you can start sending me stickers");
        } else {
          await ctx.reply("Something Wrong");
        }
        return await ctx.scene.leave();
      }
    } catch (e) {
      logger.error(`Bot Blocked || Something Wrong`);
    }
  }
);
const stage = new Scenes.Stage([Tg2Wa]);
bot.use(stage.middleware());

bot.command("start", async (ctx) => {
  try {
    await ctx.reply(
      `Hello \nStart Setup: /setup \nUpdate Number /update\nInfo: /me \nKey:`
    );
  } catch (e) {
    logger.error(`Bot Blocked || Something Wrong`);
  }
});

bot.command("setup", async (ctx) => {
  try {
    await ctx.scene.enter("TelegramToWhatsapp");
  } catch (e) {
    logger.error(`Bot Blocked || Something Wrong`);
  }
});

bot.command("me", async (ctx) => {
  try {
    const { userid, name, phone } = await User.findOne({
      userid: JSON.stringify(ctx.chat.id),
    }).exec();
    await ctx.reply(`Your name: ${name}\nYour Number: ${phone}`);
  } catch (e) {
    logger.error(`Bot Blocked || Something Wrong`);
  }
});

bot.command("update", async (ctx) => {
  try {
    await ctx.reply("Enter new number");
    bot.on("message", async (ctx) => {
      const newNum = ctx.message.text;
      try {
        if (!newNum.includes("+91") && !Number.isInteger(newNum)) {
          return await ctx.reply(
            `Not an Indian Number Or\nInvalid Format\ne.g. +919876543210 `
          );
        } else {
          await ctx.reply(`Updating...`);
          const filter = { userid: JSON.stringify(ctx.chat.id) };
          const update = { phone: newNum };
          const updateNum = await User.findOneAndUpdate(filter, update);
          await ctx.reply(`Updated Check Here: /me`);
        }
      } catch (e) {
        logger.error(`Bot Blocked || Something Wrong`);
      }
    });
  } catch (e) {
    logger.error(`Bot Blocked || Something Wrong`);
  }
});

bot.on("sticker", async (ctx) => {
  try {
    const { phone } = await User.findOne({
      userid: JSON.stringify(ctx.chat.id),
    }).exec();
    let { sticker } = await ctx.message;
    if (sticker.is_animated) {
      return await ctx.reply("animated sticker is not supported");
    } else {
      let stickerId = await sticker.file_id;
      let { file_id } = await ctx.telegram.getFile(stickerId);
      let { href } = await ctx.telegram.getFileLink(file_id);
      await sendSticker(sock, phone, href);
    }
  } catch (e) {
    logger.error(`Bot Blocked || Something Wrong`);
  }
});

bot.command("help", async (ctx) => {
  try {
    await ctx.reply(
      `Start Setup: /setup \nUpdate Number /update\nInfo: /me \nKey:`
    );
  } catch (error) {
    logger.error(`Bot Blocked || Something Wrong`);
  }
});

bot.launch();
// bot.command('/ban
