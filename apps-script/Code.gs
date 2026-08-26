/**
 * Maxcare HR — Google Sheets backend (Apps Script web app)
 * ---------------------------------------------------------
 * Deploy this as a Web App, then point the frontend at the /exec URL via VITE_SHEETS_API_URL.
 * Data lives in tabs: Employees, LeaveRequests, Adjustments, Holidays, Policy.
 * All calls are GET with ?action=... (avoids browser CORS preflight).
 */

var EMPLOYEE_HEADERS = ['id','empCode','name','role','department','avatar','email','phone','status','joinDate','annualFull','medicalFull','annualTotal','annualUsed','annualPending','unpaidApprovedYTD','unpaidPending','emergencyApprovedYTD','emergencyPending','sickTotal','sickUsed'];
var LEAVE_HEADERS = ['id','employeeId','employeeName','employeeRole','employeeAvatar','department','type','startDate','endDate','durationDays','reason','status','submittedDate','rejectionReason','isLate','requiredNoticeDays','actualNoticeDays'];
var ADJ_HEADERS = ['id','employeeId','type','days','date','reason','byUser','byAvatar'];
var HOLIDAY_HEADERS = ['id','name','date','day','month','description'];
var POLICY_HEADERS = ['annualNoticeDays','unpaidNoticeDays','emergencyNoticeDays','emergencyTreatment','mon','tue','wed','thu','fri','sat','sun'];

function ensureSheet(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function rowsToObjects(sheet, headers) {
  var values = sheet.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[0]) continue;
    var o = {};
    for (var j = 0; j < headers.length; j++) o[headers[j]] = row[j];
    o.isLate = o.isLate === true || o.isLate === 'true' || o.isLate === 'TRUE';
    out.push(o);
  }
  return out;
}

function writeRows(sheet, headers, rows) {
  sheet.clearContents();
  sheet.appendRow(headers);
  var values = rows.map(function (o) {
    return headers.map(function (h) { return o[h] !== undefined ? o[h] : ''; });
  });
  if (values.length) sheet.getRange(2, 1, values.length, headers.length).setValues(values);
}

