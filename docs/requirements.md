# Requirements Document

## Introduction

The Onboarding Project Builder is a web application that enables businesses to create structured onboarding experiences for new employees and team members. The core concept is AI-assisted co-development: an onboarding designer at the business guides an AI to shape the content, structure, and interactivity of the onboarding project. The resulting project is a rich, interactive experience that includes visual explanations, embedded code editors, and step-by-step guidance tailored to the company's workflows, tools, and culture.

## Glossary

- **Designer**: An employee or HR/L&D professional at a business who creates and manages onboarding projects.
- **Employee**: A new hire or team member at the business who consumes the onboarding project.
- **Onboarding_Project**: A structured, interactive document or experience created by a Designer for Employees.
- **AI_Assistant**: The AI co-development agent that helps the Designer build the Onboarding_Project through conversation.
- **Module**: A discrete section within an Onboarding_Project containing content, visuals, or code exercises.
- **Interactive_Visual**: An embedded, interactive diagram or animation within a Module that explains a concept.
- **Code_Editor**: An embedded code editing and execution environment within a Module.
- **Session**: An active co-development session between a Designer and the AI_Assistant.
- **Builder**: The application system responsible for managing Sessions, Onboarding_Projects, and their content.
- **Init Stage**: The first stage of project creation — scaffolds the project record, React page, and database entry.
- **Intro Stage**: The second stage — a structured questionnaire that collects business goals, baseline requirements, and examples, which are fed into the AI to generate an initial customized module layout.
- **Edit Stage**: The third and ongoing stage — the iterative workspace where the Designer adds, edits, and arranges text elements, visualizations, and code pads to produce the final learning module page.

---

## Three-Stage Designer Workflow

