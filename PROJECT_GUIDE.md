# Umeme Tracker: Project Guide

Presenter's notes for Valeria Wabwire. Intro to Web Development, semester project.
Stack: HTML5, CSS3, vanilla JavaScript (no frameworks), Python 3.12, Django 6.1, SQLite.

## How to use this guide

1. The night before, read sections 1 to 4. They are your pitch and the big picture.
2. Then read section 11 (questions and answers) and section 12 (live changes). That is where lecturers probe.
3. While presenting, keep section 5 (commands) open in a second tab.
4. When a question comes, open the file named in the answer and point at the code. Pointing at real code is more convincing than explaining from memory.

---

## 1. The 30-second pitch

**Problem.** Most Kenyan households use KPLC prepaid meters. You buy a token, load it, and then you have no idea how fast you are using units, so the meter runs out at night and you scramble to buy. Paper notes and memory do not work.

**Solution.** Umeme Tracker lets a household log every token purchase together with the meter reading. From two consecutive readings it calculates the real daily burn rate (kWh per day), predicts the day the units run out, and warns you in green, amber or red. It also shows which appliances cost the most, where each shilling of a token really goes (VAT, levies, fuel), and it works in English and Kiswahili.

**One line to open with.** "It tells you how many days of electricity you have left, and what to buy so you do not get caught in the dark."

---

## 2. Course requirements and where I meet them

| Requirement | How the project meets it | Where to show it |
|---|---|---|
| Plain HTML, CSS, JavaScript only | No Bootstrap, React or any library. No CDN links. Chart drawn by hand on a canvas. Django is used only as the backend. | `static/js/*.js`, `static/css/*.css`, `templates/index.html` |
| Responsive UI | CSS grid and flexbox, media queries at 960px and 520px, tables that scroll sideways on small screens | DevTools, then Ctrl+Shift+M, then shrink the window |
| Structured, user-friendly | Semantic tags, labelled forms, error text under each field, toast messages, confirm before delete, colour-coded status | Any screen |
| Forms | Register, PIN, switch household, purchase, appliance, planner, budget, rates | Index page |
| Buttons, navigation, interactivity | Section menu, chart tabs, edit/delete, lock/switch, language and theme toggles | Top bar |
| Client-side validation | No empty fields, no zero or negative amounts, no future dates, 4-digit PIN, PINs must match | `validatePurchase` in `app.js` |
| Backend integration (extra marks) | Django views return JSON. Data is saved in SQLite. The frontend uses the Fetch API. | `tracker/views.py`, `static/js/api.js` |
| Presentation | Demo script in section 10 | |
| Creativity and effort | Kiswahili toggle, dark mode, installable app, low-unit alerts, budget, top-up planner, money breakdown, CSV, print, WhatsApp share | Section 9 |

---

## 3. How the whole system fits together

```
 BROWSER                                    SERVER (your laptop)
 HTML + CSS + JavaScript                    Django (Python)                    Database
 ----------------------                     ---------------                    --------
 index.html  <---- GET / --------------     views.index
 app.js      ---- fetch (JSON) -------->    views.purchases  --- ORM --->      db.sqlite3
 updates DOM <---- JSON response -------    JsonResponse     <-- rows ----
```

Three layers, one job each:

- **Frontend (HTML, CSS, JS):** what the user sees and clicks. Also does the maths (burn rate, costs, charts).
- **Backend (Django):** receives requests, checks the PIN, validates the data again, reads and writes the database.
- **Database (SQLite):** one file, `db.sqlite3`, holds households, purchases and appliances.

### What happens when I press "Add purchase" (walk through this in the demo)

1. `handlePurchaseSubmit` in `app.js` runs and calls `e.preventDefault()` so the page does not reload.
2. It reads the four inputs and runs `validatePurchase`. If anything is wrong it shows red text under the field and stops.
3. It calls `Api.addPurchase(householdId, values)`, which calls `Api.request("POST", "/api/households/1/purchases/", values)`.
4. `fetch` sends the JSON to Django together with the header `X-Household-Pin`.
5. Django's `urls.py` matches the path and calls `views.purchases`.
6. `get_household` finds the household and compares the PIN header. A wrong PIN returns 401.
7. `clean_purchase` validates again on the server (never trust the browser) and builds a real `date` and `Decimal` values.
8. `TokenPurchase.objects.create(...)` writes a row to SQLite.
9. Django returns `JsonResponse(...)` with status 201 (created).
10. Back in JS, the app calls `Api.listPurchases` to reload, puts the result in `state.purchases`, and calls `renderAll()`.
11. `renderAll` recomputes the numbers and redraws the cards, chart and tables. No page reload happened.

---

## 4. Folder structure

```
umeme-tracker/
├── manage.py                 Django's command tool (runserver, migrate, ...)
├── make_icons.py             one-off script that draws the app icons
├── db.sqlite3                the database file (created by migrate)
├── venv/                     virtual environment (Python packages live here)
├── umeme_tracker/            the PROJECT settings
│   ├── settings.py           configuration
│   ├── urls.py               top-level routes
│   └── wsgi.py               entry point for deployment
├── tracker/                  the APP (my code)
│   ├── models.py             database tables
│   ├── views.py              the JSON API
│   ├── helpers.py            validation and PIN check
│   ├── pwa.py                serves the service worker
│   ├── urls.py               API routes
│   └── migrations/           database change history
├── templates/
│   └── index.html            the single page
└── static/
    ├── css/                  style.css, components.css, extras.css, features.css
    ├── js/                   api.js, calc.js, chart.js, app.js, extras.js,
    │                         theme.js, money.js, alerts.js, i18n.js, nav.js
    ├── img/                  icon-192.png, icon-512.png
    └── pwa/                  manifest.json, sw.js
```

**Project vs app (a common question).** A Django *project* is the whole website and its settings. An *app* is one feature module inside it. Mine has one app, `tracker`.

---

## 5. Commands I used and what they mean

### Setting up the project