function seed() {
  var employees = [
    { id:'emp-1', empCode:'PC001', name:'Lee Xin Mei', role:'Pharmacy Assistant', department:'Pharmacy', avatar:'', email:'lee.xinmei@maxcare.com.my', phone:'+60 12-345 6789', status:'active', joinDate:'2024-01-01', annualFull:14, medicalFull:18, annualTotal:14, annualUsed:5, annualPending:2, unpaidApprovedYTD:1, unpaidPending:1, emergencyApprovedYTD:1, emergencyPending:0, sickTotal:18, sickUsed:3 },
    { id:'emp-2', empCode:'PC002', name:'Nurul Farahin Binti Makpol', role:'Pharmacy Assistant', department:'Pharmacy', avatar:'', email:'nurul.farahin@maxcare.com.my', phone:'+60 16-789 1234', status:'active', joinDate:'2026-04-01', annualFull:8, medicalFull:14, annualTotal:6, annualUsed:3.5, annualPending:1, unpaidApprovedYTD:3, unpaidPending:0, emergencyApprovedYTD:0, emergencyPending:0, sickTotal:10, sickUsed:6 },
    { id:'emp-3', empCode:'PC003', name:'Chow Mei Yen', role:'Pharmacy Assistant', department:'Pharmacy', avatar:'', email:'chow.meiyen@maxcare.com.my', phone:'+60 17-890 1234', status:'active', joinDate:'2024-01-01', annualFull:18, medicalFull:18, annualTotal:18, annualUsed:0, annualPending:0, unpaidApprovedYTD:0, unpaidPending:0, emergencyApprovedYTD:0, emergencyPending:0, sickTotal:18, sickUsed:0 }
  ];

  var leaves = [
    // Lee Xin Mei (sample)
    { id:'REQ-1001A', employeeId:'emp-1', employeeName:'Lee Xin Mei', employeeRole:'Pharmacy Assistant', employeeAvatar:'', department:'Pharmacy', type:'annual', startDate:'2026-09-10', endDate:'2026-09-11', durationDays:2, reason:'Family matter.', status:'approved', submittedDate:'2026-08-25', rejectionReason:'', isLate:false, requiredNoticeDays:7, actualNoticeDays:16 },
    { id:'REQ-1002B', employeeId:'emp-1', employeeName:'Lee Xin Mei', employeeRole:'Pharmacy Assistant', employeeAvatar:'', department:'Pharmacy', type:'annual', startDate:'2026-09-14', endDate:'2026-09-15', durationDays:2, reason:'Personal errands.', status:'pending', submittedDate:'2026-09-12', rejectionReason:'', isLate:true, requiredNoticeDays:7, actualNoticeDays:2 },
    { id:'REQ-1003C', employeeId:'emp-1', employeeName:'Lee Xin Mei', employeeRole:'Pharmacy Assistant', employeeAvatar:'', department:'Pharmacy', type:'emergency', startDate:'2026-08-18', endDate:'2026-08-18', durationDays:1, reason:'Medical emergency.', status:'approved', submittedDate:'2026-08-17', rejectionReason:'', isLate:false, requiredNoticeDays:0, actualNoticeDays:1 },
    { id:'REQ-1004D', employeeId:'emp-1', employeeName:'Lee Xin Mei', employeeRole:'Pharmacy Assistant', employeeAvatar:'', department:'Pharmacy', type:'unpaid', startDate:'2026-08-05', endDate:'2026-08-05', durationDays:1, reason:'Personal travel extension.', status:'rejected', submittedDate:'2026-07-20', rejectionReason:'Insufficient staff coverage.', isLate:false, requiredNoticeDays:7, actualNoticeDays:16 },
    // Nurul Farahin (real 2026)
    { id:'REQ-2001A', employeeId:'emp-2', employeeName:'Nurul Farahin Binti Makpol', employeeRole:'Pharmacy Assistant', employeeAvatar:'', department:'Pharmacy', type:'annual', startDate:'2026-05-28', endDate:'2026-05-28', durationDays:0.5, reason:'Half day', status:'approved', submittedDate:'2026-05-28', rejectionReason:'', isLate:false, requiredNoticeDays:7, actualNoticeDays:7 },
    { id:'REQ-2002B', employeeId:'emp-2', employeeName:'Nurul Farahin Binti Makpol', employeeRole:'Pharmacy Assistant', employeeAvatar:'', department:'Pharmacy', type:'annual', startDate:'2026-05-29', endDate:'2026-05-29', durationDays:1, reason:'Personal leave', status:'approved', submittedDate:'2026-05-29', rejectionReason:'', isLate:false, requiredNoticeDays:7, actualNoticeDays:7 },
    { id:'REQ-2003C', employeeId:'emp-2', employeeName:'Nurul Farahin Binti Makpol', employeeRole:'Pharmacy Assistant', employeeAvatar:'', department:'Pharmacy', type:'annual', startDate:'2026-06-13', endDate:'2026-06-13', durationDays:1, reason:'Father admitted to hospital.', status:'approved', submittedDate:'2026-06-13', rejectionReason:'', isLate:false, requiredNoticeDays:7, actualNoticeDays:7 },
    { id:'REQ-2004D', employeeId:'emp-2', employeeName:'Nurul Farahin Binti Makpol', employeeRole:'Pharmacy Assistant', employeeAvatar:'', department:'Pharmacy', type:'annual', startDate:'2026-07-09', endDate:'2026-07-09', durationDays:0.5, reason:'Half day', status:'approved', submittedDate:'2026-07-09', rejectionReason:'', isLate:false, requiredNoticeDays:7, actualNoticeDays:7 },
    { id:'REQ-2005E', employeeId:'emp-2', employeeName:'Nurul Farahin Binti Makpol', employeeRole:'Pharmacy Assistant', employeeAvatar:'', department:'Pharmacy', type:'annual', startDate:'2026-08-07', endDate:'2026-08-07', durationDays:0.5, reason:'Half day', status:'approved', submittedDate:'2026-08-07', rejectionReason:'', isLate:false, requiredNoticeDays:7, actualNoticeDays:7 },
    { id:'REQ-2006F', employeeId:'emp-2', employeeName:'Nurul Farahin Binti Makpol', employeeRole:'Pharmacy Assistant', employeeAvatar:'', department:'Pharmacy', type:'annual', startDate:'2026-09-01', endDate:'2026-09-01', durationDays:1, reason:'Balik kampung.', status:'pending', submittedDate:'2026-08-25', rejectionReason:'', isLate:false, requiredNoticeDays:7, actualNoticeDays:7 },
    { id:'REQ-2007G', employeeId:'emp-2', employeeName:'Nurul Farahin Binti Makpol', employeeRole:'Pharmacy Assistant', employeeAvatar:'', department:'Pharmacy', type:'sick', startDate:'2026-05-18', endDate:'2026-05-18', durationDays:1, reason:'Medical certificate.', status:'approved', submittedDate:'2026-05-18', rejectionReason:'', isLate:false, requiredNoticeDays:0, actualNoticeDays:1 },
    { id:'REQ-2008H', employeeId:'emp-2', employeeName:'Nurul Farahin Binti Makpol', employeeRole:'Pharmacy Assistant', employeeAvatar:'', department:'Pharmacy', type:'sick', startDate:'2026-06-23', endDate:'2026-06-23', durationDays:1, reason:'Medical certificate.', status:'approved', submittedDate:'2026-06-23', rejectionReason:'', isLate:false, requiredNoticeDays:0, actualNoticeDays:1 },
    { id:'REQ-2009I', employeeId:'emp-2', employeeName:'Nurul Farahin Binti Makpol', employeeRole:'Pharmacy Assistant', employeeAvatar:'', department:'Pharmacy', type:'sick', startDate:'2026-07-25', endDate:'2026-07-25', durationDays:1, reason:'Medical certificate.', status:'approved', submittedDate:'2026-07-25', rejectionReason:'', isLate:false, requiredNoticeDays:0, actualNoticeDays:1 },
    { id:'REQ-2010J', employeeId:'emp-2', employeeName:'Nurul Farahin Binti Makpol', employeeRole:'Pharmacy Assistant', employeeAvatar:'', department:'Pharmacy', type:'sick', startDate:'2026-08-07', endDate:'2026-08-07', durationDays:1, reason:'Medical certificate.', status:'approved', submittedDate:'2026-08-07', rejectionReason:'', isLate:false, requiredNoticeDays:0, actualNoticeDays:1 },
    { id:'REQ-2011K', employeeId:'emp-2', employeeName:'Nurul Farahin Binti Makpol', employeeRole:'Pharmacy Assistant', employeeAvatar:'', department:'Pharmacy', type:'sick', startDate:'2026-08-25', endDate:'2026-08-26', durationDays:2, reason:'Medical certificate.', status:'approved', submittedDate:'2026-08-25', rejectionReason:'', isLate:false, requiredNoticeDays:0, actualNoticeDays:1 },
    { id:'REQ-2012L', employeeId:'emp-2', employeeName:'Nurul Farahin Binti Makpol', employeeRole:'Pharmacy Assistant', employeeAvatar:'', department:'Pharmacy', type:'unpaid', startDate:'2026-06-12', endDate:'2026-06-12', durationDays:0.5, reason:'Back to Johor.', status:'approved', submittedDate:'2026-06-12', rejectionReason:'', isLate:false, requiredNoticeDays:7, actualNoticeDays:7 },
    { id:'REQ-2013M', employeeId:'emp-2', employeeName:'Nurul Farahin Binti Makpol', employeeRole:'Pharmacy Assistant', employeeAvatar:'', department:'Pharmacy', type:'unpaid', startDate:'2026-07-27', endDate:'2026-07-27', durationDays:1, reason:'Not well - no MC.', status:'approved', submittedDate:'2026-07-27', rejectionReason:'', isLate:false, requiredNoticeDays:7, actualNoticeDays:7 },
    { id:'REQ-2014N', employeeId:'emp-2', employeeName:'Nurul Farahin Binti Makpol', employeeRole:'Pharmacy Assistant', employeeAvatar:'', department:'Pharmacy', type:'unpaid', startDate:'2026-08-06', endDate:'2026-08-06', durationDays:0.5, reason:'Bee sting - no MC.', status:'approved', submittedDate:'2026-08-06', rejectionReason:'', isLate:false, requiredNoticeDays:7, actualNoticeDays:7 },
    { id:'REQ-2015O', employeeId:'emp-2', employeeName:'Nurul Farahin Binti Makpol', employeeRole:'Pharmacy Assistant', employeeAvatar:'', department:'Pharmacy', type:'unpaid', startDate:'2026-08-24', endDate:'2026-08-24', durationDays:1, reason:'Nausea - no MC.', status:'approved', submittedDate:'2026-08-24', rejectionReason:'', isLate:false, requiredNoticeDays:7, actualNoticeDays:7 }
  ];

  var adjustments = [
    { id:'adj-1', employeeId:'emp-1', type:'annual', days:2, date:'Oct 12, 2023', reason:'Performance bonus leave awarded.', byUser:'Pharmacy Manager', byAvatar:'' },
    { id:'adj-2', employeeId:'emp-1', type:'annual', days:-1, date:'Jan 05, 2023', reason:'Correction: double entry.', byUser:'Pharmacy Manager', byAvatar:'' }
  ];

  var holidays = [
    { id:'hol-1', name:"Yang di-Pertuan Agong's Birthday", date:'2026-06-08', day:'08', month:'JUN', description:'Mandatory Company Holiday' },
    { id:'hol-2', name:'KL Federal Territory Day', date:'2026-02-01', day:'01', month:'FEB', description:'Mandatory Company Holiday' },
    { id:'hol-3', name:'Labour Day', date:'2026-05-01', day:'01', month:'MAY', description:'Mandatory Company Holiday' },
    { id:'hol-4', name:'National Day', date:'2026-08-31', day:'31', month:'AUG', description:'Mandatory Company Holiday' },
    { id:'hol-5', name:'Malaysia Day', date:'2026-09-16', day:'16', month:'SEP', description:'Mandatory Company Holiday' },
    { id:'hol-6', name:"New Year's Day", date:'2026-01-01', day:'01', month:'JAN', description:'Company-Selected Holiday' },
    { id:'hol-7', name:'Chinese New Year', date:'2026-02-17', day:'17', month:'FEB', description:'Company-Selected Holiday (Day 1)' },
    { id:'hol-8', name:'Chinese New Year', date:'2026-02-18', day:'18', month:'FEB', description:'Company-Selected Holiday (Day 2)' },
    { id:'hol-9', name:'Hari Raya Aidilfitri', date:'2026-03-20', day:'20', month:'MAR', description:'Company-Selected Holiday' },
    { id:'hol-10', name:'Deepavali', date:'2026-11-08', day:'08', month:'NOV', description:'Company-Selected Holiday' },
    { id:'hol-11', name:'Christmas Day', date:'2026-12-25', day:'25', month:'DEC', description:'Company-Selected Holiday' }
  ];

  var policy = { annualNoticeDays:7, unpaidNoticeDays:7, emergencyNoticeDays:0, emergencyTreatment:'deduct_annual', mon:true, tue:true, wed:true, thu:true, fri:true, sat:false, sun:false };

  var adjSheet = ensureSheet('Adjustments', ADJ_HEADERS);
  var holSheet = ensureSheet('Holidays', HOLIDAY_HEADERS);
  var polSheet = ensureSheet('Policy', POLICY_HEADERS);
  var empSheet = ensureSheet('Employees', EMPLOYEE_HEADERS);
  var leaveSheet = ensureSheet('LeaveRequests', LEAVE_HEADERS);

  if (empSheet.getLastRow() <= 1) writeRows(empSheet, EMPLOYEE_HEADERS, employees);
  if (leaveSheet.getLastRow() <= 1) writeRows(leaveSheet, LEAVE_HEADERS, leaves);
  if (adjSheet.getLastRow() <= 1) writeRows(adjSheet, ADJ_HEADERS, adjustments);
  if (holSheet.getLastRow() <= 1) writeRows(holSheet, HOLIDAY_HEADERS, holidays);
  if (polSheet.getLastRow() <= 1) writeRows(polSheet, POLICY_HEADERS, [policy]);
}

