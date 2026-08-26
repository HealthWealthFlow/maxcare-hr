# Maxcare HR — Google Sheets Backend Setup

This turns a Google Sheet into the app's shared data store (so staff + manager always see the same records and nothing is lost). The coding is done for you — you just deploy the Apps Script once.

## What you need
- A Google account (the one that owns the sheet — `maxcarepharmacy99@gmail.com` works).

## Steps (≈5 minutes)

### 1. Create the sheet
Open **https://sheets.new** → rename it (e.g. `Maxcare HR Data`). (You already have a blank spreadsheet open — use that one.)

### 2. Add the Apps Script
In that spreadsheet:
1. Menu **Extensions → Apps Script**.
2. Delete the default content and **paste the whole `apps-script/Code.gs`** file contents from this repo.
3. **Save** (Ctrl/Cmd+S). Give the project a name, e.g. `Maxcare HR Backend`.
4. On the first run, the script will **auto-create the tabs** (`Employees`, `LeaveRequests`, `Adjustments`, `Holidays`, `Policy`) and **seed them with all your 2026 data** (incl. Nurul's records).

### 3. Deploy as a Web App
1. Top-right **Deploy → New deployment**.
2. **Type:** `Web app`.
3. **Execute as:** `Me`.
4. **Who has access:** `Anyone` (or `Anyone with a Google account` — choose `Anyone` so the app can read it; you control security via the sheet's own Sharing).
5. **Deploy.** Authorize when prompted (this is your own script; it only reads/writes that one sheet).
6. Copy the **Web app URL** (ends in `/exec`), e.g. `https://script.google.com/macros/s/XXXX/exec`.

### 4. Share the sheet (optional but recommended)
Click **Share** and add the staff/manager emails you want to be able to view the data directly.

### 5. Connect the app
In the frontend `.env` set:
```env
VITE_SHEETS_API_URL=https://script.google.com/macros/s/XXXX/exec
```
then restart `npm run dev`. The app now **reads/writes the Google Sheet** instead of just the browser.

---

## Data model (tabs the script creates)
| Tab | Columns |
|---|---|
| **Employees** | id, empCode, name, role, department, avatar, email, phone, status, joinDate, annualFull, medicalFull, annualTotal, annualUsed, annualPending, unpaidApprovedYTD, unpaidPending, emergencyApprovedYTD, emergencyPending, sickTotal, sickUsed |
| **LeaveRequests** | id, employeeId, employeeName, employeeRole, employeeAvatar, department, type, startDate, endDate, durationDays, reason, status, submittedDate, rejectionReason, isLate, requiredNoticeDays, actualNoticeDays |
| **Adjustments** | id, employeeId, type, days, date, reason, byUser, byAvatar |
| **Holidays** | id, name, date, day, month, description |
| **Policy** | annualNoticeDays, unpaidNoticeDays, emergencyNoticeDays, emergencyTreatment, mon..sun |

## Endpoints (web app `/exec`)
All are GET with `?action=` (this avoids browser CORS issues):
- `?action=all` → full data snapshot (employees, leaveRequests, adjustments, holidays, policy).
- `?action=addLeave&id=...&employeeId=...&...` → add a leave request.
- `?action=setStatus&id=...&status=approved&rejectionReason=...` → approve/reject.
- `?action=addAdjustment&...` → add a balance adjustment.
- `?action=deleteHoliday&id=...` → remove a holiday.
- `?action=updatePolicy&...` → update policy.

## Notes
- The Apps Script **auto-creates/seeds** the sheet the first time it's called, so you don't have to build tabs or type data.
- Browser CORS is handled by using GET requests; the script returns JSON.
- `onOpen` menu isn't required (the web app does everything).
- Keep the script's owner as the sheet owner. You can edit the sheet manually and the app will show it.