| Command | Meaning |
|---|---|
| `mkdir -p ~/umeme-tracker && cd ~/umeme-tracker` | Make the project folder (`-p` means no error if it exists) and go into it |
| `python3 -m venv venv` | Create a virtual environment called `venv`, a private box for this project's Python packages |
| `source venv/bin/activate` | Switch the environment on. The prompt shows `(venv)` |
| `pip install django` | Install Django inside the environment |
| `django-admin startproject umeme_tracker .` | Create the project files. The `.` means "in this folder" |
| `python manage.py startapp tracker` | Create the `tracker` app |
| `mkdir -p templates static/css static/js static/img static/pwa` | Make the folders for HTML, CSS, JS, images and app files |

### Running and checking

| Command | Meaning |
|---|---|
| `python manage.py makemigrations tracker` | Look at `models.py` and write a migration file describing the tables |
| `python manage.py migrate` | Apply migrations, which creates or updates the tables in `db.sqlite3` |
| `python manage.py check` | Test the project for configuration errors without starting it |
| `python manage.py runserver` | Start the development server at `http://127.0.0.1:8000`. Stop it with Ctrl+C |
| `node --check file.js` | Check a JavaScript file for syntax errors without running it |

### Creating and editing files from the terminal

| Command | Meaning |
|---|---|
| `cat > path/file << 'EOF'` ... `EOF` | Write everything between the two `EOF` lines into the file (called a heredoc). The quotes around `'EOF'` stop the shell from changing `$` or backticks |
| `cat >> file << 'EOF'` | Same, but append to the end of the file instead of replacing it |
| `sed -i 's\|old\|new\|' file` | Find and replace inside a file. I used it to add `<script>` and `<link>` tags to `index.html` |
| `grep -n "text" file` | Search for text and show line numbers (`-c` counts matches) |
| `tail -n 6 file` | Show the last 6 lines of a file, to check a paste ended properly |
| `ls`, `rm -f file` | List files, remove a file |
| `set +H` | Turn off history expansion so `!` inside pasted code is not misread |
| `python make_icons.py` | Run the script that generates the two app icons |

### Common error: "That port is already in use"

A `runserver` is already running in another terminal. Close it with Ctrl+C or close that terminal.

---

## 6. Backend (Python and Django)

### 6.1 Django in plain words

Django receives a web request, finds the matching function in `urls.py`, runs it (the *view*), and sends back a response. Data lives in *models*, which are Python classes that Django turns into database tables (the ORM, object relational mapper). I do not write SQL. I write `TokenPurchase.objects.create(...)` and Django writes the SQL.

In this project Django has only three jobs: serve the one HTML page, serve the static files, and provide a JSON API. All the screens are built by JavaScript in the browser.

### 6.2 `settings.py`: the parts that matter

| Setting | Why it is there |
|---|---|
| `INSTALLED_APPS = ["django.contrib.contenttypes", "django.contrib.staticfiles", "tracker"]` | I removed the admin and the login system on purpose. The brief says no admin account, and a household PIN replaces logins. `staticfiles` serves CSS and JS. |
| `MIDDLEWARE` | Security, common, CSRF and clickjacking protection. |
| `TEMPLATES ... "DIRS": [BASE_DIR / "templates"]` | Tells Django where `index.html` lives. |
| `DATABASES ... sqlite3` | Zero-setup database stored in `db.sqlite3`. |
| `STATIC_URL = "/static/"` and `STATICFILES_DIRS = [BASE_DIR / "static"]` | Files in the `static` folder are served at `/static/...`. This is how the browser gets `app.js`. |
| `TIME_ZONE = "Africa/Nairobi"` | Dates follow Kenyan time. |
| `DEBUG = True`, `ALLOWED_HOSTS` | Fine for development. Both must change when deploying (section 15). |

### 6.3 `models.py`: three tables

```python
class TokenPurchase(models.Model):
    household = models.ForeignKey(Household, on_delete=models.CASCADE, related_name="purchases")
    date = models.DateField()
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    units_bought = models.DecimalField(max_digits=10, decimal_places=2)
    meter_reading = models.DecimalField(max_digits=10, decimal_places=2)
```

| Model | Fields | Notes |
|---|---|---|
| `Household` | name, meter_number (unique), pin (4 characters), created_at | `unique=True` means two households cannot share a meter number |
| `TokenPurchase` | household, date, amount_paid, units_bought, meter_reading | `meter_reading` is the units on the meter **before** the new token is loaded |
| `ApplianceEntry` | household, name, watts, quantity, hours_per_day | The brief listed two models. I added this third one so the appliance breakdown is saved like the purchases |

- **ForeignKey** means many purchases belong to one household. `on_delete=models.CASCADE` deletes a household's purchases if the household is deleted. `related_name="purchases"` lets me write `household.purchases.all()`.
- **DecimalField, not float,** for money, because floats give rounding errors (0.1 + 0.2 is not exactly 0.3). The API converts to float only when sending JSON.
- **Migrations.** After editing `models.py` I run `makemigrations` (writes the plan) and `migrate` (changes the database).

### 6.4 `urls.py`: the routes

```python
path("api/households/<int:household_id>/purchases/", views.purchases, name="purchases"),
```

`<int:household_id>` captures the number from the URL and passes it to the view as an argument. The root `urls.py` serves `/` (the page) and uses `include("tracker.urls")` to pull in all the API routes.

### 6.5 `views.py`: the same pattern in every view

```python
@csrf_exempt
@require_http_methods(["GET", "POST"])
def purchases(request, household_id):
    household, error = get_household(request, household_id)   # 1. check the PIN
    if error:
        return error
    if request.method == "GET":                               # 2. read
        return JsonResponse([purchase_to_dict(p) for p in household.purchases.all()], safe=False)
    data = get_json(request)                                  # 3. write
    if data is None:
        return bad("Invalid request.")
    cleaned, message = clean_purchase(data)                   # 4. validate
    if message:
        return bad(message)
    purchase = TokenPurchase.objects.create(household=household, **cleaned)
    return JsonResponse(purchase_to_dict(purchase), status=201)
```