function snapshot() {
  var empSheet = ensureSheet('Employees', EMPLOYEE_HEADERS);
  var leaveSheet = ensureSheet('LeaveRequests', LEAVE_HEADERS);
  var adjSheet = ensureSheet('Adjustments', ADJ_HEADERS);
  var holSheet = ensureSheet('Holidays', HOLIDAY_HEADERS);
  var polSheet = ensureSheet('Policy', POLICY_HEADERS);
  var employees = rowsToObjects(empSheet, EMPLOYEE_HEADERS).map(function (e) {
    return {
      id: e.id, empCode: e.empCode, name: e.name, role: e.role, department: e.department, avatar: e.avatar, email: e.email, phone: e.phone, status: e.status, joinDate: e.joinDate,
      fullEntitlements: { annual: Number(e.annualFull), medical: Number(e.medicalFull) },
      entitlements: { annualTotal: Number(e.annualTotal), annualUsed: Number(e.annualUsed), annualPending: Number(e.annualPending), unpaidApprovedYTD: Number(e.unpaidApprovedYTD), unpaidPending: Number(e.unpaidPending), emergencyApprovedYTD: Number(e.emergencyApprovedYTD), emergencyPending: Number(e.emergencyPending), sickTotal: Number(e.sickTotal), sickUsed: Number(e.sickUsed) }
    };
  });
  var leaveRequests = rowsToObjects(leaveSheet, LEAVE_HEADERS).map(function (r) {
    return { id: r.id, employeeId: r.employeeId, employeeName: r.employeeName, employeeRole: r.employeeRole, employeeAvatar: r.employeeAvatar, department: r.department, type: r.type, startDate: r.startDate, endDate: r.endDate, durationDays: Number(r.durationDays), reason: r.reason, status: r.status, submittedDate: r.submittedDate, rejectionReason: r.rejectionReason || '', isLate: r.isLate, requiredNoticeDays: Number(r.requiredNoticeDays), actualNoticeDays: Number(r.actualNoticeDays) };
  });
  var adjustments = rowsToObjects(adjSheet, ADJ_HEADERS).map(function (a) { return { id: a.id, employeeId: a.employeeId, type: a.type, days: Number(a.days), date: a.date, reason: a.reason, byUser: a.byUser, byAvatar: a.byAvatar }; });
  var holidays = rowsToObjects(holSheet, HOLIDAY_HEADERS).map(function (h) { return { id: h.id, name: h.name, date: h.date, day: String(h.day), month: h.month, description: h.description }; });
  var policyRows = rowsToObjects(polSheet, POLICY_HEADERS);
  var p = policyRows[0] || {};
  var policy = {
    annualNoticeDays: Number(p.annualNoticeDays || 7), unpaidNoticeDays: Number(p.unpaidNoticeDays || 7), emergencyNoticeDays: Number(p.emergencyNoticeDays || 0),
    emergencyTreatment: p.emergencyTreatment || 'deduct_annual',
    workingDays: { mon: p.mon === true || p.mon === 'true', tue: p.tue === true || p.tue === 'true', wed: p.wed === true || p.wed === 'true', thu: p.thu === true || p.thu === 'true', fri: p.fri === true || p.fri === 'true', sat: p.sat === true || p.sat === 'true', sun: p.sun === true || p.sun === 'true' }
  };
  return { employees: employees, leaveRequests: leaveRequests, adjustments: adjustments, holidays: holidays, policy: policy };
}

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function addLeave(p) {
  var sheet = ensureSheet('LeaveRequests', LEAVE_HEADERS);
  var row = { id: p.id, employeeId: p.employeeId, employeeName: p.employeeName, employeeRole: p.employeeRole, employeeAvatar: p.employeeAvatar, department: p.department, type: p.type, startDate: p.startDate, endDate: p.endDate, durationDays: Number(p.durationDays), reason: p.reason, status: p.status || 'pending', submittedDate: p.submittedDate, rejectionReason: p.rejectionReason || '', isLate: (p.isLate === 'true' || p.isLate === true), requiredNoticeDays: Number(p.requiredNoticeDays || 7), actualNoticeDays: Number(p.actualNoticeDays || 0) };
  appendObj(sheet, LEAVE_HEADERS, row);
}

