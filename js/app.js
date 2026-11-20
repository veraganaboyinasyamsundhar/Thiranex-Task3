"use strict";

const STORAGE_KEY = "daymark.tasks.v1";
const taskList = document.querySelector("#task-list");
const addForm = document.querySelector("#add-form");
const taskInput = document.querySelector("#new-task");
const filterTabs = document.querySelector("#filter-tabs");
const taskCount = document.querySelector("#task-count");
const allTotal = document.querySelector("#all-total");
const remainingCount = document.querySelector("#remaining-count");
const emptyState = document.querySelector("#empty-state");
const emptyTitle = document.querySelector("#empty-title");
const emptyCopy = document.querySelector("#empty-copy");
const clearCompletedButton = document.querySelector("#clear-completed");
const announcements = document.querySelector("#announcements");
const todayLabel = document.querySelector("#today-label");

let filter = "all";
let editingId = null;
let tasks = loadTasks();

function loadTasks() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((task) => task && typeof task.id === "string" && typeof task.title === "string")
      .map((task) => ({
        id: task.id,
        title: task.title.slice(0, 160),
        completed: Boolean(task.completed),
        createdAt: Number.isFinite(task.createdAt) ? task.createdAt : Date.now(),
      }));
  } catch {
    return [];
  }
}

function saveTasks() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    announce("Your browser could not save changes to local storage.");
  }
}

function announce(message) {
  announcements.textContent = "";
  window.requestAnimationFrame(() => { announcements.textContent = message; });
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function visibleTasks() {
  if (filter === "active") return tasks.filter((task) => !task.completed);
  if (filter === "completed") return tasks.filter((task) => task.completed);
  return tasks;
}

function formatCreatedAt(timestamp) {
  const created = new Date(timestamp);
  if (Number.isNaN(created.getTime())) return "Added just now";
  const sameDay = created.toDateString() === new Date().toDateString();
  if (sameDay) return `Added today · ${new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(created)}`;
  return `Added ${new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(created)}`;
}

function makeButton(label, action, symbol, extraClass = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `icon-button ${extraClass}`.trim();
  button.dataset.action = action;
  button.setAttribute("aria-label", label);
  button.title = label;
  button.textContent = symbol;
  return button;
}

function renderTask(task) {
  const item = document.createElement("li");
  item.className = `task-item${task.completed ? " is-completed" : ""}`;
  item.dataset.id = task.id;

  const check = document.createElement("button");
  check.type = "button";
  check.className = "task-check";
  check.dataset.action = "toggle";
  check.setAttribute("aria-label", `${task.completed ? "Mark active" : "Mark complete"}: ${task.title}`);
  check.setAttribute("aria-pressed", String(task.completed));
  check.title = task.completed ? "Mark active" : "Mark complete";
  item.append(check);

  const main = document.createElement("div");
  main.className = "task-main";
  if (editingId === task.id) {
    const form = document.createElement("form");
    form.className = "edit-form";
    form.dataset.editForm = "true";
    const input = document.createElement("input");
    input.className = "edit-input";
    input.name = "title";
    input.type = "text";
    input.maxLength = 160;
    input.required = true;
    input.value = task.title;
    input.setAttribute("aria-label", "Edit task title");
    form.append(input);
    const save = document.createElement("button");
    save.className = "edit-save";
    save.type = "submit";
    save.textContent = "Save";
    form.append(save);
    const cancel = document.createElement("button");
    cancel.className = "edit-cancel";
    cancel.type = "button";
    cancel.dataset.action = "cancel-edit";
    cancel.textContent = "Cancel";
    form.append(cancel);
    main.append(form);
  } else {
    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;
    const created = document.createElement("span");
    created.className = "task-created";
    created.textContent = formatCreatedAt(task.createdAt);
    main.append(title, created);
  }
  item.append(main);

  const actions = document.createElement("div");
  actions.className = "task-actions";
  actions.append(makeButton(`Edit: ${task.title}`, "edit", "✎"));
  actions.append(makeButton(`Delete: ${task.title}`, "delete", "×"));
  item.append(actions);
  return item;
}

function render() {
  const shown = visibleTasks();
  const activeCount = tasks.filter((task) => !task.completed).length;
  const completedCount = tasks.length - activeCount;

  taskList.replaceChildren(...shown.map(renderTask));
  taskCount.textContent = String(tasks.length);
  allTotal.textContent = String(tasks.length);
  remainingCount.textContent = tasks.length === 0
    ? "Nothing on your list yet"
    : activeCount === 0
      ? "Everything is complete — nice work!"
      : `${activeCount} ${activeCount === 1 ? "task" : "tasks"} left to do`;
  clearCompletedButton.hidden = completedCount === 0;
  emptyState.hidden = shown.length !== 0;

  if (shown.length === 0 && tasks.length > 0) {
    emptyTitle.textContent = filter === "active" ? "All caught up." : "Nothing completed yet.";
    emptyCopy.textContent = filter === "active"
      ? "You’ve finished every task on your list. Take a breath."
      : "Complete a task and it will show up here.";
  } else {
    emptyTitle.textContent = "A clear slate.";
    emptyCopy.textContent = "Add your first task above and take it from there.";
  }

  filterTabs.querySelectorAll("[data-filter]").forEach((button) => {
    const selected = button.dataset.filter === filter;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function setFilter(nextFilter) {
  if (!["all", "active", "completed"].includes(nextFilter)) return;
  filter = nextFilter;
  editingId = null;
  render();
}

addForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = taskInput.value.trim();
  if (!title) {
    taskInput.focus();
    return;
  }
  tasks.unshift({ id: createId(), title: title.slice(0, 160), completed: false, createdAt: Date.now() });
  saveTasks();
  setFilter("all");
  taskInput.value = "";
  taskInput.focus();
  announce("Task added.");
});

filterTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (button) setFilter(button.dataset.filter);
});