- `@require_http_methods([...])` rejects any other HTTP method with 405.
- `@csrf_exempt` switches off Django's CSRF token check for this view (see 6.8).
- `safe=False` is needed because `JsonResponse` normally only accepts a dictionary, and here I return a list.
- `**cleaned` unpacks a dictionary into keyword arguments: `create(date=..., amount_paid=..., ...)`.
- `purchase_to_dict` turns a database object into a plain dictionary that can become JSON.

### 6.6 `helpers.py`: validation and the PIN check

| Function | Job |
|---|---|
| `bad(message, status)` | Returns `{"error": message}` with a status code. The frontend shows that message |
| `get_json(request)` | Safely reads the request body as JSON. Returns `None` if it is broken |
| `to_decimal(value)` | Converts to `Decimal` rounded to 2 places. Returns `None` for junk or huge numbers |
| `get_household(request, id)` | Finds the household and compares `X-Household-Pin` with its PIN. Returns `(household, None)` or `(None, error_response)` |
| `clean_purchase(data)` | Checks the date (valid, not in the future) and the three numbers. Returns `(cleaned_values, None)` or `(None, "message")` |
| `clean_appliance(data)` | Checks name length, watts 1 to 20000, quantity 1 to 50, hours more than 0 and at most 24 |

The `(value, error)` tuple pattern appears in several places. The caller checks the error first and only continues if it is empty.

### 6.7 The API (be able to list this)

| Method and path | Purpose | Success | Failures |
|---|---|---|---|
| `POST /api/households/` | Register a household | 201 | 400 bad input, 409 meter number already exists |
| `POST /api/households/login/` | Verify meter number and PIN | 200 | 401 |
| `GET /api/households/<id>/purchases/` | List purchases | 200 | 401, 404 |
| `POST /api/households/<id>/purchases/` | Add a purchase | 201 | 400, 401 |
| `PUT /api/purchases/<id>/` | Edit a purchase | 200 | 400, 401, 404 |
| `DELETE /api/purchases/<id>/` | Delete a purchase | 200 | 401, 404 |
| `GET` and `POST /api/households/<id>/appliances/` | List or save appliances | 200 or 201 | 400, 401 |
| `DELETE /api/appliances/<id>/` | Remove an appliance | 200 | 401, 404 |
| `GET /sw.js` | Serves the service worker from the site root | 200 | |

Status codes: 200 OK, 201 created, 400 bad request (my validation failed), 401 unauthorised (wrong PIN), 404 not found, 405 method not allowed, 409 conflict (duplicate), 500 server crashed.

### 6.8 Security: what I did and what I would improve

- **PIN check on every request.** After unlocking, JS keeps the PIN in memory only (`Api.pin`) and sends it in the `X-Household-Pin` header. It is never saved in `localStorage`, and pressing Lock erases it.
- **Server-side validation** repeats the client-side rules, because anyone can bypass the browser.
- **SQL injection** is prevented by the ORM, which never builds SQL from raw text.
- **XSS** (injected scripts): user-typed appliance names go through `esc()` before entering `innerHTML`, and names like the household name use `textContent`.
- **Honest limitations:** PINs are stored as plain text, and the API views use `csrf_exempt`. This matches the brief's "lightweight PIN" and "personal tool" scope. In a real product I would hash PINs with Django's `make_password` and `check_password`, and use sessions with CSRF tokens.

### 6.9 How Django and JavaScript are joined (the answer to "how did you integrate the backend?")

1. Django's `index` view returns `render(request, "index.html")`. That is the only HTML page.
2. The page loads `/static/js/*.js`, which Django serves from the `static` folder.
3. JavaScript calls `fetch("/api/...")`. Because the page and the API come from the same server, there are no cross-origin (CORS) problems.
4. Django answers with JSON. JavaScript turns it into objects and updates the DOM.
5. JSON is the shared language: Python dictionaries become JSON, and `JSON.parse` turns JSON into JavaScript objects.

---

## 7. Frontend

### 7.1 HTML: how `index.html` is built

- **One page, two views.** `#auth-view` holds three panels (lock, register, switch). `#app-view` holds the dashboard. JavaScript shows one and hides the other by adding or removing the class `hidden`.
- `.hidden { display: none !important; }` uses `!important` so it always wins over other `display` rules.
- **Semantic tags:** `header`, `nav`, `main`, `section`, `form`, `table` with `thead`, `tbody`, `tfoot`. They give structure and accessibility.
- **Forms use `novalidate`.** This switches off the browser's own popups so my validation messages show instead.
- **`<label>` wraps its `<input>`.** Clicking the label text focuses the field, and screen readers connect the two.
- **Input attributes:** `type="number" step="0.01" min="0"` for money, `type="date"` with `max` set to today by JS, `type="password" inputmode="numeric" maxlength="4"` for the PIN.
- **`data-*` attributes** carry information to JS, for example `<button data-action="edit" data-id="5">`. JS reads them with `button.dataset.id`.
- **`<canvas>`** is the drawing surface for the chart.
- **`<details><summary>`** gives a collapsible panel with no JavaScript (the editable tax rates).
- **Script order matters.** The scripts sit at the bottom of `<body>` so the elements already exist. Order: `api, calc, chart, app, extras, theme, money, alerts, i18n, nav`. Later files use functions from earlier ones, because all of them share one global scope.
- **Head tags:** `<meta name="viewport">` for mobile, `<link rel="manifest">` and `theme-color` for the installable app.
- **Injected sections.** `extras.js`, `money.js` and `alerts.js` build their sections as HTML strings and insert them with `insertAdjacentHTML`.

### 7.2 CSS: files and the clever parts

Four files: `style.css` (variables, page layout, login, top bar), `components.css` (cards, forms, buttons, tables, chart, banners), `extras.css` (planner, budget, tips) and `features.css` (alerts, money card, menu, dark mode).