function setStatus(p) {
  var sheet = ensureSheet('LeaveRequests', LEAVE_HEADERS);
  var rows = rowsToObjects(sheet, LEAVE_HEADERS);
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].id === p.id) {
      rows[i].status = p.status;
      if (p.rejectionReason) rows[i].rejectionReason = p.rejectionReason;
      var values = sheet.getDataRange().getValues();
      var headers = values[0];
      var rowValues = headers.map(function (h) {
        var key = String(h);
        if (key === 'isLate') return rows[i].isLate === true ? 'TRUE' : 'FALSE';
        return rows[i][key] !== undefined ? rows[i][key] : '';
      });
      sheet.getRange(i + 2, 1, 1, headers.length).setValues([rowValues]);
      return;
    }
  }
}

function addAdjustment(p) {
  var sheet = ensureSheet('Adjustments', ADJ_HEADERS);
  appendObj(sheet, ADJ_HEADERS, { id: p.id, employeeId: p.employeeId, type: p.type, days: Number(p.days), date: p.date, reason: p.reason, byUser: p.byUser, byAvatar: p.byAvatar });
}

function deleteHoliday(p) {
  var sheet = ensureSheet('Holidays', HOLIDAY_HEADERS);
  var rows = rowsToObjects(sheet, HOLIDAY_HEADERS).filter(function (h) { return h.id !== p.id; });
  writeRows(sheet, HOLIDAY_HEADERS, rows);
}

