# Spendly — Personal Expense Tracker

Spendly is a modern, simple, and uncluttered personal expense tracker designed for seamless daily spending management, category analytics, and monthly financial summaries.

---

## ✨ Features

- **⚡ Frictionless Daily Expense Logging**:
  - Clean, minimal form with smart defaults (defaults to today's date).
  - Rapid entry with keyboard shortcut: `Cmd + Enter` (Mac) or `Ctrl + Enter` (Windows/Linux) to save and auto-focus for the next receipt.
  - 1-click Quick Category chips for instant category selection.
  - Optional notes for split bills, payment tags, or merchants.

- **📊 Monthly Summary Charts**:
  - **Category Spending Donut Chart**: Interactive SVG donut chart with hover slice highlights, percentage breakdowns, and central spending readout.
  - **Daily Activity Bar Chart**: High-resolution SVG bar chart graphing spending across every day of the month, with peak-spending highlights and average spending reference line.
  - **Category Breakdown List**: Visual progress bars showing exact amounts and percentage of monthly total.

- **🎯 Budget Tracker**:
  - Set a custom target monthly spending limit.
  - Real-time remaining balance and budget usage indicator (`Normal` ➔ `Warning` at 80% ➔ `Exceeded` at 100%).

- **🔍 Search & Filter**:
  - Instant live search across descriptions, notes, and categories.
  - Category-specific filtering dropdown.
  - Smart date grouping headers (*Today*, *Yesterday*, *Weekday, Month Day*).

- **🌓 Dark & Light Mode**:
  - Polished color system with high-contrast, uncluttered typography.
  - One-click toggle between crisp light mode and sleek dark mode (persisted automatically).

- **💱 Multi-Currency Support**:
  - Switch between `$ (USD)`, `€ (EUR)`, `£ (GBP)`, `₹ (INR)`, `C$ (CAD)`, `A$ (AUD)`, and `¥ (JPY)`.

- **💾 Data Privacy & Portability**:
  - 100% client-side: Your financial data never leaves your device.
  - **Export to CSV**: Download monthly expense reports directly compatible with Excel and Google Sheets.
  - **JSON Backup & Restore**: Full data export and import for safekeeping.
  - **Preloaded Sample Data**: Includes realistic demo data for the current month, plus one-click reset and clear options.

---

## 🚀 How to Run

Because Spendly is built with modern, zero-dependency web standards (pure ES6+, custom SVG charting, and semantic CSS3), **no build step or installation is needed**.

### Option 1: Open Directly in Your Browser
Simply double-click `index.html` or open it with any web browser (Chrome, Safari, Firefox, Edge, etc.):
```bash
# macOS
open index.html

# Linux
xdg-open index.html

# Windows
start index.html
```

### Option 2: Run with a Local Static Server
If you prefer running via a local HTTP server:

```bash
# Using Python 3:
python3 -m http.server 3000

# Open in browser:
http://localhost:3000
```

---

## 📁 Project Structure

```
project/
├── index.html          # Semantic HTML5 layout, accessible SVGs, and modals
├── css/
│   └── styles.css      # Design system, CSS variables, dark/light themes, animations
├── js/
│   ├── app.js          # Application controller, event handlers, and UI rendering
│   ├── charts.js       # Pure SVG chart engine (Donut chart & Daily Bar chart)
│   └── storage.js      # LocalStorage engine, CRUD, analytics calculations, CSV/JSON export
└── README.md           # Project documentation
```

---

## 🎨 Design Philosophy: Simple & Uncluttered

Spendly was built with intentional minimalism:
1. **Breathing Room**: Spacious cards with subtle borders and shadows eliminate visual clutter.
2. **Clear Information Hierarchy**: 4 high-level stat cards at the top immediately answer: *"How much did I spend? How much budget remains? What is my daily average? Where did most money go?"*
3. **No Redundant Friction**: Everything you need to log an expense or view your monthly summary is accessible on a single, focused screen.
