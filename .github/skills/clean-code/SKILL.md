---
name: clean-code
description: Use when you want to write code that is easy to read, maintain, and extend
---

## I. NAMING CONVENTIONS

### 1. Use Meaningful Names
- Names must be clear and reveal intent
- Avoid unclear abbreviations
- Use English consistently across the project
- Variables should be nouns: `userName`, `isActive`
- Functions should be verbs: `getUserList()`, `calculateTotal()`, `isValidEmail()`

### 2. Type-Based Naming
**Boolean:** `isActive`, `isLoading`, `hasPermission`, `canDelete`, `shouldUpdate`
**Array/Collection:** `users`, `userList`, `userItems`
**Number/Count:** `count`, `total`, `index`, `score`, `timeout`

### 3. Extract Magic Numbers & Strings
Use named constants instead of hardcoded values:
```
const MAX_USERS = 100;
const ADMIN_ROLE = 'admin';
const SESSION_TIMEOUT_MS = 30000;
```

---

## II. FUNCTIONS & METHODS

### 1. Single Responsibility Principle (SRP)
A function should do one thing and do it well. A function doing multiple things should be broken down.

### 2. Function Length
- Keep functions small (ideally under 20-30 lines)
- Maximum 1-3 levels of indentation
- If longer, extract into smaller functions

### 3. Function Parameters
- Limit to 3-4 parameters maximum
- If more needed, use object/DTO:
  ```
  function createUser(userDto: CreateUserDTO)
  ```
- Place default parameters at the end

### 4. Function Names
Be descriptive about what the function does:
- `getUserById(userId)` ✅
- `calculateDiscountPrice(originalPrice, discountPercent)` ✅
- `handle(input)` ❌
- `process(data)` ❌

### 5. Avoid Unintended Side Effects
Functions should be pure when possible - not modify external state:
```
// ❌ BAD - modifies global state
let cache = [];
function addUser(user) {
  cache.push(user);
  return cache;
}

// ✅ GOOD - pure function
function addUser(users: User[], newUser: User): User[] {
  return [...users, newUser];
}
```

---

## III. VARIABLES & SCOPE

### 1. Narrow Scope
- Use `const` by default, `let` when reassignment is needed, never `var`
- Declare variables close to where they're used
- Avoid global variables

### 2. Minimize Reassignments
- Avoid reassigning variables multiple times
- Chain operations: `const result = data.filter(...).map(...)`

### 3. Limit Object Mutation
Prefer creating new objects over mutating existing ones:
```
// ❌ BAD
function updateUser(user) {
  user.name = 'Name';
  return user;
}

// ✅ GOOD  
function updateUser(user, updates) {
  return { ...user, ...updates };
}
```

---

## IV. CONDITIONALS & LOOPS

### 1. Simplify Complex Conditions
Extract complex conditions into named functions:
```
// ✅ GOOD
function isUserAdmin(user) {
  return user && user.isActive && user.role === 'admin';
}

if (isUserAdmin(user)) { ... }
```

### 2. Use Guard Clauses
Exit early with guard clauses instead of deeply nested conditions:
```
function processOrder(order) {
  if (!order) return false;
  if (order.items.length === 0) return false;
  if (order.total <= 0) return false;
  // Process...
}
```

### 3. Avoid Negative Conditions
Use positive conditions when possible:
- `if (isActive)` ✅ instead of `if (!isInactive)`

### 4. Use Ternary Operators Appropriately
Keep ternary operations simple and readable.

---

## V. ERROR HANDLING

### 1. Specific Try-Catch Blocks
Keep try-catch blocks small and focused:
```
try {
  const users = await fetchUsers();
} catch (error) {
  logger.error('Failed to fetch users', error);
  throw new UserFetchError('Cannot retrieve users', error);
}
```

### 2. Throw Meaningful Errors
- Create custom error classes for different error types
- Include context in error messages
- Don't throw generic `Error`, use specific types

### 3. Handle Errors, Don't Ignore Them
- Don't silently catch and ignore errors
- Log appropriately
- Re-throw if you can't handle it

