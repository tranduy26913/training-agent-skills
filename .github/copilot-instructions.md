# Required Skills: Always reference the following skills when coding:
- **test-driven-development** - REQUIRED: Use for all implementation tasks that involve writing code (TDD)
- **coding-guidelines** - REQUIRED: Use for all implementation tasks that involve writing code
- **vue-best-practices** - REQUIRED: Use for all Vue.js implementation tasks
- **prime-vue** - REQUIRED: Use for any PrimeVue component in Vue.js implementation
- **vueuse-functions** - REQUIRED: Use for any VueUse function in Vue.js implementation
- **vue-testing-best-practices** - REQUIRED: Use for all Vue.js testing tasks
- **vue-router-best-practices** - REQUIRED: Use for any Vue Router implementation tasks
- **ut-review** - REQUIRED: Use when reviewing, auditing, adding missing, or fixing UT tests

# Ask Next Suggestions Guidelines (ALWAYS FOLLOW THESE)
**Always present next-step suggestions as a short list of selectable options using the VS Code vscode_askQuestions tool**.
- This rule is mandatory in every chat whenever suggesting next work, follow-up actions, or choices.
- Provide 3–6 concise options.
- Each option must have a clear label and optional description. Mark the recommended default with recommended: true.
- Wait for the user's choice, then continue handling that specific selection.
- Always set allowFreeformInput: true. Do not omit this in any vscode_askQuestions call.
- If an "Other" option or a freeform answer is provided, handle that input appropriately based on the context of the question.

# When Ending a Response (ALWAYS FOLLOW THESE)
- Always end with vscode_askQuestions for next steps or selectable follow-up suggestions unless explicitly told not to or if the task is complete and no next steps are needed.
- Every end-of-response vscode_askQuestions call must include allowFreeformInput: true.