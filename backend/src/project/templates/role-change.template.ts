export const getRoleChangeTemplate = (userName: string, projectName: string, oldRole: string, newRole: string, adminName: string) => {
  return {
    subject: `[QA-Hub] Access Update: Role Changed in Project ${projectName}`,
    body: `Hello ${userName},

We are writing to inform you that your access rights (role) in the project ${projectName} have been updated.

Change Details:
• Project	${projectName}
• Previous Role	${oldRole}
• New Role	${newRole}
• Updated By	${adminName}

What does this mean for you?
• If upgraded to Admin: You now have full access to manage the project, configure settings, and handle team member permissions.
• If changed to Member: You can still fully contribute to the project (creating test cases, executing tests, etc.), but your project management access has been adjusted.

This change is effective immediately.

Best regards,
The QA-Hub Team`
  };
};
