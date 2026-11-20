# Daymark — Task 3

A client-side to-do list built with semantic HTML, CSS, and vanilla JavaScript.

## Run locally

From this folder, start a static server:

```powershell
python -m http.server 8001
```

Then open <http://localhost:8001>.

Tasks are stored in this browser's `localStorage` under `daymark.tasks.v1`. They remain available after reloads in the same browser and origin. No server, account, API key, or framework is needed.

## Features

- Add, edit, complete, and delete tasks
- Filter the list by all, active, or completed tasks
- Clear completed tasks
- Save changes automatically in local storage
- Delegated click and submit handlers for dynamically rendered tasks
- Keyboard accessible controls, focus styles, live announcements, and reduced-motion support