| Code | What it does |
|---|---|
| `:root { --primary: #2563eb; }` then `color: var(--primary)` | **CSS variables.** Colours are defined once and reused. Changing one value changes the whole app |
| `* { box-sizing: border-box; }` | Width includes padding and border, so layouts do not overflow |
| `.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }` | Four equal columns. `1fr` means one equal share of the free space |
| `grid-template-columns: repeat(auto-fit, minmax(150px, 1fr))` | As many columns as fit, each at least 150px wide, wrapping automatically |
| `@media (max-width: 960px) { ... }` | Rules that apply only on narrower screens. Four columns become two, then one at 520px |
| `.topbar { position: sticky; top: 0; z-index: 20; }` | The bar sticks to the top while scrolling and sits above other content |
| `background: radial-gradient(...), linear-gradient(...)` | Two layered backgrounds on the login screen |
| `.table-wrap { overflow-x: auto; }` with `table { min-width: 560px; }` | The table scrolls sideways on phones instead of squashing |
| `label { display: flex; flex-direction: column; gap: 6px; }` | Label text sits above its field |
| `input:focus { box-shadow: 0 0 0 3px rgba(37,99,235,.18); }` | The glow ring around the field you are typing in |
| `.stat:nth-child(2) { border-left-color: ... }` | Gives each stat card its own colour stripe |
| `.progress span { width: ...% }` (set from JS) | The budget bar. JS sets the width and a class (`amber`, `red`) to change its colour |
| `.stack-bar` with `<span style="width:62%">` children | The money breakdown bar. Flexbox lays out the segments and each width is its share |
| `.btn` with `.btn-primary`, `.btn-outline`, `.btn-danger` | One base style plus small variants. This is reused everywhere |
| `html[data-theme="dark"] { --bg: #0b1220; ... }` | **Dark mode.** JS sets `data-theme` on `<html>`. Overriding the variables flips most colours at once. A few hard-coded colours are overridden separately |
| `html[data-theme="dark"] canvas { filter: invert(1) hue-rotate(180deg); }` | The chart colours are drawn in JavaScript and cannot use CSS variables. This filter flips the greys but keeps the blue looking blue |
| `@media print { .topbar, .btn, form { display: none } }` | "Print report" hides buttons and forms and prints only the data |
| `.subnav-inner { overflow-x: auto; }` | The section menu scrolls sideways on small screens |
| `transition: background .15s` | Smooth colour change on hover |

### 7.3 JavaScript: one file, one job

| File | Job | Key things inside |
|---|---|---|
| `api.js` | All talking to Django | `Api.request` plus one small function per endpoint |
| `calc.js` | All the maths. No DOM code | `APPLIANCES`, `DEFAULT_TARIFF`, `todayISO`, `daysBetween`, `computeSegments`, `computeStats`, `monthlySummary`, `chartSeries`, `applianceCalc` |
| `chart.js` | Draws the chart on the canvas | `drawChart` |
| `app.js` | The core: state, login flow, purchase form, rendering, events | `state`, `showAuth`, `handleRegister`, `handleLock`, `enterApp`, `validatePurchase`, `handlePurchaseSubmit`, `renderAll`, `bindEvents`, `init` |
| `extras.js` | Monthly budget, top-up planner, saving tips, share and export | WhatsApp link, CSV download, print |
| `theme.js` | Dark mode, theme and language button holders, install button, service worker registration | |
| `money.js` | The "where your money goes" card with editable rates | `parts`, `renderMoney` |
| `alerts.js` | Low-units banner and browser notifications | `currentLevel`, `renderAlerts`, `showNotification` |
| `i18n.js` | English and Kiswahili | `DICT`, `RULES`, `translate`, `MutationObserver` |
| `nav.js` | Section menu that highlights as you scroll | |

**Why so many files?** Separation of concerns: network code, maths, drawing and screen updates are kept apart, so I can find and change one thing without breaking others. `extras`, `money`, `alerts`, `i18n` and `nav` were added as modules that plug into the core without rewriting it.

**Shared global scope.** These are classic scripts, not modules, so a function declared in `calc.js` can be called from `app.js`. That is why the load order matters.

#### The seven pieces of complex JavaScript

**A. `Api.request`: why it reads text first.**

```js
const text = await response.text();
let data = null;
try { data = text ? JSON.parse(text) : null; } catch (err) { data = null; }
if (!response.ok) { throw new Error((data && data.error) || "Server error (" + response.status + ")..."); }
```

If Django crashes it sends an HTML error page. Calling `response.json()` directly would fail with `Unexpected token '<'`. I read the body as text and parse it inside `try`, so I can show a clear message instead. Every other function calls this one, so error handling lives in one place.

**B. Burn rate: `computeSegments`.**

```js
const days = daysBetween(prev.date, cur.date);
const consumed = prev.meter_reading + prev.units_bought - cur.meter_reading;
if (days > 0 && consumed >= 0) { segments.push({ ..., rate: consumed / days }); }
```

Units on the meter right after the last top-up are `meter_reading + units_bought`. Units left when I buy again are the next `meter_reading`. The difference is what I consumed, and dividing by the days between gives kWh per day. The `if` skips impossible data (same-day purchases or negative usage).

**C. `computeStats`: from burn rate to prediction.** It takes the latest segment's rate as the burn rate, estimates units now as `afterTopUp - burn x daysSinceLastPurchase` (never below 0), then `daysLeft = unitsNow / burn`.

**D. `drawChart`: coordinates.**

```js
const xAt = function (i) { return pad.l + step * (i + 0.5); };
const yAt = function (v) { return pad.t + ph - (v / max) * ph; };
```

`step` is the plot width divided by the number of points. `i + 0.5` centres each point in its slot. On a canvas `y = 0` is the **top**, so I subtract from the bottom to make bigger values go up. The canvas is also scaled by `devicePixelRatio` so lines stay sharp on high-resolution screens.

