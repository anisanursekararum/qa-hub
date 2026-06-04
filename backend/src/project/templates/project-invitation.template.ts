export const getProjectInvitationTemplate = (userName: string, inviterName: string, projectName: string, joinCode: string) => {
  return {
    subject: `[QA-Hub] Collaboration Invitation: Join Project ${projectName}`,
    body: `Hello ${userName},

You have been invited by ${inviterName} to join the project ${projectName} on QA-Hub.
Please use the access code below to join the team:
JOIN CODE: ${joinCode}

⚠️ Important Information:
• This code is only valid for 3 hours from the time this email was sent.
• If the code expires, you will need to ask the project admin to send a new invitation.

How to Use the Code:
1. Log in to your QA-Hub account.
2. Go to Project menu.
3. Input join code above
4. Click the "Secure Join" button

If you believe you received this invitation by mistake, you can safely ignore this email.

Best regards,
The QA-Hub Team`
  };
};
