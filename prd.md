# **Product Requirement Document of QA-Hub**

1. # **Overview**

**QA-Hub** is a centralized Test Management & Orchestration Platform designed to bridge the gap between manual testing and artificial intelligence (AI)-driven automation.  
The system can be conceptualized as a complex area that houses multiple self-contained "warehouses" called Projects. Every user can create an account, build their own projects, or join other existing projects. Access to a project is strictly yet simply controlled using a two-role structure (Project Admin and Member) via a unique invitation system (Join Code).  
Within each project, QA-Hub provides a smart Test Repository that supports manual data entry, bulk CSV imports, and AI-powered automated scenario generation (RAG) capable of reading PRD documents (PDFs) and aligning them with existing test cases. The platform also serves as a Control Center to flexibly execute Test Runs, either by logging manual testing performed by engineers or by triggering regression automation robots directly from the UI. Furthermore, QA-Hub is equipped with advanced AI capabilities to perform auto-retry and self-healing (automated code repair) whenever automation scripts encounter a failure.

2. # **Objective**

1. **Streamlined Collaboration & Simple Access Management**   
   * Provide a flexible multi-project workspace where a single user can manage multiple projects simultaneously.  
   * Simplify team governance by limiting the hierarchy to just 2 roles (Admin & Member) without compromising security controls.  
2. **Centralization & Intelligence of the Test Repository**   
   * Help QA Engineers accelerate test scenario writing through an AI capable of dissecting PDF PRD documents, detecting the impact of changes on existing test cases, and filtering them through a Human Approval Gate.   
3. **Flexibility in Test Execution (Hybrid Execution)**   
   * Grant teams the freedom to curate specific testing scopes (Targeted Test Runs) without having to run the entire repository.  
   * Support hybrid execution within the same Test Run: instantly updating manual testing results and triggering automation test execution directly via a single dashboard button.  
4. **Pipeline Stability via AI Self-Healing & Auto-Retry**   
   * Ensure the stability of regression automation testing by automatically initiating auto-reruns when failures (flakiness) occur.  
   * Slash test code maintenance time by offloading error detection and the correction of failed automation scripts to the AI.  
5. **Effective Release Visibility**   
   * Provide a concise yet data-rich release performance reporting system to Google Chat Spaces or email, ensuring all stakeholders receive valid information as soon as the test cycle concludes. 

3. # **Target user**

* **QA Engineers (Manual & Automation):** Managing repositories, reviewing AI-generated test cases, conducting manual testing, triggering automation tests, uploading PRD documents (PDFs) for the AI to automatically extract into test scenarios, and leveraging AI self-healing features to repair failed scripts.  
* **QA Leads / Managers:** Acting as Project Admins (managing team "project" access), curating the scope of test cases into Test Runs, and hitting the Sign-Off ("Done") button for official release reports, uploading PRD documents (PDFs) for the AI to automatically extract into test scenarios.  
* **Product Owners (PO) / Project Managers (PM):** Monitoring product release readiness through concise notifications in Google Chat/email.

4. # **User Flow**

1. **Authentication & Project Management Stage**   
   The workflow for when users first log in and set up their workspace:  
* **Account Registration:** Users create a new account on the QA-Hub platform.  
* **Workspace Management (Project):** After logging in, users have the freedom to create a new project or join an existing one. A single user can own or be a member of multiple projects simultaneously.  
* **Member Removal Lifecycle:** Project Admins can revoke Member access at any time. To safeguard company test assets, test cases created by the removed Member are retained (data retention) while their creator field is set to null or reassigned.  
* **Team Collaboration (Invitation System):**  
  * The **Project Admin** (project creator) can generate and share a unique **Join Code** so other users can join. Join code will expire in 3 hours or when already used. Limits input errors to a maximum of 3 attempts, and enforces a 1-hour account lockout if this limit is exceeded.   
  * Admins have full authority to promote a Member's role status to Project Admin.  
  * Joined Members can only work within that specific project and do not have the access rights to change their own or anyone else's role to Admin.  