**E. The wrapper (decorator) pattern.**

```js
var baseRenderAll = renderAll;
renderAll = function () { baseRenderAll(); renderMoney(); };
```

I save the old `renderAll`, then replace it with a new one that calls the old one and then does extra work. This is how each add-on file hooks into the core without editing `app.js`. Each file adds one link in the chain.

**F. `i18n.js`: translating without reloading.**
- `DICT` holds exact phrases (English to Kiswahili).
- `RULES` holds regular expressions for sentences with numbers inside, for example `About (\d+) days...`.
- It walks every text node on the page and swaps the text. The original English is stored in a `WeakMap`, so switching back restores it.
- A `MutationObserver` watches the page, so text that JavaScript creates later (tables, toasts) is translated the moment it appears.
- It also wraps `drawChart`, `confirm` and `window.open`, because chart labels, popups and the WhatsApp text are not page text.

**G. The service worker (`static/pwa/sw.js`).** A script the browser runs in the background. On install it saves the app's files in a cache. On each request it tries the network first and falls back to the cache when offline. `/api/` calls are never cached. It is served from `/sw.js` (the site root) so that it controls the whole site.

---

## 8. Repeated code patterns (learn these once, recognise them everywhere)

**1. The `$` helper.**
```js
function $(id) { return document.getElementById(id); }
```
A shortcut. `$("p-date")` means "find the element with id p-date". It has nothing to do with jQuery.

**2. State, then render.** All data lives in one object, `state` (purchases, appliances, stats, the household). Whenever something changes, the code reloads the data into `state` and calls `renderAll()`, which redraws the screen from `state`. I never patch the screen by hand in lots of places. If a lecturer asks "how does the page update?", this is the answer.

**3. Building table rows.**
```js
body.innerHTML = rows.map(function (p) { return "<tr>...</tr>"; }).join("");
```
`map` turns each data item into an HTML string, `join("")` glues them together, and `innerHTML` puts them in the table. Used for history, monthly totals, appliances and the money breakdown.

**4. Event delegation.**
```js
$("history-body").addEventListener("click", function (e) {
  const button = e.target.closest("button[data-action]");
  if (!button) return;
  ...
});
```
One listener on the table body handles every Edit and Delete button, including rows that did not exist when the page loaded. `closest` walks up from the clicked element to the nearest matching button, and `data-id` says which row.

**5. The validation pattern.**
```js
const errs = validatePurchase(v);          // returns an object like { date: "Pick a date." }
setFieldError("p-date", "e-date", errs.date);
if (Object.keys(errs).length) return;      // stop if any error exists
```

**6. `try / catch / finally` around every server call.**
```js
button.disabled = true;
try { await Api.addPurchase(...); ... }
catch (err) { toast(err.message, "error"); }
finally { button.disabled = false; }
```
`try` runs the risky part, `catch` shows the error, and `finally` always re-enables the button, even after a failure. The disabled button also prevents double submits.

**7. `readNumber`.** `Number("")` is `0`, which would wrongly pass a "required" check. `readNumber` returns `NaN` for an empty box, and `NaN > 0` is false, so empty fields fail.

**8. Formatting helpers.** `fmt(n, decimals)` and `kes(n)` use `toLocaleString("en-KE")` so numbers show as `1,200.50` and `KES 1,200`.

**9. `esc()` for safety.** Anything the user typed that goes into `innerHTML` is passed through `esc()`, which lets the browser turn `<script>` into harmless text.

**10. The IIFE.** `(function () { ... })();` in `extras.js`, `money.js` and others. It runs immediately and keeps its variables private, so files do not clash.

**11. `localStorage` in `try/catch`.** Storage can be blocked (private mode), so every read and write is wrapped.

**12. Repeating patterns in other languages.** In Django, every view follows: check PIN, read or validate, save, return JSON. In CSS, `.card` and `.btn` are written once and reused everywhere, with small variants like `.btn-danger`.

### What is stored in the browser (`localStorage`)

| Key | Contents |
|---|---|
| `umeme_household` | id, name and meter number of the last household (never the PIN) |
| `umeme_budget_<id>` | the monthly budget for that household |
| `umeme_rates` | the editable tax and levy rates |
| `umeme_theme` | `dark` or `light` |
| `umeme_lang` | `en` or `sw` |
| `umeme_notified_<id>`, `umeme_alert_dismissed_<id>` | stops the same alert firing again the same day |

---

## 9. The features: what each does, how, and the maths

### 9.1 Household setup and PIN lock
- **First visit:** register with name, meter number and a 4-digit PIN (typed twice). Django saves the household.
- **Return visit:** the browser remembers the household in `localStorage`, so the app shows a PIN screen, not the setup form.
- **Switch household:** enter another meter number and PIN. Django's `household_login` checks both.
- **Lock:** clears the PIN from memory and returns to the PIN screen.
- No admin and no full login system, exactly as the brief asks.

### 9.2 Token purchase logging
Fields: date, amount paid (KES), units bought (kWh), units on the meter right now (before loading). Checks: all fields required, amount and units greater than zero, meter reading zero or more, date not in the future. Edit fills the same form and saves with `PUT`. Delete asks for confirmation first.

### 9.3 Burn rate and run-out prediction (the heart of the app)

Worked example to use in the demo:

| | Date | Paid | Units bought | Meter before |
|---|---|---|---|---|
| Purchase A | 10 days ago | KES 1,000 | 40 | 2 |
| Purchase B | today | KES 500 | 20 | 12 |

1. After purchase A the meter held 2 + 40 = **42** units.
2. When B was bought, it held **12**. So 42 - 12 = **30** units were used.
3. That happened over **10** days, so burn rate = 30 / 10 = **3.0 kWh/day**.
4. Units now = 12 + 20 = **32**. Days left = 32 / 3 = **10.67**, shown as 10 days.
5. Average cost = total paid / total units = 1,500 / 60 = **KES 25.00 per kWh**.

