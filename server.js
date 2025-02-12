require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("connect-flash");
const Task = require("./models/task.model.js");
const authRoutes = require("./routes/auth.routes.js");
const bot = require("./controllers/notification.controller.js"); 


const app = express();
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("client"));

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ Подключено к MongoDB"))
    .catch(err => console.error("❌ Ошибка подключения:", err));

app.use(session({
    secret: "supersecretkey",
    resave: false,
    saveUninitialized: false
}));
app.use(flash());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    res.locals.user = req.session.user || null;
    next();
});

const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        req.flash("error_msg", "Сначала войдите в систему!");
        return res.redirect("/login");
    }
    next();
};

app.get("/", requireAuth, async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.session.user._id });
        res.render("layout", { content: `<h2>📌 Мои задачи</h2>
            <ul>${tasks.map(task => `
                <li>
                    <strong>${task.title}</strong> - ${task.deadline ? new Date(task.deadline).toLocaleString() : "Без дедлайна"}
                    <a href="/edit/${task._id}">✏️</a>
                    <form action="/delete/${task._id}" method="POST" style="display:inline;">
                        <button type="submit">🗑 Удалить</button>
                    </form>
                </li>`).join('')}
            </ul>
            <a href="/create">➕ Добавить задачу</a>` });
    } catch (err) {
        res.status(500).send("Ошибка загрузки задач");
    }
});

app.get("/create", requireAuth, (req, res) => {
    res.render("layout", { content: `
        <h2>➕ Добавить задачу</h2>
        <form action="/tasks" method="POST">
            <input type="text" name="title" placeholder="Название задачи" required>
            <textarea name="description" placeholder="Описание"></textarea>
            <label>Дедлайн:</label>
            <input type="datetime-local" name="deadline">
            <button type="submit">Создать</button>
        </form>` });
});

app.post("/tasks", requireAuth, async (req, res) => {
    const { title, description, deadline } = req.body;
    await Task.create({ title, description, deadline, user: req.session.user._id });
    req.flash("success_msg", "Задача успешно создана!");
    res.redirect("/");
});

app.post("/delete/:id", requireAuth, async (req, res) => {
    await Task.findOneAndDelete({ _id: req.params.id, user: req.session.user._id });
    req.flash("success_msg", "Задача удалена!");
    res.redirect("/");
});

app.get("/register", (req, res) => {
    res.render("layout", { content: `
        <h2>📝 Регистрация</h2>
        <form action="/register" method="POST">
            <input type="text" name="username" placeholder="Имя пользователя" required>
            <input type="email" name="email" placeholder="Email" required>
            <input type="password" name="password" placeholder="Пароль" required>
            <button type="submit">Зарегистрироваться</button>
        </form>
        <p>Уже есть аккаунт? <a href="/login">Войти</a></p>` });
});

app.get("/login", (req, res) => {
    res.render("layout", { content: `
        <h2>🔑 Вход</h2>
        <form action="/login" method="POST">
            <input type="email" name="email" placeholder="Email" required>
            <input type="password" name="password" placeholder="Пароль" required>
            <button type="submit">Войти</button>
        </form>
        <p>Нет аккаунта? <a href="/register">Регистрация</a></p>` });
});

app.get("/edit/:id", requireAuth, async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, user: req.session.user._id });
        if (!task) {
            req.flash("error_msg", "Задача не найдена!");
            return res.redirect("/");
        }

        res.render("layout", { content: `
            <h2>✏️ Редактировать задачу</h2>
            <form action="/edit/${task._id}" method="POST">
                <input type="text" name="title" value="${task.title}" required>
                <textarea name="description">${task.description}</textarea>
                <label>Дедлайн:</label>
                <input type="datetime-local" name="deadline" value="${new Date(task.deadline).toISOString().slice(0, -1)}">
                <button type="submit">Сохранить</button>
            </form>
        ` });
    } catch (err) {
        res.status(500).send("Ошибка загрузки задачи.");
    }
});

app.post("/edit/:id", requireAuth, async (req, res) => {
    try {
        const { title, description, deadline } = req.body;
        await Task.findOneAndUpdate(
            { _id: req.params.id, user: req.session.user._id },
            { title, description, deadline },
            { new: true }
        );

        req.flash("success_msg", "Задача обновлена!");
        res.redirect("/");
    } catch (err) {
        res.status(500).send("Ошибка обновления задачи.");
    }
});


app.use(authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Сервер запущен на http://localhost:${PORT}`));