Every Onboarding_Project a Designer creates passes through three sequential stages before it becomes a publishable learning module.

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  INIT    │────▶│  INTRO   │────▶│  EDIT    │
│          │     │          │     │          │
│ Scaffold │     │ Question-│     │ Iterative│
│ project  │     │ naire +  │     │ module   │
│ + DB row │     │ AI seed  │     │ editing  │
└──────────┘     └──────────┘     └──────────┘
```

**Init** — The Designer names the project and triggers creation. The system scaffolds a React page, writes the project record to the database, and redirects to the Intro stage.

**Intro** — A guided questionnaire collects three inputs: (1) the business's onboarding goals, (2) baseline requirements (what every new employee must know), and (3) example content or reference material such as internal docs, SOPs, or tool guides. These answers are passed to the AI with a set of predefined rules to generate a first-draft module layout tailored to the business.

**Edit** — The Designer enters the iterative workspace. They can add, reorder, and refine text elements, interactive visualizations, and code pad tools through a combination of direct manipulation and AI-assisted chat. The output of this stage is a complete, publishable learning module page.

---

## Requirements

### Requirement 0: Three-Stage Project Creation Workflow

**User Story:** As a Designer at a business, I want to be guided through a structured creation process, so that my onboarding project is well-scoped and aligned with company goals before I start editing.

#### Acceptance Criteria

1. WHEN a Designer creates a new Onboarding_Project, THE Builder SHALL immediately enter the **Init** stage, creating a project record in the database and scaffolding a blank React page for the project.
2. AFTER the Init stage completes, THE Builder SHALL automatically advance the Designer to the **Intro** stage.
3. DURING the Intro stage, THE Builder SHALL present a questionnaire collecting: (a) business onboarding goals, (b) baseline requirements for new employees, and (c) example content or references such as internal documentation or tool guides.
4. WHEN the Designer submits the Intro questionnaire, THE Builder SHALL pass the answers to the AI_Assistant along with a set of predefined system rules to generate an initial module layout.
5. THE AI_Assistant SHALL return a first-draft set of Modules within 15 seconds of questionnaire submission.
6. AFTER the AI generates the initial layout, THE Builder SHALL advance the Designer to the **Edit** stage, pre-populated with the AI-generated modules.
7. DURING the Edit stage, THE Builder SHALL allow the Designer to iteratively add, modify, reorder, and delete Modules using both direct manipulation and AI-assisted chat.
8. THE Builder SHALL persist the current stage (`init` | `intro` | `edit`) on the Project record so that a Designer who leaves mid-flow can resume from where they left off.
9. THE Builder SHALL prevent a Designer from skipping the Intro stage — the Edit stage SHALL NOT be accessible until the Intro questionnaire has been submitted at least once.

---

### Requirement 1: Designer Account and Project Management

**User Story:** As a Designer at a business, I want to create and manage onboarding projects, so that I can organize onboarding experiences for different roles, departments, or hiring cohorts.

#### Acceptance Criteria

1. THE Builder SHALL allow a Designer to create a new Onboarding_Project with a title and description.
2. THE Builder SHALL allow a Designer to view a list of all Onboarding_Projects they have created.
3. THE Builder SHALL allow a Designer to open, edit, and delete any Onboarding_Project they own.
4. WHEN a Designer deletes an Onboarding_Project, THE Builder SHALL require explicit confirmation before permanently removing the project and all its Modules.
5. THE Builder SHALL allow a Designer to publish an Onboarding_Project, making it accessible to Employees via a shareable link.
6. WHEN an Onboarding_Project is published, THE Builder SHALL generate a unique, shareable URL for that project.

---

### Requirement 2: AI-Assisted Co-Development Session

**User Story:** As a Designer at a business, I want to guide an AI to help me build the onboarding project, so that I can create high-quality, company-specific content without doing everything manually.

#### Acceptance Criteria

1. WHEN a Designer opens an Onboarding_Project for editing, THE Builder SHALL initiate a Session with the AI_Assistant.
2. WHILE a Session is active, THE AI_Assistant SHALL accept natural language instructions from the Designer to add, modify, or remove Modules and their content.
3. WHEN the Designer provides an instruction, THE AI_Assistant SHALL respond with a proposed change to the Onboarding_Project within 10 seconds.
4. WHILE a Session is active, THE Builder SHALL display a real-time preview of the Onboarding_Project alongside the conversation interface.
5. WHEN the Designer approves a proposed change, THE Builder SHALL apply the change to the Onboarding_Project and update the preview immediately.
6. WHEN the Designer rejects a proposed change, THE AI_Assistant SHALL acknowledge the rejection and prompt the Designer for clarification or an alternative direction.
7. THE Builder SHALL maintain a revision history of all accepted changes within a Session, allowing the Designer to undo the most recent accepted change.

---

### Requirement 3: Module Creation and Management

**User Story:** As a Designer at a business, I want to structure the onboarding project into modules, so that new Employees can follow a clear, step-by-step learning path aligned with company processes.

#### Acceptance Criteria

1. THE Builder SHALL allow a Designer to add, reorder, and remove Modules within an Onboarding_Project.
2. WHEN a Module is added, THE Builder SHALL assign it a unique identifier and a default title that the Designer can rename.
3. THE Builder SHALL support the following Module content types: rich text, Interactive_Visual, and Code_Editor.
4. WHEN a Designer reorders Modules, THE Builder SHALL persist the new order and reflect it in the Employee-facing view.
5. IF a Designer attempts to remove a Module that contains unsaved content, THEN THE Builder SHALL warn the Designer before proceeding with removal.

---

### Requirement 4: Interactive Visuals

**User Story:** As a Designer at a business, I want to add interactive visuals to modules, so that new Employees can understand complex business processes, workflows, and system architectures through engaging diagrams.

#### Acceptance Criteria

1. THE Builder SHALL allow a Designer to add an Interactive_Visual to any Module.
2. WHEN adding an Interactive_Visual, THE AI_Assistant SHALL generate a visual based on a description provided by the Designer.
3. THE Builder SHALL support at least the following Interactive_Visual types: flowcharts, diagrams, and annotated step-by-step sequences.
4. WHEN an Employee views an Interactive_Visual, THE Builder SHALL allow the Employee to interact with it (e.g., hover for annotations, click to expand steps).
5. WHILE a Session is active, THE Builder SHALL allow the Designer to edit an existing Interactive_Visual by providing updated instructions to the AI_Assistant.
6. THE Builder SHALL render Interactive_Visuals in a format that is viewable on both desktop and mobile screen sizes.

---

### Requirement 5: Embedded Code Editor

**User Story:** As a Designer at a business, I want to embed code exercises in modules, so that new Employees in technical roles can practice writing code as part of their onboarding.

#### Acceptance Criteria

1. THE Builder SHALL allow a Designer to add a Code_Editor to any Module.
2. WHEN a Code_Editor is added, THE Builder SHALL allow the Designer to specify the programming language, starter code, and an optional expected output or solution.
3. THE Builder SHALL support at least the following programming languages in the Code_Editor: Python, JavaScript, and TypeScript.
4. WHEN an Employee submits code in a Code_Editor, THE Builder SHALL execute the code in an isolated sandbox environment and display the output within 15 seconds.
5. IF code execution in the sandbox exceeds 15 seconds, THEN THE Builder SHALL terminate the execution and display a timeout message to the Employee.
6. IF the Employee's code produces a runtime error, THEN THE Builder SHALL display the error message to the Employee without exposing internal system details.
7. WHERE an expected solution is configured by the Designer, THE Builder SHALL allow the Employee to reveal a hint or the solution after a failed attempt.

---

### Requirement 6: Employee Onboarding Experience

**User Story:** As a new Employee, I want to follow the onboarding project in a clear, guided way, so that I can learn about the company, its tools, and my role at my own pace.

#### Acceptance Criteria

1. WHEN an Employee accesses a published Onboarding_Project via its shareable URL, THE Builder SHALL display the project without requiring the Employee to create an account.
2. THE Builder SHALL present Modules to the Employee in the order defined by the Designer.
3. WHEN an Employee completes a Module, THE Builder SHALL allow the Employee to mark it as complete and navigate to the next Module.
4. THE Builder SHALL persist an Employee's progress (completed Modules) in the browser's local storage so that progress is retained across page refreshes.
5. WHILE an Employee is viewing an Onboarding_Project, THE Builder SHALL display a progress indicator showing how many Modules have been completed out of the total.

---

### Requirement 7: Content Persistence and Data Integrity

**User Story:** As a Designer at a business, I want my onboarding project to be saved reliably, so that I never lose company-critical content.

#### Acceptance Criteria

1. THE Builder SHALL automatically save changes to an Onboarding_Project within 5 seconds of the Designer accepting a proposed change.
2. WHEN a Designer explicitly triggers a save action, THE Builder SHALL confirm the save was successful with a visible notification.
3. IF an auto-save operation fails, THEN THE Builder SHALL notify the Designer of the failure and retain the unsaved changes in the current Session until a successful save occurs.
4. THE Builder SHALL store Onboarding_Project data in a persistent backend database, not solely in browser storage.
