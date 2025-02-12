const TelegramBot = require("node-telegram-bot-api");
const Task = require("../models/task.model.js");
require("dotenv").config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const users = {};

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    users[chatId] = chatId; 

    bot.sendMessage(chatId, "Hello! I am a reminder bot. I will remind you about tasks with a deadline.");
});

bot.onText(/\/tasks/, async (msg) => {
    const chatId = msg.chat.id;
    const tasks = await Task.find(); 

    if (tasks.length === 0) {
        bot.sendMessage(chatId, "You have no tasks.");
        return;
    }

    let taskList = tasks.map(task => `📌 ${task.title} - deadline: ${new Date(task.deadline).toLocaleString()}`).join("\n");
    bot.sendMessage(chatId, taskList);
});

const sendTaskReminders = async () => {
    const now = new Date();
    const tasks = await Task.find({ deadline: { $lte: now } });

    for (const task of tasks) {
        for (const chatId in users) {
            bot.sendMessage(chatId, `⏰ Reminder! Task: ${task.title} is already overdue!`);
        }
    }
};

setInterval(sendTaskReminders, 60 * 1000);

module.exports = bot;
