/**
 * ============================================================================
 * MARIAHU P. G. COLLEGE JAUNPUR - GOOGLE SHEETS FORM HANDLER
 * ============================================================================
 * 
 * INSTRUCTIONS FOR UPDATING YOUR SCRIPT IN GOOGLE SHEETS:
 * 1. Go back to your Google Sheet (where you have "Sheet1" with columns:
 *    Name | Email | Subject | Message | Submitted from).
 * 2. In the top menu, go to: Extensions > Apps Script.
 * 3. Replace all the code in the editor with this ENTIRE file.
 * 4. Click the "Save project" icon (floppy disk).
 * 5. VERY IMPORTANT: To make changes take effect, deploy a NEW version:
 *      - Click the blue "Deploy" button (top right) -> "Manage deployments".
 *      - Click the Pencil (Edit) icon on your Web app deployment.
 *      - Under "Version", select "New version".
 *      - Click "Deploy".
 *    (This updates the existing Web App URL without changing the link!)
 * ============================================================================
 */

/**
 * Handles incoming POST requests from the website contact form
 */
function doPost(e) {
  try {
    let name = "";
    let email = "";
    let subject = "";
    let message = "";
    let source = "Website Form";

    // 1. Parse JSON body if present
    if (e && e.postData && e.postData.contents) {
      try {
        const parsed = JSON.parse(e.postData.contents);
        name = parsed.name || "";
        email = parsed.email || "";
        subject = parsed.subject || "";
        message = parsed.message || "";
        if (parsed.source) source = parsed.source;
      } catch (jsonErr) {}
    }

    // 2. Parse URL-encoded / Form parameters
    if (e && e.parameter) {
      name = name || e.parameter.name || "";
      email = email || e.parameter.email || "";
      subject = subject || e.parameter.subject || "";
      message = message || e.parameter.message || "";
      if (e.parameter.source) source = e.parameter.source;
    }

    // Sanitize values
    name = String(name || "").trim().slice(0, 100);
    email = String(email || "").trim().slice(0, 150);
    subject = String(subject || "").trim().slice(0, 150);
    message = String(message || "").trim().slice(0, 2000);

    if (!name || !email || !subject || !message) {
      return jsonResponse({
        ok: false,
        error: "Missing required fields. Please ensure name, email, subject, and message are provided."
      });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // TARGET SHEET:
    // Prefer "Sheet1" (the sheet shown in your spreadsheet), otherwise active sheet, or first sheet.
    let sheet = ss.getSheetByName("Sheet1") || ss.getActiveSheet() || ss.getSheets()[0];

    // Read headers from Row 1
    let headers = [];
    const lastCol = Math.max(sheet.getLastColumn(), 5);
    if (sheet.getLastRow() > 0) {
      headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    }

    // If row 1 is completely empty, initialize headers matching your layout
    if (headers.length === 0 || !headers[0]) {
      sheet.appendRow(["Name", "Email", "Subject", "Message", "Submitted from"]);
      headers = ["Name", "Email", "Subject", "Message", "Submitted from"];
      const headerRange = sheet.getRange(1, 1, 1, 5);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#20221e");
      headerRange.setFontColor("#f4f2ec");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }

    // Format local timestamp (e.g. 2026-10-11 22:45:00)
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT+5:30", "yyyy-MM-dd HH:mm:ss");

    // Map fields dynamically to match YOUR exact column order in Sheet1
    // (Column A: Name, Column B: Email, Column C: Subject, Column D: Message, Column E: Submitted from)
    const rowData = [];
    for (let i = 0; i < headers.length; i++) {
      const h = String(headers[i] || "").trim().toLowerCase();
      if (h.includes("name")) {
        rowData.push(name);
      } else if (h.includes("email")) {
        rowData.push(email);
      } else if (h.includes("subject")) {
        rowData.push(subject);
      } else if (h.includes("message")) {
        rowData.push(message);
      } else if (h.includes("submit") || h.includes("from") || h.includes("time") || h.includes("date")) {
        rowData.push(timestamp);
      } else {
        rowData.push("");
      }
    }

    // Fallback if headers couldn't be parsed: standard 5-column array
    if (rowData.every(v => v === "")) {
      sheet.appendRow([name, email, subject, message, timestamp]);
    } else {
      sheet.appendRow(rowData);
    }

    // Auto-fit column widths
    try {
      sheet.autoResizeColumns(1, headers.length);
    } catch (_) {}

    return jsonResponse({
      ok: true,
      message: "Message successfully saved to Google Sheet."
    });

  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error.toString()
    });
  }
}

/**
 * Handles GET requests so you can test the endpoint directly in a browser
 */
function doGet(e) {
  return HtmlService.createHtmlOutput(
    `<!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mariahu College - Form Service</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f2ec; color: #20221e; padding: 40px 20px; text-align: center; }
          .card { max-width: 500px; margin: 0 auto; background: white; padding: 32px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); }
          h1 { font-size: 22px; margin-bottom: 8px; color: #2e3d2b; }
          p { font-size: 14px; line-height: 1.6; color: #555; }
          .badge { display: inline-block; padding: 6px 14px; background: #d8e777; color: #20221e; font-weight: 600; font-size: 12px; border-radius: 20px; margin-bottom: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">ACTIVE &amp; READY</div>
          <h1>Mariahu P. G. College Jaunpur</h1>
          <p>The Google Sheets endpoint for <strong>"A note to the college"</strong> is live and targets <strong>Sheet1</strong>.</p>
        </div>
      </body>
    </html>`
  ).setTitle("Mariahu College - Form Service Status");
}

/**
 * Helper to return a JSON response
 */
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
