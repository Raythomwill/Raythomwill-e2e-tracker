# E2E Tracker

An interactive end-to-end test progress tracker for test managers. It reads a OneDrive Excel workbook live and shows:

- **Flow map**: business flows as steps, in dependency order, with the systems on each step and every feature's status.
- **Summary**: E2E readiness (the weakest step), average progress, features OK, steps behind the average, and open defects.
- **Who is behind**: systems ranked by progress, with their open features and defects.
- **Defects**: every defect traced to its feature, flow step and system, colour coded by status and category.

There are two files:

- **`E2E-Tracker.html`**: the shareable version. Open it in any browser; no Claude, OneDrive or internet needed (fonts and Excel import are the only online extras). The data is stored inside the file.
- **`index.html`**: the same page as published on claude.ai, where it also reads the workbook live from OneDrive.

## Using it without Claude or OneDrive

1. Open `E2E-Tracker.html` in a browser.
2. Click **Edit data**. The four tables (Systems, Flows, Features, Defects) can be edited directly, with dropdowns for Status and Category.
   - **Paste from Excel**: copy rows in Excel and paste them in (the header row is optional).
   - **Import Excel file**: load a whole .xlsx with the sheets below.
   - **Copy for Excel**: copy a table back into Excel.
3. Edits show in the tracker at once and are kept in that browser until you save.
4. Click **Save**:
   - **Chrome and Edge (desktop)**: the first time, pick the tracker file itself and confirm replacing it. After that, **Save** writes straight into the same file (the browser may ask "Allow editing?" once per visit). **Save a copy…** writes to a different file. In a synced OneDrive/SharePoint/Teams folder, the updated file syncs to everyone.
   - **Other browsers** (Firefox, Safari): Save downloads a new copy with your data inside.

## Live data inside claude.ai

Published as a claude.ai artifact, the page reads the workbook through the viewer's **Microsoft 365** connector (`read_resource`) and refreshes every minute while visible. **Change workbook** points it at another OneDrive Excel link. **Edit data → Copy OneDrive data and edit** switches to the built-in tables; **Use OneDrive** switches back. If OneDrive can't be read, the page shows the built-in data and says why.

## Workbook layout

| Sheet | Columns | Purpose |
|---|---|---|
| System | Title, Flow | Places each system on a flow |
| Flow | Title, Dependant | Step order. `Start` for a first step; several flows separated by commas |
| Feature | Title, Flow, Status (optional System) | Features and their status |
| Defects | Title, Feature, Category, Status | Defects, linked to features by exact title |

Sheets are recognised by their header row, so sheet names don't matter.

## Statuses and colours

**Features**: New (grey) · Started (light blue) · Implemented (blue) · Testing (yellow) · OK (green).
Score per feature: 0 / 25 / 50 / 75 / 100. A step's progress is the average of its features; E2E readiness is the lowest step.

**Progress %**: 100% green · 75–99% blue · 50–74% yellow · 25–49% orange · 0–24% red.

**Defect status**: New, Started, Implemented, Testing, OK, Closed, Rejected (same colours as features; Closed dark green, Rejected muted). Open = New, Started, Implemented, Testing.

**Defect category**: Critical (red) · High (orange) · Medium (purple) · Low (slate). Read from the word, e.g. `2-High`.

## Flow map layout rules

- A flow's step is one after the latest of the flows it depends on.
- A flow that depends on exactly one flow and only feeds that flow's own successors runs on the same line: it is placed in the same column, directly above it.
- Arrows connect the middle of each box's sides; arrows that would cross a column are routed over the top.
