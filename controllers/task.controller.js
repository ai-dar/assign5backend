const Task = require("../models/task.model");

exports.createTask = async (req, res) => {
    try {
      const { title, description, deadline } = req.body;
      
      if (!title) return res.status(400).json({ error: "Task title is required!" });
      
      const newTask = new Task({ title, description, deadline, user: req.user.id });
      await newTask.save();
      
      res.status(201).json({ message: "Task created!", task: newTask });
    } catch (err) {
      res.status(500).json({ error: "Error creating task" });
    }
  };
  

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Error loading tasks" });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { title, description, deadline, completed } = req.body;
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id }, 
      { title, description, deadline, completed }, 
      { new: true }
    );
    if (!task) return res.status(404).json({ error: "Task not found" });

    res.json({ message: "Task updated!", task });
  } catch (err) {
    res.status(500).json({ error: "Error updating task" });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!task) return res.status(404).json({ error: "Task not found" });

    res.json({ message: "Task deleted!" });
  } catch (err) {
    res.status(500).json({ error: "Error deleting task" });
  }
};