The app shows the latest burn rate, and also the average across all periods, as a secondary figure.

### 9.4 Colour warning
Days left: 7 or more is **green**, 3 to under 7 is **amber**, under 3 is **red**. This is in `computeStats`. With fewer than two purchases it stays neutral blue because there is no burn rate yet.

### 9.5 Chart (plain canvas, no library)
Three tabs: daily usage (kWh/day between purchases), cost per unit (KES/kWh), and spend per purchase (bars). `chartSeries` prepares the points and `drawChart` draws gridlines, axis labels, the area fill, the line and dots, and value labels.

### 9.6 History and monthly summary
History lists every purchase with cost per unit (amount / units). Monthly summary groups purchases by `YYYY-MM` (the first 7 characters of the date) and totals purchases, units and spend.

### 9.7 Appliance cost breakdown (saved in the database)
- Choose from the reference list (fridge 150 W, iron 1000 W, kettle 2000 W, TV 100 W, LED bulb 12 W and more) or type a custom one.
- Formula: **kWh per day = (watts x quantity x hours) / 1000**. **Cost per day = kWh per day x cost per unit.** Month = day x 30.
- Cost per unit comes from your average cost per unit, or a typed override, or a default of KES 25.
- Example: kettle 2000 W for 0.5 h = 1 kWh/day = KES 25/day = KES 750/month at KES 25.
- **Comparison with the meter:** if the appliance total is within 20% of the metered burn rate it says "Good match". Otherwise it flags a mismatch and says whether you are over- or under-estimating. Example: kettle 0.5 h plus fridge 24 h = 4.6 kWh/day against a metered 3.0 is 53% higher, because a fridge's compressor does not run all day.
- Saved appliances appear in a table with a share bar and survive page refreshes, because they are stored by Django.

### 9.8 Monthly budget
Set a limit. A bar shows spend this month against the limit: green, amber from 75%, red from 100%. It also estimates monthly cost as burn rate x cost per unit x 30. Stored in `localStorage`.

### 9.9 Smart top-up planner
- "If I spend KES X": units = X / cost per unit; days it lasts = (units you have + new units) / burn rate.
- "I want it to last N days": units needed = burn rate x N - units you have; cost = units needed x cost per unit.
- A ready table shows what KES 100, 200, 500, 1000 and 2000 buy.

### 9.10 Ways to save
For each saved appliance: using it one hour less per day saves watts x quantity x 1 hour / 1000 x cost per unit x 30. It shows the top three, and gives a special tip for swapping incandescent bulbs to 12 W LED.

### 9.11 Where your money goes
A token pays for more than electricity. The app models the price of one kWh as:

`(energy + fuel + forex) x (1 + VAT%) + REP levy + EPRA levy + WRA levy`

with REP and EPRA calculated as percentages of the energy charge. The default rates give about KES 25.5 per kWh, which is close to what households actually pay. The result is shown as three tiles (energy, fuel and forex, taxes and levies), a stacked bar, and a table. Every rate is editable and saved on the device, because EPRA changes them every month. **Say clearly that these are estimates**, since KPLC no longer prints a breakdown on prepaid tokens.

### 9.12 Low-units alerts
- Under 3 days left: amber banner "Low units". Under 1 day: red "Last day to buy!". Units at zero: red "run out".
- The banner can be dismissed for the day.
- **Browser notifications:** the button asks permission. A notification fires once per day per alert level. The app re-checks every 30 minutes while it is open. "Test alerts" sends a sample.
- **Limit to state honestly:** notifications only work while the app is open in a tab or window. There is no push server.

### 9.13 Kiswahili / English
One button translates the entire interface, including the chart text, popups and the WhatsApp message. The choice is remembered. See piece F in section 7.3.

### 9.14 Dark mode
The moon button sets `data-theme="dark"` on the page. CSS variables swap, and the canvas uses a filter. The choice is remembered, and the first visit follows the computer's setting.

### 9.15 Installable app (PWA)
`manifest.json` (name, icons, colours) plus the service worker make Chrome offer "Install app". The app then opens in its own window. **Honest limit:** offline, the page opens but data needs the server, so saving and loading only work when Django is reachable.

### 9.16 Share and export
- **WhatsApp:** opens `wa.me` with a pre-written update (units left, burn rate, days left, spend).
- **Download CSV:** builds a file from the purchases in memory using a `Blob` and a temporary link.
- **Print report:** `window.print()` with a print stylesheet that hides buttons and forms.

### 9.17 Section menu
A row of links under the top bar jumps to each section. As you scroll, `getBoundingClientRect().top` of each section decides which link is highlighted.

---

## 10. Demo script (about 7 minutes)

Before you start: server running, browser at `http://127.0.0.1:8000`, a fresh household ready to register, and DevTools closed.

1. **The problem (30 s).** Use the pitch from section 1.
2. **Register (30 s).** Show a wrong PIN confirmation being rejected, then register. Say: "The PIN is checked by Django on every request."
3. **Log two purchases (1 min).** Use the worked example in 9.3. Try one invalid submission first (amount 0 or a future date) to show validation.
4. **Read the dashboard (1 min).** Burn rate 3.0 kWh/day, about 10 days left, green banner. Explain the formula in one sentence.
5. **Chart and history (30 s).** Switch the three chart tabs. Edit one purchase and delete one.
6. **Appliances (1 min).** Add kettle, fridge and a bulb. Refresh the page to show they are saved. Point at the match or mismatch message.
7. **Planner and budget (45 s).** Type 500 in the planner. Set a budget.
8. **Money breakdown (30 s).** Show the bar, open the editable rates, change VAT, and watch it update.
9. **The extras (1 min).** Press Kiswahili, then dark mode, then Test alerts. Mention the installable app and WhatsApp share.
10. **Lock and switch (20 s).** Press Lock, show the PIN screen.
11. **Show the code (1 min).** Open `views.py` and `calc.js` and say which does what: "Python saves and checks, JavaScript calculates and draws."