2. **Test Repository Management Stage (Test Case Management)**  
   The workflow for how test cases enter the system and are filtered before they are ready for use:  
* **Data Input (Three Paths):** Users add new test cases into the repository through three methods: manual form entry, bulk upload via CSV files, or automated generation by AI (AI-generated).  
* **PRD-Based AI Extraction (PDF):** For the AI path, users simply upload a technical specification document (PRD) in PDF format. The AI reads the document, extracts new test scenarios, and analyzes existing test cases in the repository to detect which legacy scenarios are impacted and need text updates.  
* **Review Gate (Draft State):** All newly imported test cases (whether from forms, CSV, or AI) are automatically locked into a **Draft** status. During this phase, the test cases cannot be added to an execution list (Test Run).  
* **User Approval (Ready State):** Users review the cases, edit the phrasing if anything is amiss, and click the "Submit" button. The test case status changes to **Ready** and is now good to go for testing.  
3. **Test Planning & Execution Stage (Test Run)**   
   The workflow for when the team wants to perform a testing cycle on a specific release:  
* **Scope Curation (Draft Test Run):** The user creates a new Test Run document (the initial status defaults to **Draft**). The user selects and includes specific test cases that are in a **Ready** status and relevant to the current feature release scope (eliminating the need to fetch the entire repository).  
* **Activating Execution:** Once the test case list is finalized, the user changes the Test Run status from Draft to **In Progress**. The execution buttons are now active.  
* **Hybrid Execution Path:**  
1. **Manual Testing:** Users perform tests manually on their applications, then manually update the test case status on the QA-Hub dashboard to **Passed** or **Failed**, adding notes as needed.  
2. **Automation Testing:** Users click the "Execute with Automation" button. QA-Hub triggers automation robots to run the test scripts corresponding to the automation flagging on those test cases. If the robot succeeds, the status automatically changes to **Passed**. If it fails, the status becomes **Failed**. Test cases without automation scripts remain in a **To-Do** status.  
4. **Auto-Retry, AI Self-Healing, & Final Notification Stage**   
   The workflow for handling automation failures up through reporting the final test results:  
* **Auto-Rerun & Retry:** If an automation robot detects a failure during execution, the system doesn't give up right away. QA-Hub automatically triggers an auto-rerun or attempts to re-execute the script.  
* **AI Script Repair (Self-Healing):** If the script still detects an error after retrying (e.g., due to code or DOM structure changes in the application), the AI detects the root cause and automatically repairs the broken automation script to get it running properly again.  
* **Automation Summary Notification (Type 1):** Right after the entire automation test suite finishes running (including retry and AI healing processes), the system sends a clean summary notification to Google Chat Spaces or email so the team can see the robot's initial performance.  
* **Official Closure & Sign-Off Notification (Type 2):** Once all manual testing has been filled out and verified by humans, the user clicks the "Done" button. The system officially closes the Test Run and sends a final **Official Sign-Off** release notification to Google Chat Spaces or email, confirming that the product's quality gate has been met and it is ready for release.

5. # **Functional Requirements**