function addHoliday(p) {
  var sheet = ensureSheet('Holidays', HOLIDAY_HEADERS);
  var month = (p.month || '').toUpperCase();
  appendObj(sheet, HOLIDAY_HEADERS, { id: p.id, name: p.name, date: p.date, day: p.day || '', month: month, description: p.description || '' });
}

function updatePolicy(p) {
  var sheet = ensureSheet('Policy', POLICY_HEADERS);
  var row = { annualNoticeDays: Number(p.annualNoticeDays), unpaidNoticeDays: Number(p.unpaidNoticeDays), emergencyNoticeDays: Number(p.emergencyNoticeDays), emergencyTreatment: p.emergencyTreatment, mon: p.mon === 'true', tue: p.tue === 'true', wed: p.wed === 'true', thu: p.thu === 'true', fri: p.fri === 'true', sat: p.sat === 'true', sun: p.sun === 'true' };
  writeRows(sheet, POLICY_HEADERS, [row]);
}

function updateEmployee(p) {
  var sheet = ensureSheet('Employees', EMPLOYEE_HEADERS);
  var rows = rowsToObjects(sheet, EMPLOYEE_HEADERS);
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].id === p.id) {
      var row = {
        id: p.id, empCode: p.empCode, name: p.name, role: p.role, department: p.department,
        avatar: p.avatar, email: p.email, phone: p.phone, status: p.status, joinDate: p.joinDate,
        annualFull: Number(p.annualFull || 0), medicalFull: Number(p.medicalFull || 0),
        annualTotal: Number(p.annualTotal), annualUsed: Number(p.annualUsed), annualPending: Number(p.annualPending),
        unpaidApprovedYTD: Number(p.unpaidApprovedYTD), unpaidPending: Number(p.unpaidPending),
        emergencyApprovedYTD: Number(p.emergencyApprovedYTD), emergencyPending: Number(p.emergencyPending),
        sickTotal: Number(p.sickTotal), sickUsed: Number(p.sickUsed)
      };
      var values = sheet.getDataRange().getValues();
      var headers = values[0];
      var rowValues = headers.map(function (h) { return row[h] !== undefined ? row[h] : ''; });
      sheet.getRange(i + 2, 1, 1, headers.length).setValues([rowValues]);
      return;
    }
  }
}