taskList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const item = button.closest("[data-id]");
  const task = tasks.find((entry) => entry.id === item?.dataset.id);
  if (!task) return;

  switch (button.dataset.action) {
    case "toggle":
      task.completed = !task.completed;
      saveTasks();
      render();
      announce(task.completed ? "Task completed." : "Task marked active.");
      break;
    case "edit":
      editingId = task.id;
      render();
      taskList.querySelector(".edit-input")?.focus();
      taskList.querySelector(".edit-input")?.select();
      break;
    case "cancel-edit":
      editingId = null;
      render();
      break;
    case "delete":
      tasks = tasks.filter((entry) => entry.id !== task.id);
      editingId = null;
      saveTasks();
      render();
      announce("Task deleted.");
      break;
    default:
      break;
  }
});

taskList.addEventListener("submit", (event) => {
  const form = event.target.closest("form[data-edit-form]");
  if (!form) return;
  event.preventDefault();
  const item = form.closest("[data-id]");
  const task = tasks.find((entry) => entry.id === item?.dataset.id);
  const input = form.elements.namedItem("title");
  const title = input.value.trim();
  if (!task || !title) {
    input.focus();
    return;
  }
  task.title = title.slice(0, 160);
  editingId = null;
  saveTasks();
  render();
  announce("Task updated.");
});

taskList.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && editingId !== null) {
    editingId = null;
    render();
    announce("Edit cancelled.");
  }
});

clearCompletedButton.addEventListener("click", () => {
  const completedCount = tasks.filter((task) => task.completed).length;
  if (!completedCount) return;
  tasks = tasks.filter((task) => !task.completed);
  editingId = null;
  saveTasks();
  render();
  announce(`${completedCount} completed ${completedCount === 1 ? "task" : "tasks"} cleared.`);
});

todayLabel.textContent = new Intl.DateTimeFormat(undefined, {
  weekday: "long", month: "long", day: "numeric",
}).format(new Date()).toUpperCase();
render();
