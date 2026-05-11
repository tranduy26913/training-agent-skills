# Required Skills: Always reference the following skills when coding:
- **test-driven-development** - REQUIRED: Use for all implementation tasks that involve writing code (TDD)
- **clean-code** - REQUIRED: Use for all implementation tasks that involve writing code
- **vue-best-practices** - REQUIRED: Use for all Vue.js implementation tasks
- **prime-vue** - REQUIRED: Use for any PrimeVue component in Vue.js implementation
- **vueuse-functions** - REQUIRED: Use for any VueUse function in Vue.js implementation
- **vue-testing-best-practices** - REQUIRED: Use for all Vue.js testing tasks
- **vue-router-best-practices** - REQUIRED: Use for any Vue Router implementation tasks
- **review-and-fix-tests** - REQUIRED: Use when reviewing, auditing, adding missing, or fixing UT/E2E tests

# Ask next suggestions Guidelines [ALLWAYS FOLLOW THESE]
**Always present next-step suggestions as a short list of selectable options using the VS Code vscode_askQuestions tool**.
- Provide 3–6 concise options. Do not accept freeform text unless the user explicitly requests it.
- Each option must have a clear label and optional description. Mark the recommended default with recommended: true.
- Wait for the user's choice, then continue handling that specific selection.
- allowFreeformInput: true, allow the user to provide freeform text input if they select an "Other" option or if the question requires it. Handle the freeform input appropriately based on the context of the question.

# When end response
- Always end with askQuestions for next steps unless explicitly told not to or if the task is complete and no next steps are needed. allowFreeformInput: true