1. **Authentication & Project Management**  
* **Account Registration & Login:** The system must facilitate users to create a new account and authenticate their login to the platform.  
* **Multi-Project Workspace:** The system must allow a single user to simultaneously create or join more than one project (one user, multiple projects).  
* **Brute-Force OTP Protection:** The system must restrict the invitation validation entry to a maximum of 3 failed attempts. Upon the 3rd invalid code submission, the user's account must be automatically locked (disabled) for exactly 1 hour.  
* **Member Access Eviction:** Project Admin retains full authority to revoke project workspace access from any Member at any given time.   
* **Collaboration System & Access Control (Two Roles):**  
1. **Project Admin:** The project creator automatically becomes an Admin. They have the right to add other users directly via email, generate a unique Join Code, and promote a Member to Admin. Project Admins can revoke Member access at any time. To safeguard company test assets, test cases created by the removed Member are retained (data retention) while their creator field is set to null or reassigned.   
2. **Member:** Can join a project via a Join Code. They have full rights for testing operations but cannot change their own or anyone else's role to Admin.  
2. **Test Repository Management**  
   * **Multi-Method Data Extraction:** The system must provide three paths for test case entry: manual form entry, bulk upload via CSV files, and artificial intelligence generation (AI-generated).  
   * **AI PRD Analysis & Impact Detection:** The system must be capable of extracting PRD documents (PDF) into new test scenarios, as well as analyzing which existing test cases are related to or impacted by the PRD to suggest content updates.  
   * Test Case Status Lifecycle (State Machine Gate):  
     1. DRAFT Status: All new test cases (manual, CSV, or AI) automatically default to DRAFT status. In this status, the test case is locked and cannot be added to a Test Run. Users can view, review, and edit during this phase.  
     2. READY Status: Changes to READY after the user clicks the "Submit" button. Only test cases with a READY status can be selected and added to a Test Run.  
   * **Automation Flagging:** Each test case must have a binary indicator (flag) showing whether the test case already has an automation script or not (hasAutomation \= true/false).  
   * **Author Data Retention:** In the event a Project Member is evicted or removed from the workspace, all Test Cases previously drafted or approved by said user must persist inside the project repository asset warehouse. The author metadata identifier will be safely decoupled (onDelete: SetNull) to secure company information assets.   
3. **Test Run Management & Execution**  
   * **Test Execution Scope Curation (Draft Test Run):** The system must allow users to create a new Test Run (initial status DRAFT) and specifically select a subset of READY test cases that are relevant to the current release scope.  
   * **Execution Activation (Status Mutation):** The system must facilitate changing the Test Run status from DRAFT to IN PROGRESS to unlock access to the execution buttons.  
   * **Hybrid Execution Engine:** Allows shared visibility based on real-time data via WebSockets (the screen automatically changes color if another QA engineer fills out data). However, when automation execution is triggered, the Test Run status mutates into an internal status of AUTOMATION\_RUNNING. This status automatically disables manual manipulation buttons on other users' screens to prevent data conflicts.   
     1. Manual Execution: The system must provide buttons for users to manually change the test status to PASSED or FAILED, along with a notes field.  
     2. Automation Execution: The system must provide an "Execute with Automation" button to trigger the execution of automation scripts for test cases that have an active automation flag.  
* **Automated Status Updates:** The system must automatically change the test status to PASSED (if the script succeeds) or FAILED (if the script fails) based on feedback from the automation robot. Test cases without an automation script will remain in TO-DO status.  
* **Execution Mutex Lock & State Concurrency:** When a user triggers automated testing via the "Execute with Automation" button, the Test Run status must atomically mutate into an internal state: `AUTOMATION_RUNNING`. During this active automated session, modification capabilities and manual execution inputs for all other connected workspace members must be structurally locked via reactive WebSockets communication to prevent data race conditions.    
4. **Auto-Retry & AI Self-Healing**  
* **Automated Auto-Rerun/Retry:** If the testing robot detects a failure, the system must automatically trigger a re-execution (rerun/retry) of the script to prevent failures caused by temporary network issues or latency (flakiness).  
* **AI Script Repair (Self-Healing):** If the script consistently detects errors after retries, the AI must locate the failure (such as changes in HTML/DOM structure) and autonomously repair the broken lines of code in the automation script.    
5. **Concise Notification Subsystem**  
   * **Automation Summary Notification:** The system must send exactly one summary report message to Google Chat Spaces or email after the entire automation test suite finishes executing (rather than sending an alert for each individual failed item).  
   * **Official Closure / Sign-Off Notification:** The system must trigger a final notification to Google Chat Spaces or email immediately when a user clicks the "Done" button to close a Test Run file.

6. # **Technical Specification**

   For programming languages, I prefer using Typescripts.