---

## 11. Questions your lecturer may ask, with answers

### About the idea and design
**Why did you choose this project?** Prepaid meters are common in Kenya and people constantly run out of units. It uses real data, real maths and real forms, so it shows more than a static page.

**Why no framework?** The course requires plain HTML, CSS and JavaScript. Django is only the backend, and it sends JSON. All screens are built with vanilla JS.

**Why Django and SQLite?** The brief allows a simple Python backend. Django gives routing, validation tools and an ORM out of the box, and SQLite needs no setup because it is one file.

**How is it responsive?** CSS grid and flexbox with `fr` units and `auto-fit`, plus media queries at 960px and 520px. Tables scroll sideways in a wrapper.

### Backend
**What is a model, and what is a migration?** A model is a Python class that becomes a database table. A migration is the file Django writes to describe table changes. `makemigrations` writes it and `migrate` applies it.

**What is a ForeignKey?** It links each purchase to one household. Many purchases, one household.

**Why `DecimalField` for money?** Floats have rounding errors. Decimals are exact.

**What does `csrf_exempt` do, and why did you use it?** It turns off Django's CSRF token check on that view. I used it because this is a small personal tool, and sending a token with every Fetch call would add complexity beyond the brief. In production I would use CSRF tokens and sessions.

**Why are PINs stored as plain text?** To keep to the brief's "lightweight PIN" idea. A real product should hash them with `make_password` and verify with `check_password`.

**How does the server know who is asking?** Every request carries the header `X-Household-Pin`. `get_household` loads the household and compares the PIN. If it does not match, the answer is 401.

**What do 200, 201, 400, 401, 404 and 409 mean?** OK, created, my validation failed, wrong PIN, not found, and duplicate meter number.

**Why validate again on the server?** The browser can be bypassed, for example with DevTools or a script. The server is the last line of defence.

**What does `JsonResponse(..., safe=False)` mean?** `safe=False` allows returning a list instead of a dictionary.

**Could someone do SQL injection?** No. I use the ORM, which sends values separately from the SQL.

**What does `**cleaned` do?** It unpacks a dictionary into named arguments for `create()`.

**Why three models when the brief said two?** `ApplianceEntry` stores the appliance breakdown, so it persists like the purchases.

### JavaScript
**`var`, `let` and `const`?** `const` cannot be reassigned, `let` can, and `var` is the old function-scoped style. I use `const` by default.

**What is `async/await`?** A way to wait for something slow, like a network request, without freezing the page. `await fetch(...)` pauses that function until the answer comes, and `async` marks the function.

**What is `fetch`, and what is JSON?** `fetch` sends an HTTP request from JavaScript. JSON is the text format both sides use. `JSON.stringify` turns an object into text, and `JSON.parse` turns it back.

**What is the DOM?** The browser's live tree of page elements. I change it with `textContent`, `innerHTML`, `classList` and `setAttribute`.

**What does `preventDefault()` do?** Stops the form from reloading the page, so JavaScript can handle the submit.

**What is event delegation?** One listener on a parent handles clicks from many children, including ones added later. See pattern 4.

**What do `map`, `filter`, `reduce` and `find` do?** `map` transforms each item, `filter` keeps some, `reduce` combines everything into one value (I use it for totals), and `find` returns the first match.

**`localStorage` versus a database?** `localStorage` stays in one browser and holds small settings (theme, language, budget, last household). The database holds the real data and works from any browser. I never store the PIN in `localStorage`.

**What is an IIFE?** A function that runs immediately, to keep its variables private.

**How does the chart work without a library?** I use the canvas 2D API: `getContext("2d")`, `beginPath`, `moveTo`, `lineTo`, `stroke`, `fillRect` and gradients. I map each data value to x and y pixels (piece D in 7.3).

**How does the language switch work?** A dictionary and regex rules, applied to every text node. A `MutationObserver` translates new text as soon as it appears (piece F).

**What is a Promise?** An object representing a result that will arrive later. `await` unwraps it. `Promise.all` waits for several at once (I load purchases and appliances together).

**How do the notifications work?** The browser's `Notification` API after the user grants permission. They only fire while the app is open.

**What is a service worker?** A background script that can cache files and intercept requests, which is what makes the app installable and able to open offline.

### HTML and CSS
**Why `novalidate` on the forms?** To use my own error messages instead of the browser's popups.

**Flexbox versus grid?** Flexbox lays items out in one direction (a row of buttons). Grid lays out rows and columns together (the stat cards).

**What is a CSS variable?** A named value, like `--primary`, defined once and reused with `var(--primary)`. Dark mode works by redefining the variables.

**What is `box-sizing: border-box`?** Padding and border are included in an element's width, so layouts do not overflow.

**What is `position: sticky`?** The element scrolls normally until it reaches its `top` position, then sticks. The top bar uses it.

**Why `!important` on `.hidden`?** So that hiding always wins over other `display` rules.

**What is a media query?** Rules that apply only when a condition is true, like screen width below 960px.

### Process
**What problems did you hit?** See section 13. They are real examples of debugging.

**How did you test?** I used the browser's Network and Console tabs, the Django terminal for tracebacks, `python manage.py check`, and `node --check` for JavaScript syntax.

**What would you improve?** See section 14.

**If you do not know an answer:** say "let me find it in the code" and use `grep -n "name" static/js/*.js tracker/*.py` to jump to it. Reading the real code live is a good answer.

---

## 12. Things they might ask you to change live

Search for the place first. Example: `grep -n "DEFAULT_TARIFF" static/js/*.js`. The dev server reloads Python automatically. For JS and CSS, save and press Ctrl+Shift+R.

