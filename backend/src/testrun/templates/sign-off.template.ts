export interface SignOffEmailData {
  runName: string;
  projectName: string;
  environment: string;
  initiatedBy: string;
  startedAt: string;
  endedAt: string;
  duration: string;
  total: number;
  passed: number;
  failed: number;
  todo: number;
  passRate: number;
  customNotes?: string;
  items: {
    publicId: string;
    title: string;
    moduleName: string;
    priority: string;
    hasAutomation: boolean;
    executionStatus: string;
  }[];
}

export function getSignOffEmailTemplate(data: SignOffEmailData) {
  const statusColors: Record<string, { bg: string; text: string }> = {
    PASSED: { bg: '#E2F9EB', text: '#198038' },
    FAILED: { bg: '#FFF1F1', text: '#DA1E28' },
    TO_DO: { bg: '#FFF9E6', text: '#F1C21B' },
  };

  const priorityColors: Record<string, string> = {
    HIGH: '#DA1E28',
    MEDIUM: '#0F62FE',
    LOW: '#757575',
  };

  const itemsRows = data.items
    .map((item) => {
      const statusColor = statusColors[item.executionStatus] || { bg: '#F4F4F4', text: '#525252' };
      const priorityColor = priorityColors[item.priority] || '#757575';
      const typeBadge = item.hasAutomation
        ? '<span style="display:inline-block;padding:2px 6px;font-family:monospace;font-size:10px;font-weight:bold;color:#8A3FFC;border:1px solid rgba(138,63,252,0.3);border-radius:2px;background:#F6F0FF;">AUTO</span>'
        : '<span style="display:inline-block;padding:2px 6px;font-family:monospace;font-size:10px;font-weight:bold;color:#525252;border:1px solid rgba(82,82,82,0.3);border-radius:2px;background:#F4F4F4;">MANUAL</span>';

      return `
        <tr style="border-bottom:1px solid #E0E0E0;">
          <td style="padding:10px 12px;font-family:monospace;font-size:12px;font-weight:bold;color:#0F62FE;white-space:nowrap;">
            ${item.publicId || 'N/A'}
          </td>
          <td style="padding:10px 12px;font-size:13px;color:#161616;">
            ${item.title}
          </td>
          <td style="padding:10px 12px;font-size:12px;color:#525252;white-space:nowrap;">
            ${item.moduleName || 'Unassigned'}
          </td>
          <td style="padding:10px 12px;font-size:12px;white-space:nowrap;">
            <span style="color:${priorityColor};font-weight:bold;">${item.priority}</span>
          </td>
          <td style="padding:10px 12px;white-space:nowrap;">
            ${typeBadge}
          </td>
          <td style="padding:10px 12px;white-space:nowrap;text-align:right;">
            <span style="display:inline-block;padding:3px 8px;font-size:11px;font-weight:bold;border-radius:2px;background-color:${statusColor.bg};color:${statusColor.text};">
              ${item.executionStatus}
            </span>
          </td>
        </tr>
      `;
    })
    .join('');

  const notesHtml = data.customNotes
    ? `
      <div style="margin-bottom:28px;padding:16px;background-color:#F4F6F9;border-left:4px solid #8A3FFC;border-radius:0 4px 4px 0;">
        <h3 style="margin-top:0;margin-bottom:8px;font-size:13px;font-family:monospace;text-transform:uppercase;letter-spacing:1px;color:#525252;">Sign-Off Remarks</h3>
        <p style="margin:0;font-size:14px;color:#161616;white-space:pre-wrap;line-height:1.5;">${data.customNotes}</p>
      </div>
    `
    : '';

  return {
    subject: `[Sign-Off] Test Run Report: ${data.runName} (${data.projectName})`,
    body: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Test Run Sign-Off Report</title>
      </head>
      <body style="margin:0;padding:20px;background-color:#F7F9FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:680px;background-color:#FFFFFF;border:1px solid #E0E0E0;border-radius:6px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.03);">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 24px 32px;background:linear-gradient(135deg, #0F62FE 0%, #6366F1 50%, #8A3FFC 100%);color:#FFFFFF;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <span style="display:inline-block;padding:4px 8px;font-family:monospace;font-size:10px;font-weight:bold;letter-spacing:1px;background-color:rgba(255,255,255,0.2);color:#FFFFFF;border-radius:3px;margin-bottom:12px;text-transform:uppercase;">Sign-Off Report</span>
                    <h1 style="margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px;line-height:1.2;">${data.runName}</h1>
                    <p style="margin:6px 0 0 0;font-size:14px;color:rgba(255,255,255,0.85);font-weight:500;">Project Workspace: ${data.projectName}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Wrapper -->
          <tr>
            <td style="padding:32px;">
              <!-- Custom Notes (If Provided) -->
              ${notesHtml}

              <!-- Summary Metrics Cards -->
              <h2 style="margin-top:0;margin-bottom:16px;font-size:15px;font-family:monospace;text-transform:uppercase;letter-spacing:1px;color:#525252;border-bottom:1px solid #E0E0E0;padding-bottom:6px;">Execution Metrics</h2>
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
                <tr>
                  <td width="30%" valign="middle" style="padding:16px;background-color:#F4F4F9;border-radius:4px;text-align:center;border-right:8px solid #FFFFFF;">
                    <div style="font-size:10px;font-family:monospace;color:#757575;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Pass Rate</div>
                    <div style="font-size:28px;font-weight:bold;color:#24A148;font-family:monospace;">${data.passRate}%</div>
                  </td>
                  <td width="70%" valign="top">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding:12px;background-color:#E2F9EB;border-radius:4px;border-right:6px solid #FFFFFF;border-bottom:6px solid #FFFFFF;text-align:center;">
                          <div style="font-size:9px;font-family:monospace;color:#198038;text-transform:uppercase;font-weight:bold;">Passed</div>
                          <div style="font-size:18px;font-weight:bold;color:#198038;font-family:monospace;margin-top:2px;">${data.passed}</div>
                        </td>
                        <td style="padding:12px;background-color:#FFF1F1;border-radius:4px;border-bottom:6px solid #FFFFFF;text-align:center;">
                          <div style="font-size:9px;font-family:monospace;color:#DA1E28;text-transform:uppercase;font-weight:bold;">Failed</div>
                          <div style="font-size:18px;font-weight:bold;color:#DA1E28;font-family:monospace;margin-top:2px;">${data.failed}</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px;background-color:#FFF9E6;border-radius:4px;border-right:6px solid #FFFFFF;text-align:center;">
                          <div style="font-size:9px;font-family:monospace;color:#B28B00;text-transform:uppercase;font-weight:bold;">TO DO</div>
                          <div style="font-size:18px;font-weight:bold;color:#B28B00;font-family:monospace;margin-top:2px;">${data.todo}</div>
                        </td>
                        <td style="padding:12px;background-color:#F4F4F4;border-radius:4px;text-align:center;">
                          <div style="font-size:9px;font-family:monospace;color:#525252;text-transform:uppercase;font-weight:bold;">Total Scopes</div>
                          <div style="font-size:18px;font-weight:bold;color:#525252;font-family:monospace;margin-top:2px;">${data.total}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Telemetry Meta Metadata -->
              <h2 style="margin-top:0;margin-bottom:16px;font-size:15px;font-family:monospace;text-transform:uppercase;letter-spacing:1px;color:#525252;border-bottom:1px solid #E0E0E0;padding-bottom:6px;">Telemetry & Meta</h2>
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;background-color:#FCFCFD;border:1px solid #EAEAEA;border-radius:4px;font-size:13px;">
                <tr>
                  <td style="padding:12px;font-weight:bold;color:#525252;width:150px;border-bottom:1px solid #EAEAEA;">Environment</td>
                  <td style="padding:12px;color:#161616;border-bottom:1px solid #EAEAEA;">${data.environment || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding:12px;font-weight:bold;color:#525252;width:150px;border-bottom:1px solid #EAEAEA;">Initiated By</td>
                  <td style="padding:12px;color:#161616;border-bottom:1px solid #EAEAEA;">${data.initiatedBy}</td>
                </tr>
                <tr>
                  <td style="padding:12px;font-weight:bold;color:#525252;width:150px;border-bottom:1px solid #EAEAEA;">Execution Period</td>
                  <td style="padding:12px;color:#161616;border-bottom:1px solid #EAEAEA;">${data.startedAt} - ${data.endedAt}</td>
                </tr>
                <tr>
                  <td style="padding:12px;font-weight:bold;color:#525252;width:150px;">Duration Time</td>
                  <td style="padding:12px;color:#161616;">${data.duration}</td>
                </tr>
              </table>

              <!-- Detailed Scopes Table -->
              <h2 style="margin-top:0;margin-bottom:16px;font-size:15px;font-family:monospace;text-transform:uppercase;letter-spacing:1px;color:#525252;border-bottom:1px solid #E0E0E0;padding-bottom:6px;">Detailed Scope Coverage</h2>
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size:13px;border-collapse:collapse;border:1px solid #E0E0E0;border-radius:4px;overflow:hidden;">
                <thead>
                  <tr style="background-color:#F4F4F9;border-bottom:2px solid #E0E0E0;text-align:left;">
                    <th style="padding:10px 12px;font-weight:bold;color:#525252;width:90px;">ID</th>
                    <th style="padding:10px 12px;font-weight:bold;color:#525252;">Test Case Title</th>
                    <th style="padding:10px 12px;font-weight:bold;color:#525252;width:110px;">Module</th>
                    <th style="padding:10px 12px;font-weight:bold;color:#525252;width:60px;">Priority</th>
                    <th style="padding:10px 12px;font-weight:bold;color:#525252;width:70px;">Type</th>
                    <th style="padding:10px 12px;font-weight:bold;color:#525252;width:80px;text-align:right;">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px;background-color:#161616;color:#A8A8A8;text-align:center;font-size:11px;">
              <p style="margin:0 0 4px 0;font-weight:bold;color:#FFFFFF;font-size:12px;">QA-Hub Orchestrator Platform</p>
              <p style="margin:0;">This email is an automated execution sign-off report. Do not reply directly.</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
}