function appendObj(sheet, headers, obj) {
  var row = headers.map(function (h) { return obj[h] !== undefined ? obj[h] : ''; });
  sheet.appendRow(row);
}

// Add a new employee row (used to onboard a new staff member into the live sheet).
function addEmployee(p) {
  var sheet = ensureSheet('Employees', EMPLOYEE_HEADERS);
  var rows = rowsToObjects(sheet, EMPLOYEE_HEADERS);
  for (var i = 0; i < rows.length; i++) if (rows[i].id === p.id) return; // already exists
  appendObj(sheet, EMPLOYEE_HEADERS, {
    id: p.id, empCode: p.empCode, name: p.name, role: p.role, department: p.department,
    avatar: p.avatar || '', email: p.email || '', phone: p.phone || '', status: p.status || 'active', joinDate: p.joinDate || '',
    annualFull: Number(p.annualFull || 0), medicalFull: Number(p.medicalFull || 0),
    annualTotal: Number(p.annualTotal), annualUsed: Number(p.annualUsed || 0), annualPending: Number(p.annualPending || 0),
    unpaidApprovedYTD: Number(p.unpaidApprovedYTD || 0), unpaidPending: Number(p.unpaidPending || 0),
    emergencyApprovedYTD: Number(p.emergencyApprovedYTD || 0), emergencyPending: Number(p.emergencyPending || 0),
    sickTotal: Number(p.sickTotal), sickUsed: Number(p.sickUsed || 0)
  });
}