### 4. Avoid Silent Failures
Explicit error handling is better than optional chaining that returns undefined. Validate state and throw errors when expectations aren't met.

---

## VI. COMMENTS & DOCUMENTATION
**IMPORTANT** commnent with English and Japanese for better understanding and maintainability.
### 1. Comments Explain Why, Not What
- Code structure explains "what" - comments explain "why"
- Avoid obvious comments
- Document non-obvious decisions

### 2. No Commented-Out Code
- Don't leave commented-out code in the codebase
- Use version control if you need to retrieve old code

### 3. Use TODO and FIXME
```
// TODO: Optimize query when table exceeds 100k records
// FIXME: Memory leak on logout (see issue #789)
```

### 4. JSDoc for Public APIs
Document public functions, classes, and APIs with JSDoc comments including parameters, return types, and examples.

---

## VII. DRY - Don't Repeat Yourself

### 1. Extract Common Logic
If you write similar code in multiple places, extract it into a shared function.

### 2. Use Higher-Order Functions
Use `map()`, `filter()`, `reduce()` to avoid repeating loop logic.

### 3. Reusable Utilities
Create utility functions for frequently used operations.

---

## VIII. SOLID PRINCIPLES

### Single Responsibility Principle (SRP)
Each class/module should have one reason to change. Separate concerns: database, validation, notifications, etc.

### Open/Closed Principle
Classes should be open for extension, closed for modification. Use inheritance, strategies, or composition instead of modifying existing code.

### Liskov Substitution Principle
Derived classes must be substitutable for base classes without breaking the code.

### Interface Segregation Principle
Clients shouldn't depend on interfaces they don't use. Create specific interfaces rather than large general ones.

### Dependency Inversion Principle
Depend on abstractions, not concrete implementations. Inject dependencies rather than creating them internally.

---

## IX. CODE FORMATTING & STYLE

### 1. Consistent Indentation
- Use 2 or 4 spaces (don't mix tabs and spaces)
- Maintain consistency across the entire project
- Use linters like ESLint and Prettier

### 2. Line Length
- Keep lines under 80-100 characters
- Easier to read on different screen sizes
- Avoid horizontal scrolling

### 3. Naming Conventions
- **Constants:** `MAX_USERS`, `ADMIN_ROLE` (UPPER_SNAKE_CASE)
- **Classes:** `UserService`, `DatabaseConnection` (PascalCase)
- **Functions/Methods:** `getUserById()`, `calculateTotal()` (camelCase)
- **Private members:** `_privateMethod()`, `_internalState`

### 4. Use Blank Lines
Use blank lines to separate logical sections within functions and between related groups of functions.

---

## X. ADVANCED PATTERNS

### 1. Defensive Programming
- Validate input parameters
- Handle edge cases explicitly
- Don't assume data is in expected format

### 2. Type Safety (TypeScript)
- Use strong typing to catch errors at compile time
- Avoid `any` types
- Leverage type inference

### 3. Testability
- Write code that's easy to test
- Favor pure functions over functions with side effects
- Inject dependencies rather than hardcoding them

### 4. Performance
- Use appropriate data structures (Map for O(1) lookup vs Array for O(n))
- Memoize expensive computations
- Lazy-load when possible
- Profile before optimizing prematurely

---

## XI. CODE REVIEW CHECKLIST

- [ ] Names are clear and meaningful?
- [ ] Functions do one thing well?
- [ ] No magic numbers/strings?
- [ ] Comments are helpful, not obvious?
- [ ] Error handling is appropriate?
- [ ] No code duplication (DRY)?
- [ ] Conditions are simple and readable?
- [ ] Variable scope is narrow?
- [ ] Side effects are controlled?
- [ ] No commented-out code?
- [ ] Code is testable?
- [ ] Performance acceptable?
- [ ] Security considerations addressed?

---

## References

- **Clean Code** by Robert C. Martin (Uncle Bob)
- **Code Complete** by Steve McConnell
- **Refactoring** by Martin Fowler
- **The Pragmatic Programmer**
- **SOLID Principles Documentation**
