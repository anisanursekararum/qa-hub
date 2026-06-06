export const getRevokeAccessTemplate = (userName: string, projectName: string, adminName: string) => {
  return {
    subject: `[QA-Hub] Notice: Access Revoked for Project ${projectName}`,
    body: `Hello ${userName},

This email is to inform you that your access to the project ${projectName} has been revoked by ${adminName}.

What does this mean?
• You no longer have access to view, edit, or interact with any data within the ${projectName} repository.
• Your past contribution history (if any) remains safely stored in the system in accordance with the team's documentation policy.

If you believe this access was removed by mistake, please contact the respective Project Admin for clarification.
Thank you for the contributions you made while part of this project.

Best regards,
The QA-Hub Team`
  };
};
