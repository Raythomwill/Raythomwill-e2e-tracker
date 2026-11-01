# E2E Tracker

An interactive end-to-end test progress tracker for test managers. It reads a OneDrive Excel workbook live and shows:

- **Flow map**: business flows as steps, in dependency order, with the systems on each step and every feature's status.
- **Summary**: E2E readiness (the weakest step), average progress, features OK, steps behind the average, and open defects.
- **Who is behind**: systems ranked by progress, with their open features and defects.
- **Defects**: every defect traced to its feature, flow step and system, colour coded by status and category.

The whole tool is a single file, `index.html`: HTML, CSS and JavaScript with no build step.

## How it gets data

The page is published as a claude.ai artifact and reads the workbook through the viewer's **Microsoft 365** connector (`read_resource`). It refreshes every minute while the page is visible. Opened outside claude.ai, it can't reach the connector and shows a message instead of data.

Use **Change workbook** on the page to point it at another OneDrive Excel link.

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
