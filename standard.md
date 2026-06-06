# **Testing Process Standard**

## **Test Coverage & Strategy**

When I describe a feature, user story, or system change, proactively:

1. Identify risk areas — what could break, edge cases, integration points  
2. Suggest a coverage matrix — unit, integration, E2E, and exploratory buckets  
3. Separate web vs. mobile vs. API test considerations where relevant  
4. Flag coverage gaps if requirements seem incomplete  
5. Recommend priority — what to automate vs. test manually and why

Default to a risk-based approach: not everything needs full automation. Help me think about ROI of coverage.

## **Documentation & Reporting**

# **Test Plan Format**

When creating a test plan, always follow this structure:  
Header Information | Field | Description | |---|---| | Project | Name of the project (e.g., Procurement Tool) | | Feature Team | The team responsible for the feature | | Release Version | Version being tested | | Prepared By | Name of the person who created the test plan | | Test Plan Creation Date | Date the test plan was created |

* **Test Scope** A brief description of the feature or module being tested (e.g., "Pharmacy", "Checkout Flow"). State what is in scope clearly and concisely.  
* **Test Charters** List the test case documents or exploratory charters linked to this test plan. Reference the specific test case files or Jira links (e.g., "Search Landing Page Test Case").  
* **Risks** Document known risks that may affect testing or the feature. Break down by platform where relevant (e.g., Android System Navigation vs. iOS In-App Navigation). Use bullet points per risk area.

Example:

* In-App Navigation (Android & iOS): keyboard behavior on back navigation  
* Android System Navigation & Gesture: first back action closes keyboard, second navigates back

**Regression Plan** A table listing the areas to regression test, structured as:

| Application | Module | Details |
| :---- | :---- | :---- |
| Pharmacy | General Search | Search Landing Page, Search Campaign, Recently Searched |
| Smoke Test | Automation | ID Credit Dashboard, ID Credit Pharmacy |
| Smoke Test | Android | v9.9.0, v9.11.0, v9.10.1 |
| Smoke Test | iOS | v9.9.0, v9.10.1, v9.11.0 |

**General Considerations** Any additional notes, references, or external links relevant to the test plan (e.g., related Jira tickets, known behavior documentation, dependencies).  
**App Versions** List the application components and their versions being tested:

* ERP v1.45.0

For stakeholder updates, keep it concise: current status, key metrics (pass rate, defect density, coverage %), blockers, and one recommended action.

## **Test Case & Scenario Writing**

Use a domain-based test scenario format for all test cases. Structure every test case as follows:

* ID: TC-Module-AutoIncrement  
* Case Title: Regular Order  
* Prerequisites and setup steps the tester must complete before executing the test steps. This includes environment setup, test data preparation, login state, navigation to the correct starting point, and any dependent configurations.  
* Priority: Low, Medium, High (define apa aja yang masuk kriteria ini)  
* Test Steps — the sequential actions the tester performs during the test, written clearly and unambiguously.  
* Expected Results — the expected outcome for each test step or for the overall scenario.  
* Automated flag (true / false)

Example format:

* Always include negative/edge case scenario per domain area.  
* For API test scenarios, the Test Suite should include authentication setup and environment/base URL configuration; Test Steps should cover the request method, endpoint, and payload; Expected Results should specify response code and key response body assertions.  
* For mobile scenarios, note platform-specific behavior (iOS vs Android) in the Test Suite or as a separate scenario variant.