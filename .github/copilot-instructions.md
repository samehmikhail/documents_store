# Documents Store

**ALWAYS follow these instructions first and fallback to additional search and context gathering only if the information here is incomplete or found to be in error.**

## Current State

**CRITICAL**: This repository is currently in its initial state with minimal content. As of the last update, it contains:
- README.md (basic project title only: "# documents_store")
- .gitignore (excluding .DS_Store files)
- .github/copilot-instructions.md (this file)
- No source code, build configurations, or CI/CD pipelines

**Context**: These instructions were created as a framework based on GitHub issue requirements to provide copilot coding agents with guidance on how to work in this codebase. Since no actual codebase exists yet, these instructions serve as a template that MUST be updated as development progresses.

## Working Effectively

### Initial Setup
Since this repository is currently minimal, the following steps represent the expected workflow once development begins:

- Clone the repository: `git clone <repository-url>`
- Check for any new development setup instructions in README.md
- **ALWAYS** validate that any commands listed below still work before following them
- **UPDATE THESE INSTRUCTIONS** as the codebase evolves

### Expected Development Workflow (To be updated as code is added)
**NOTE**: These commands have not been validated yet as no build system exists. Validate each command before use.

1. **Environment Setup** (update when determined):
   - Install required dependencies (TBD based on chosen technology stack)
   - Set up development environment
   - Configure any required services or databases

2. **Building** (update when build system is added):
   - Build command: `TBD` -- NEVER CANCEL. Set timeout to 60+ minutes once build system is implemented.
   - Expected build time: TBD (measure and document actual times)

3. **Testing** (update when test framework is added):
   - Test command: `TBD` -- NEVER CANCEL. Set timeout to 30+ minutes.  
   - Expected test time: TBD (measure and document actual times)

4. **Running** (update when application is implemented):
   - Development server: `TBD`
   - Production build: `TBD`

## Validation Requirements

**CRITICAL**: Once code is added to this repository, these instructions MUST be updated with:

1. **Validated Commands**: Every command listed must be tested and confirmed working
2. **Timing Information**: Document actual time taken for builds, tests, and long-running operations
3. **Manual Testing Scenarios**: Define specific user workflows to validate after changes
4. **Timeout Values**: Include explicit timeout recommendations for all operations >2 minutes

### Manual Validation Checklist (To be expanded)
When making changes to the codebase (once it exists):
- [ ] Run complete build process
- [ ] Execute full test suite
- [ ] Perform end-to-end testing scenarios
- [ ] Validate deployment/packaging process if applicable

## Technology Stack

**To be determined and documented once development begins**

Based on the repository name "documents_store", this may become:
- A document management system
- A file storage API
- A database for document metadata
- A web application for document organization

**ACTION REQUIRED**: Update this section with:
- Programming language(s) chosen
- Framework(s) selected
- Database technology (if applicable)
- Deployment target
- Dependencies and their versions

## Repository Structure (To be updated as code is added)

```
documents_store/
├── README.md
├── .gitignore
└── .github/
    └── copilot-instructions.md (this file)
```

## Common Tasks

### Contributing to These Instructions
**MANDATORY**: As the codebase develops, these instructions MUST be kept current:

1. **Before adding any new technology or build step**:
   - Test all commands thoroughly
   - Measure execution times
   - Document any special requirements or limitations
   - Update the validation scenarios

2. **Required Information for Each New Component**:
   - Exact installation commands with versions
   - Complete build commands with timeout recommendations  
   - Test execution commands and expected duration
   - Runtime/server startup commands
   - Manual validation steps specific to that component

3. **Formatting Requirements**:
   - Use imperative tone: "Run [command]", "Do not do [action]"
   - Include explicit "NEVER CANCEL" warnings for long operations
   - Provide actual timing measurements, not estimates
   - Document workarounds for any known issues

### Next Steps for Repository Development

**For the next developer working on this repository**:

1. **Define the project scope** and update README.md with project description
2. **Choose technology stack** and update these instructions accordingly
3. **Set up initial project structure** (src/, tests/, docs/, etc.)
4. **Implement CI/CD pipeline** and document the workflow
5. **Create initial build and test setup**
6. **Validate ALL commands** in these instructions and update with real measurements
7. **Define manual validation scenarios** specific to the documents_store functionality

### Critical Reminders

- **NEVER CANCEL builds or tests** - wait for completion and measure actual times
- **VALIDATE EVERY COMMAND** before documenting it
- **UPDATE THESE INSTRUCTIONS** whenever the development workflow changes
- **INCLUDE EXPLICIT TIMEOUT VALUES** for any operation taking >2 minutes
- **DOCUMENT WORKAROUNDS** for any commands that don't work as expected

---

**Last Updated**: Initial creation - no codebase exists yet  
**Validation Status**: ⚠️ Not validated - no codebase exists yet  
**Next Review**: After initial code implementation

## Immediate Action Items

**For the next GitHub Copilot coding agent working on this repository:**

1. **First Priority**: Determine what type of documents store this will be:
   - Document management web application?
   - File storage API service?
   - Database system for document metadata?
   - Desktop application for document organization?

2. **Technology Stack Decision**: Choose and document:
   - Programming language (Python, JavaScript/Node.js, Java, Go, etc.)
   - Framework (if applicable)
   - Database system (if needed)
   - Testing framework
   - Build/package system

3. **Critical**: Once ANY code is added:
   - **IMMEDIATELY** update these instructions with validated commands
   - **MEASURE** actual build and test times
   - **TEST** all documented commands before relying on them
   - **DOCUMENT** any installation or setup requirements

4. **Repository Standards**: Implement basic development standards:
   - Add proper README.md with project description
   - Set up CI/CD pipeline (.github/workflows/)
   - Add linting and code quality checks
   - Create basic project structure (src/, tests/, docs/)

Remember: These instructions are a template until real code exists. **Do not assume any command will work until you have validated it yourself.**