1. ## **Frontend**

   Built using [React.js](http://React.js) and Tailwind CSS. For other stacks, like deployment or others, I don't have any specific requirements. Just make sure the tech stack is free and capable of handling large amounts of testing and storage.

2. ## **Backend**

* Utilizes NestJS (Node.js) deployed on Render or Railway. To mitigate the spin-down behavior (where the server automatically goes to sleep after 15 minutes of inactivity on Render's free tier), the backend is equipped with an internal Cron Ping component that pings the /api/health endpoint every 10 minutes. But if you have other references I’m open.  
* **Real-time Dashboard Update:** Execution statuses from active automation runs in GitHub Actions are piped back to the QA-Hub backend using Webhooks. The backend then pushes these live status updates directly to the user's browser interface in real time via WebSockets ([Socket.io](http://Socket.io)).  
* **Google Chat Integration:** Integration with Google Chat relies on Incoming Webhooks.  
1. **For Notifications (Automation Completed):** The backend acts as an accumulator. Once it receives completion webhooks from all active automation jobs, it compiles a single combined JSON payload formatted as a Google Chat **Card V2**, complete with a summary chart of passed/failed items.  
2. **For Notifications (Test Run Done):** A manual button click on the UI triggers the backend to dispatch a rich text message, officially declaring the closure of the release quality gate.

3. ## **Database**

* Using PostgreSQL, but if you have suggestions more suitable with this system you can implement. Just make sure the tech stack is free and capable of handling large amounts of testing and storage.  
* Selects Supabase Vector (pgvector) as the storage for AI data embeddings (free, built into PostgreSQL) and Cloudflare R2 (free storage up to 10 GB) as a secure hosting repository for office PDF PRD documents with zero data transfer (egress) fees.   
* Here are the Prisma ORM Entities, representing the essential data relations required to maintain the integrity of the DRAFT-to-READY status transitions and role-based access control (role management). Please adjust them to fit your specific system architecture if you spot anything that looks amiss.  
  enum Role {  
    ADMIN\_PROJECT  
    MEMBER  
  }  
    
  enum CaseStatus {  
    DRAFT  
    READY  
  }  
    
  enum RunStatus {  
    DRAFT  
    IN\_PROGRESS  
    AUTOMATION\_RUNNING  
    DONE  
  }  
    
  enum ExecutionStatus {  
    TO\_DO  
    PASSED  
    FAILED  
  }  
    
  model User {  
    id            String          @id @default(uuid())  
    email         String          @unique  
    password      String            
    name          String  
    attempts      Int             @default(0)        
    disabledUntil DateTime?                          
    createdAt     DateTime        @default(now())  
    projects      ProjectMember\[\]  
    testCases     TestCase\[\]        
  }  
    
  model Project {  
    id          String              @id @default(uuid())  
    name        String  
    createdAt   DateTime            @default(now())  
    members     ProjectMember\[\]  
    invitations ProjectInvitation\[\]  
    testCases   TestCase\[\]  
    testRuns    TestRun\[\]  
  }  
    
  model ProjectMember {  
    id        String   @id @default(uuid())  
    projectId String  
    project   Project  @relation(fields: \[projectId\], references: \[id\], onDelete: Cascade)  
    userId    String  
    user      User     @relation(fields: \[userId\], references: \[id\], onDelete: Cascade)  
    role      Role     @default(MEMBER)  
    
    @@unique(\[projectId, userId\])  
  }  
    
  model ProjectInvitation {  
    id        String   @id @default(uuid())  
    projectId String  
    project   Project  @relation(fields: \[projectId\], references: \[id\], onDelete: Cascade)  
    email     String      
    joinCode  String   @unique  
    isUsed    Boolean  @default(false)  
    createdAt DateTime @default(now())  
    expiredAt DateTime  
  }  
    
  model TestCase {  
    id             String          @id @default(uuid())  
    projectId      String  
    project        Project         @relation(fields: \[projectId\], references: \[id\], onDelete: Cascade)  
    title          String  
    steps          Json              
    hasAutomation  Boolean         @default(false)  
    status         CaseStatus      @default(DRAFT)  
    createdById    String?          
    createdBy      User?           @relation(fields: \[createdById\], references: \[id\], onDelete: SetNull)  
    createdAt      DateTime        @default(now())  
    testRunItems   TestRunItem\[\]  
    
    @@index(\[projectId, status\])  
  }  
    
  model TestRun {  
    id          String        @id @default(uuid())  
    projectId   String  
    project     Project       @relation(fields: \[projectId\], references: \[id\], onDelete: Cascade)  
    name        String  
    status      RunStatus     @default(DRAFT)  
    createdAt   DateTime      @default(now())  
    items       TestRunItem\[\]  
  }  
    
  model TestRunItem {  
    id              String          @id @default(uuid())  
    testRunId       String  
    testRun         TestRun         @relation(fields: \[testRunId\], references: \[id\], onDelete: Cascade)  
    testCaseId      String  
    testCase        TestCase        @relation(fields: \[testCaseId\], references: \[id\], onDelete: Cascade)  
    executionStatus ExecutionStatus @default(TO\_DO)  
    retryCount      Int             @default(0)  
    notes           String?  
    updatedAt       DateTime        @updatedAt  
    
    @@unique(\[testRunId, testCaseId\])  
  }


4. ## **AI**

   * Leverages GitHub Actions CI/CD (Free 2,000 minutes/month). The heavy computational load required to run headless browsers (I use Playwright) is shifted entirely to GitHub Actions, ensuring the core backend server remains lightweight and responsive.  
     * Selects Supabase Vector (pgvector) as the storage for AI data embeddings (free, built into PostgreSQL) and Cloudflare R2 (free storage up to 10 GB) as a secure hosting repository for office PDF PRD documents with zero data transfer (egress) fees.   
     * **AI PRD Extraction:** Uploaded PDF files are converted into plain text using the pdf-parse library. This text is then passed to an LLM using a RAG (Retrieval-Augmented Generation) approach. The LLM is instructed with a strict JSON schema to generate new test case structures and compare them against vector embeddings of legacy test cases to detect functional impacts.  
     * **AI Self-Healing Engine:** When a GitHub Actions runner detects a test script failure (for example, TimeoutError: waiting for locator('button\#submit')), a specialized script captures:  
* The error stack trace.  
* A screenshot of the page at the exact moment of failure.  
* The extracted HTML DOM layout of that page.

  This payload is sent to the LLM API with the prompt: *"Find the closest semantically matching element and provide the corrected code snippet."* The fix is then applied directly to the test script file inside the GitHub Actions workspace using Git automation (either by committing directly or automatically opening a fix-it Pull Request).

7. # **QA-Hub Architecture**

1. **Architectural Strategy & Compliance**   
   To fully adhere to enterprise security compliance, intellectual property (IP) rights, and data authority guidelines, the QA-Hub ecosystem enforces a strict \*\*Decoupled Repository Pattern\*\*. Under this governance model, the codebase is structurally isolated into two completely independent, non-overlapping environments:   
1. QA-Hub Core Dashboard (\`qa-hub-core\`): Maintained on a personal remote repository (e.g., GitHub). This repository contains only the generic web interface (Next.js/React) and core processing services (NestJS backend server). It contains zero enterprise source code, zero internal company credentials, and zero proprietary configurations.  
2. Enterprise Automation Script (\`erpnext-playwright-automation\`):\*\* Maintained exclusively inside the company’s secure private network repository (e.g., Bitbucket). This repository stores proprietary Playwright TypeScript test scripts tailored specifically for the ERPNext Frappe system, system environment keys, and deployment runner orchestration instructions.   
2. **Asynchronous Cross-Platform Integration Workflow**   
   Communication between the decoupled personal dashboard and the internal corporate pipeline runs over a secure, authenticated webhook telemetry layer. No internal code or database schema is exposed outside the company network.   
   \+----------------------+         +----------------------+   
   | QA-HUB DASHBOARD |         | ENTERPRISE PRIVATE WORKER |   
   | (Vercel / Render Server)|         | (Bitbucket Pipelines) |   
   \+----------------------+         \+----------------------+   
   |                      |         |                      |  
    1\. Trigger Run Action (REST API API Call) | \+----------------->|  
   |                                         | 2\. Execution Run   
   |                                         | (Headless Test Suite)   
   |                                         | \- Target: ERPNext   
   |                                         | \- Env: Private Network  
   | 3\. Stream Telemetry Signal (JSON Webhook Outcome) | |\<-----------------+   
   | e.g., {"testCaseId": "tc-102", "status": "PASSED"}   
   |   
   v (WebSockets Fluid Push)  
   \[Live UI Status Render\]   
3. **Step-by-Step Execution Sequence**   
1. Inbound Execution Trigger:When a QA engineer clicks the "Execute with Automation" button inside the QA-Hub web interface, the backend server compiles the selected Test Case IDs and dispatches an authenticated REST API request to the corporate \*\*Bitbucket Pipeline API\*\*. This request is secured via enterprise-scoped App Passwords or temporary OAuth access keys.  
2. Isolated Container Execution: Bitbucket Pipelines catches the trigger payload and spawns an ephemeral, sandboxed runner environment inside the company's secure boundary. The runner pulls the proprietary Playwright TypeScript script, establishes credentials securely, and drives headless automated actions directly against the target ERPNext instance.   
3. Metadata Telemetry Streaming: To prevent analytical bloat or sensitive variable data leaks, the automated script intercepts target telemetry. Upon settling each test case state (via Playwright's \`test.afterEach\` hooks), the worker pushes a lean HTTP POST payload back to the QA-Hub API gateway. Secure Payload Payload Sample:\* \`{"testCaseId": "tc-102", "status": "PASSED"}\`.  
4. Real-Time Hydration: The QA-Hub core ingests the minimal JSON telemetry map, validates origin integrity, and continuously pushes updates to the client interface via stateful \*\*WebSockets\*\* (\`socket.io\`). Individual test case grid segments change color reactively without requesting structural page refreshes.   
4. **Core Structural Security Guardrails**  
* Zero Intellectual Property Mix: The core application (\`qa-hub-core\`) acts solely as a display dashboard framework and does not host or retain company code logic or test artifacts.  
* Token Bound Security: Access to trigger corporate pipelines requires explicit secret environment tokens stored safely in backend deployment layers, blocking any unsanctioned invocation.   
* Data Privacy Protection: The payload flowing from the enterprise runner back to the dashboard personal instance is strictly restricted to abstract validation tags and outcome metrics (\`PASSED\`/\`FAILED\`), ensuring company information assets remain 100% inside private company walls.   
5. **How to Implement**   
* In the QA-Hub Repo (GitHub): Add an API Router module in NestJS (e.g., src/automation-trigger/) whose job is to send a cURL API payload to your office's Bitbucket instance to trigger the pipelines.  
* In the Playwright Repo (Office Bitbucket): Inside the playwright.config.ts file, set up a globalTeardown or a test.afterEach hook that uses the axios library or Node.js native fetch to ping back your QA-Hub API URL every time a test completes.

8. # **Design guideline**

1. **Create an eye-catching QA-Hub logo that aligns with the brand style**  
2. **Brand color palette (elegant tech palette)**  
* Primary Colors (Brand Identity)  
  * **Deep Action Blue (\#0F62FE) – Primary Accent**  
    * *Philosophy:* Symbolizes technical precision, reliability, and the stability of a mission control system.  
    * *Usage:* Applied to primary interactive components such as critical action buttons ("Execute Run", "Submit"), active navigation icons, and core statuses.  
  * **Obsidian Slate (\#161616 & \#1C1C21) – The Core Surface**  
    * *Philosophy:* A dark obsidian rock hue that conveys a solid, premium, and highly elegant look.  
    * *Usage:* Serves as the primary background color (surface) for Dark Mode and navigation panels to reduce QA engineer eye fatigue.  
* Artificial Intelligence Tone (AI Aura)  
  * **Deep Royal Purple (\#8A3FFC) – AI Insights**  
    * *Philosophy:* Purple represents wisdom, mystery, and artificial intelligence. A Royal Purple variant was chosen to make it eye-catching, serving as a distinct differentiator from standard operational blue.  
    * *Usage:* Reserved exclusively for components generated or influenced by AI (e.g., the "Generate via AI" button, dashed borders on PRD-based DRAFT files, and AI Self-Healing indicators).  
* Semantic Colors (Test Health Status)

  Status colors use a slightly desaturated scheme to remain elegant and integrate seamlessly with the minimalist theme:

* **Emerald Green (\#198038):** For **PASSED** status. A calm, professional green rather than a piercing neon green.  
* **Ruby Red (\#DA1E28):** For **FAILED** status. A sharp, definitive red that provides a clear error signal without disrupting the page's aesthetic.  
* **Amber Gold (\#F1C21B):** For warning states or active retries.  
3. **Typography**  
   The QA-Hub typography system clearly separates narrative/interface text from technical testing data:   
* Primary Interface Font: Inter or SF Pro Display (Sans-Serif)   
  * *Characteristics:* Clean, highly legible at small sizes, and modern.  
  * *Usage:* Applied to navigation menus, project/warehouse titles, menu labels, form inputs, and button copy.  
* Technical Data Font: JetBrains Mono or Fira Code (Monospace)   
  * *Characteristics:* Fixed-width characters that deliver a crisp, structured "source code" feel.  
  * *Usage:* Mandated for text inside status badges/pills (such as DRAFT, READY, PASSED), unique Join Codes, test steps, and AI error log panels.  
4. **Layout & Visual Elements (UI Elements)**  
   In line with corporate minimalism principles, we eliminate all unnecessary embellishments (such as heavy drop shadows or multicolored decorations) and replace them with sharp, clean structural lines.  
* Borders Over Shadows:

  Separation between sections (for instance, between the test case list and the right-side Cart panel) does not rely on drop shadows. Instead, it uses a thin, 1px border colored in a **Muted Outline** (dim gray). This keeps the application layout looking exceptionally crisp and sleek. 

* Corner Smoothness (Corner Radius): 

  All menu boxes, form inputs, and buttons utilize a soft, subtle curved corner of **4px** (rounded-sm or rounded-md). Avoid sharp corners (0px) to keep it from looking too rigid, and avoid overly rounded corners (rounded-full) so it doesn't look like a casual or toy application. 

* Capsule Status Badges (Pill Shapes): 

  Test statuses specifically feature a capsule shape (pill shape) with a fully rounded radius at the edges. To ensure an accessibility-compliant design for colorblind users, the left side of the status text must include a small circular dot that matches its semantic color (e.g., a green dot for PASSED). 


5. **Design Behaviour & State Transitions**  
   The QA-Hub interface is highly responsive to updates in user data states (state-driven UI):  
* AI Glow Effect: When the AI is actively working on extracting a PDF PRD or performing self-healing, the component will project a soft purple luminescence (inner-glow or a subtle pulse effect utilizing \#8A3FFC) to elegantly draw the user's attention.  
* Zebra Row Pulse during Test Runs: The row of a test case currently being executed by automation will feature an incredibly subtle pulsing animation on its left border using the Action Blue token. This provides live execution feedback without breaking the focus of a user reading other lines.  
* Definitive Disabled State: When a Test Run status shifts to "In Progress" and “AUTOMATION\_RUNNING” and the Concurrency Lock becomes active, all modification buttons and drag-and-drop handles will switch to a muted gray with 40% opacity, giving users an absolute visual cue that the section is currently locked.