# Documents Store

**ALWAYS consider the below instructions in every task with main consideration**
Instructions coming from the task description have higher priority than this file.

## Backend project guidelines
- the project is structured in vertical architecture.
- [modules folder](../backend/src/modules) contains all modules, which are mapped to specific features.
- make sure swagger documentation is up to date with every change.
- when generating error messages or user messages, you must follow project setup to handle localization.
- make sure you do proper logging with every change.
- logging mustn't disclose any sensitive data.
- you must update tests for every change.
- Environement variables must be defined and used from src/config.
- Make sure to not use deperacted API from used libraries.
- Never generate demo data within written code, unless explicitly requested. 
