---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session
---

# Executing Plans

## Overview
Load plan, review critically, execute all tasks, report when complete.
When a plan contains 2 or more executable tasks, coordinate execution in parallel with subagents whenever the tasks are independent enough to run concurrently.
If the plan contains only 1 task, parallel subagents are not required.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

**Required skills:** Allways reference the following skills when executing plans:
- **test-driven-development** - REQUIRED: Use for all implementation tasks that involve writing code (TDD)
- **coding-guidelines** - REQUIRED: Use for all implementation tasks that involve writing code
- **vue-best-practices** - REQUIRED: Use for all Vue.js implementation tasks
- **prime-vue** - REQUIRED: Use for any PrimeVue component in Vue.js implementation
- **vueuse-functions** - REQUIRED: Use for any VueUse function in Vue.js implementation
- **vue-testing-best-practices** - REQUIRED: Use for all Vue.js testing tasks
- **vue-router-best-practices** - REQUIRED: Use for any Vue Router implementation tasks

## The Process

### Step 1: Load and Review Plan
1. Read plan file
2. Review critically - identify any questions or concerns about the plan
3. If concerns: Raise them with your human partner before starting
4. If no concerns: Create TodoWrite and proceed

### Step 2: Execute Tasks
**Parallel subagents are mandatory when the plan has multiple executable tasks.**

Execution rules:
1. Count the plan tasks before starting implementation.
2. If the plan has only 1 task, execute it directly without spawning subagents unless the user explicitly asks for subagent execution.
3. If the plan has 2 or more tasks, you MUST assign the implementation work to subagents in parallel wherever task dependencies allow.
4. Group only strictly dependent tasks into the same execution lane. Do not serialize unrelated tasks.
5. Keep the parent agent responsible for coordination, status tracking, integration decisions, and final verification.

For each task or task lane:
1. Mark as in_progress
2. Dispatch the task to a subagent when parallel execution is required
3. Follow each step exactly (plan has bite-sized steps)
4. Run verifications as specified
5. Mark as completed


## When use tool [vscode_askQuestions]
- Always present next-step suggestions as a short list of selectable options using the VS Code vscode_askQuestions tool.
- Provide 3–6 concise options. Do not accept freeform text unless the user explicitly requests it.
- Each option must have a clear label and optional description. Mark the recommended default with recommended: true.
- Wait for the user's choice, then continue handling that specific selection.
- allowFreeformInput: true, allow the user to provide freeform text input if they select an "Other" option or if the question requires it. Handle the freeform input appropriately based on the context of the question.

## When to Stop and Ask for Help
**STOP executing immediately when:**
- Hit a blocker (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- You don't understand an instruction
- Verification fails repeatedly

**Ask for clarification rather than guessing.**
- Always use tool vscode_askQuestions to ask for help.

## When have next-step suggestions
**If you have a next-step suggestion for the user, use tool vscode_askQuestions:**

## When to Revisit Earlier Steps

**Return to Review (Step 1) when:**
- Partner updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** - stop and ask.

## Remember
- Review plan critically first
- Follow plan steps exactly
- Don't skip verifications
- Reference skills when plan says to
- If the plan has multiple tasks, parallel subagent execution is the default and required mode
- If the plan has only one task, direct execution is acceptable
- Stop when blocked, don't guess
- Never start implementation on main/master branch without explicit user consent