| If they say... | File | Look for |
|---|---|---|
| "Change the green/amber/red limits" | `static/js/calc.js`, inside `computeStats` | `out.daysLeft >= 7` and `out.daysLeft >= 3` |
| "Change the default price per unit" | `static/js/calc.js` | `DEFAULT_TARIFF = 25` |
| "Add another appliance to the list" | `static/js/calc.js` | the `APPLIANCES` array. Add `{ name: "Blender", watts: 400 },` |
| "Change the main colour" | `static/css/style.css` | `--primary: #2563eb;` |
| "Change the mismatch tolerance" | `static/js/app.js`, in `renderAppliances` | `Math.abs(diff) <= 20` |
| "Alert earlier or later" | `static/js/alerts.js` | `s.daysLeft < 3` |
| "Change the budget warning point" | `static/js/extras.js` | `pct >= 75` |
| "Use 31 days in a month" | `static/js/calc.js` (`applianceCalc`) and `extras.js` | the number `30` |
| "Change the chart line colour" | `static/js/chart.js` | `"#2563eb"` |
| "Allow a 6-digit PIN" | `models.py` (`max_length`), `views.py` (`len(pin) != 4`), `app.js` (`/^\d{4}$/` in three places), `index.html` (`maxlength="4"`) | |
| "Add a Kiswahili word" | `static/js/i18n.js` | add a line to `DICT` |
| "Limit hours to 12" | `static/js/app.js` and `tracker/helpers.py` | `hours <= 24` and `<= 24` |

---

## 13. Problems I hit and how I fixed them (use these for "describe your process")

1. **`Unexpected token '<', "<!DOCTYPE"... is not valid JSON`.** The frontend expected JSON but Django had crashed and sent an HTML error page. I opened the terminal traceback and found `date.isoformat` failing, because the date was still a string right after saving. I first fixed it with `refresh_from_db()`. In the final version the server converts the date to a real date object before saving. I also made `Api.request` read text first, so any future crash shows a readable message.
2. **`Error: That port is already in use`.** An old `runserver` was still running in another terminal. I closed it.
3. **`LookupError: No installed app with label 'admin'`.** I had removed the admin app but `urls.py` still pointed to `admin.site.urls`. I rewrote the routes.
4. **`AttributeError: module 'tracker.pwa' has no attribute 'manifest'`.** A route referenced a function that did not exist. I replaced both URL files with clean versions.
5. **Terminal pastes cut off or garbled.** Large pastes sometimes lost lines. I learned to check with `tail -n`, `ls`, `grep -c` and `node --check`.
6. **A file did not save (`static/pwa/sw.js` missing).** The folder did not exist yet. `mkdir -p` fixed it, and I added a loop that prints OK or MISSING for each file.

---

## 14. Limitations, improvements, and a note on honesty

**Known limitations**
- PINs are stored in plain text and the API uses `csrf_exempt`.
- Run-out predictions assume your future usage matches your recent usage.
- Notifications only work while the app is open.
- Offline mode opens the app but cannot load or save data.
- Tax and levy defaults are estimates and must be updated by hand.

**What I would add with more time**
- Hashed PINs, sessions and CSRF tokens.
- Splitting one meter's bill among several houses.
- Real push notifications from the server.
- Automated tests for the maths in `calc.js` and for the views.
- Deploying with PostgreSQL.

**A note on honesty.** You used AI help to build this project. Check your course's rules on AI tools, and disclose if the rules say so. If a lecturer asks how you built it, answer truthfully. What gets marked is that you understand the code and can change it, so use this guide and section 12 to practise: open each file, say in one sentence what it does, and make one small change yourself.

---

## 15. Git and deployment

### Pushing to GitHub

Repository: `git@github.com:valeriawabwire/umemetracker.git`

First tell Git to ignore files that must not be uploaded. In the project folder:

```bash
cat > .gitignore << 'EOF'
venv/
__pycache__/
*.pyc
db.sqlite3
.env
EOF
```

Then:

```bash
git init
git add .
git commit -m "Umeme Tracker: first commit"
git branch -M main
git remote add origin git@github.com:valeriawabwire/umemetracker.git
git push -u origin main
```

| Command | Meaning |
|---|---|
| `git init` | Start tracking this folder |
| `git add .` | Stage every file (except those in `.gitignore`) for the next commit |
| `git commit -m "..."` | Save a snapshot with a message |
| `git branch -M main` | Name the branch `main` |
| `git remote add origin <url>` | Link this folder to the GitHub repository |
| `git push -u origin main` | Upload the commits. `-u` remembers this for next time |

If the push says `Permission denied (publickey)`, GitHub does not know your SSH key yet. That is fixed with `ssh-keygen` and adding the public key to GitHub settings.

### Deployment

To be completed once we deploy. Fill in:

- Live address: ______________________
- Hosting service: ______________________
- Changes needed for production: `DEBUG = False`, set `ALLOWED_HOSTS` to the live domain, move `SECRET_KEY` to an environment variable, serve static files (for example with WhiteNoise), list packages with `pip freeze > requirements.txt`, and use HTTPS (needed for the installable app and notifications on phones).

---

## 16. Glossary

| Term | Meaning |
|---|---|
| API | A set of URLs that a program (my JavaScript) can call to get or send data |
| ORM | Lets me use Python classes instead of SQL |
| JSON | Text format for data, such as `{"date": "2026-10-02"}` |
| Endpoint | One URL of the API, such as `/api/households/1/purchases/` |
| Middleware | Code that processes every request before the view (security, CSRF) |
| Template | The HTML file Django sends (`index.html`) |
| Static files | CSS, JS and images that do not change per request |
| Virtual environment | A private folder of Python packages for one project |
| DOM | The live tree of elements in the browser page |
| State | The data the app currently holds (`state` object) |
| Render | Redrawing the screen from the current data |
| Heredoc | The `cat > file << 'EOF'` way of writing a file from the terminal |
| PWA | A website that can be installed like an app |
| Service worker | A background script that caches files and intercepts requests |
| kWh / unit | One kilowatt-hour, the unit KPLC sells. One "unit" on the meter |
| Burn rate | Units used per day |
| REP, EPRA, WRA | Rural Electrification Programme levy, the energy regulator's levy, the water resources levy |
