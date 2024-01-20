const keep_alive = require("./keep_alive.js");
const mineflayer = require("mineflayer");
const {
  Movements,
  pathfinder,
  goals: { GoalBlock },
} = require("mineflayer-pathfinder");
const config = require("./settings.json");

function createBot() {
  const bot = mineflayer.createBot({
    username: config["bot-account"]["username"],
    password: config["bot-account"]["password"],
    auth: config["bot-account"]["type"],
    host: config.server.ip,
    port: config.server.port,
    version: config.server.version,
  });

  bot.loadPlugin(pathfinder);
  const mcData = require("minecraft-data")(bot.version);
  const defaultMove = new Movements(bot, mcData);
  bot.settings.colorsEnabled = false;

  function autoAuth() {
    if (config.utils["auto-auth"].enabled) {
      console.log("[INFO] Started auto-auth module");
      const password = config.utils["auto-auth"].password;
      setTimeout(() => {
        bot.chat(`/register ${password} ${password}`);
        bot.chat(`/login ${password}`);
        console.log("[Auth] Authentication commands executed.");
      }, 500);
    }
  }

  function chatMessages() {
    if (config.utils["chat-messages"].enabled) {
      console.log("[INFO] Started chat-messages module");
      const messages = config.utils["chat-messages"]["messages"];

      if (config.utils["chat-messages"].repeat) {
        const delay = config.utils["chat-messages"]["repeat-delay"];
        let i = 0;

        setInterval(() => {
          bot.chat(`${messages[i]}`);

          if (++i === messages.length) {
            i = 0;
          }
        }, delay * 1000);
      } else {
        messages.forEach((msg) => {
          bot.chat(msg);
        });
      }
    }
  }

  function moveBot() {
    const pos = config.position;

    if (config.position.enabled) {
      console.log(
        `\x1b[32m[BotLog] Starting moving to target location (${pos.x}, ${pos.y}, ${pos.z})\x1b[0m`,
      );
      bot.pathfinder.setMovements(defaultMove);
      bot.pathfinder.setGoal(new GoalBlock(pos.x, pos.y, pos.z));
    }
  }

  function antiAfk() {
    if (config.utils["anti-afk"].enabled) {
      bot.setControlState("jump", true);
      if (config.utils["anti-afk"].sneak) {
        bot.setControlState("sneak", true);
      }
    }
  }

  function reconnect() {
    console.log("[INFO] Reconnecting in 1 minute...");
    setTimeout(() => {
      createBot();
    }, 60000); // 1 minute in milliseconds
  }

  bot.once("spawn", () => {
    console.log("\x1b[33m[BotLog] Bot joined to the server", "\x1b[0m");
    autoAuth();
    chatMessages();
    moveBot();
    antiAfk();
  });

  bot.on("chat", (username, message) => {
    if (config.utils["chat-log"]) {
      console.log(`[ChatLog] <${username}> ${message}`);
    }
  });

  bot.on("goal_reached", () => {
    console.log(
      `\x1b[32m[BotLog] Bot arrived at target location. ${bot.entity.position}\x1b[0m`,
    );
  });

  bot.on("death", () => {
    console.log(
      `\x1b[33m[BotLog] Bot has died and was respawned ${bot.entity.position}`,
      "\x1b[0m",
    );
  });

  if (config.utils["auto-reconnect"]) {
    bot.on("end", reconnect);
  }

  bot.on("kicked", (reason) =>
    console.log(
      "\x1b[33m",
      `[BotLog] Bot was kicked from the server. Reason: \n${reason}`,
      "\x1b[0m",
    ),
  );
  bot.on("error", (err) =>
    console.log(`\x1b[31m[ERROR] ${err.message}`, "\x1b[0m"),
  );
}

createBot();