// Remove Lee's old demo rows and set her real balances (annual 7 used, medical 2 used).
function resetLee() {
  var empSheet = ensureSheet('Employees', EMPLOYEE_HEADERS);
  var leaveSheet = ensureSheet('LeaveRequests', LEAVE_HEADERS);
  var drop = { 'REQ-1001A': true, 'REQ-1002B': true, 'REQ-1003C': true, 'REQ-1004D': true };
  var rows = rowsToObjects(leaveSheet, LEAVE_HEADERS);
  var kept = rows.filter(function (r) { return !(String(r.employeeId) === 'emp-1' && drop[String(r.id)]); });
  writeRows(leaveSheet, LEAVE_HEADERS, kept);
  var employees = rowsToObjects(empSheet, EMPLOYEE_HEADERS);
  for (var i = 0; i < employees.length; i++) {
    if (employees[i].id === 'emp-1') {
      var values = empSheet.getDataRange().getValues();
      var headers = values[0];
      var rowValues = headers.map(function (h) {
        var k = String(h);
        if (k === 'annualUsed') return 7;
        if (k === 'annualPending') return 0;
        if (k === 'sickUsed') return 2;
        if (k === 'unpaidApprovedYTD') return 0;
        if (k === 'unpaidPending') return 0;
        if (k === 'emergencyApprovedYTD') return 0;
        if (k === 'emergencyPending') return 0;
        return employees[i][k] !== undefined ? employees[i][k] : '';
      });
      empSheet.getRange(i + 2, 1, 1, headers.length).setValues([rowValues]);
      break;
    }
  }
}

// Split Lee's grouped multi-day entries (REQ-1007G 3-day, REQ-1010J 2-day) into per-day records.
function expandLee() {
  var sheet = ensureSheet('LeaveRequests', LEAVE_HEADERS);
  var removals = { 'REQ-1007G': true, 'REQ-1010J': true };
  var rows = rowsToObjects(sheet, LEAVE_HEADERS);
  var kept = rows.filter(function (r) { return !removals[String(r.id)]; });
  var singles = [
    { id:'REQ-1011K', employeeId:'emp-1', employeeName:'Lee Xin Mei', employeeRole:'Pharmacy Assistant', employeeAvatar:'', department:'Pharmacy', type:'annual', startDate:'2026-03-10', endDate:'2026-03-10', durationDays:1, reason:'Annual leave.', status:'approved', submittedDate:'2026-03-03', rejectionReason:'', isLate:false, requiredNoticeDays:7, actualNoticeDays:7 },
    { id:'REQ-1012L', employeeId:'emp-1', employeeName:'Lee Xin Mei', employeeRole:'Pharmacy Assistant', employeeAvatar:'', department:'Pharmacy', type:'annual', startDate:'2026-03-11', endDate:'2026-03-11', durationDays:1, reason:'Annual leave.', status:'approved', submittedDate:'2026-03-03', rejectionReason:'', isLate:false, requiredNoticeDays:7, actualNoticeDays:7 },
    { id:'REQ-1013M', employeeId:'emp-1', employeeName:'Lee Xin Mei', employeeRole:'Pharmacy Assistant', employeeAvatar:'', department:'Pharmacy', type:'annual', startDate:'2026-03-12', endDate:'2026-03-12', durationDays:1, reason:'Annual leave.', status:'approved', submittedDate:'2026-03-03', rejectionReason:'', isLate:false, requiredNoticeDays:7, actualNoticeDays:7 },
    { id:'REQ-1014N', employeeId:'emp-1', employeeName:'Lee Xin Mei', employeeRole:'Pharmacy Assistant', employeeAvatar:'', department:'Pharmacy', type:'sick', startDate:'2026-06-16', endDate:'2026-06-16', durationDays:1, reason:'Medical certificate.', status:'approved', submittedDate:'2026-06-16', rejectionReason:'', isLate:false, requiredNoticeDays:0, actualNoticeDays:1 },
    { id:'REQ-1015O', employeeId:'emp-1', employeeName:'Lee Xin Mei', employeeRole:'Pharmacy Assistant', employeeAvatar:'', department:'Pharmacy', type:'sick', startDate:'2026-06-17', endDate:'2026-06-17', durationDays:1, reason:'Medical certificate.', status:'approved', submittedDate:'2026-06-16', rejectionReason:'', isLate:false, requiredNoticeDays:0, actualNoticeDays:1 }
  ];
  writeRows(sheet, LEAVE_HEADERS, kept.concat(singles));
}

function doGet(e) {
  seed();
  var action = (e.parameter && e.parameter.action) || 'all';
  try {
    if (action === 'all') return json(snapshot());
    if (action === 'addLeave') { addLeave(e.parameter); return json(snapshot()); }
    if (action === 'setStatus') { setStatus(e.parameter); return json(snapshot()); }
    if (action === 'addAdjustment') { addAdjustment(e.parameter); return json(snapshot()); }
    if (action === 'addHoliday') { addHoliday(e.parameter); return json(snapshot()); }
    if (action === 'deleteHoliday') { deleteHoliday(e.parameter); return json(snapshot()); }
    if (action === 'updatePolicy') { updatePolicy(e.parameter); return json(snapshot()); }
    if (action === 'updateEmployee') { updateEmployee(e.parameter); return json(snapshot()); }
    if (action === 'addEmployee') { addEmployee(e.parameter); return json(snapshot()); }
    if (action === 'resetLee') { resetLee(); return json(snapshot()); }
    if (action === 'expandLee') { expandLee(); return json(snapshot()); }
    return json({ error: 'Unknown action: ' + action });
  } catch (err) {
    return json({ error: String(err) });
  }
}
