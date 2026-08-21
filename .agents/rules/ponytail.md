# Ponytail (Always Active in this Project)

The user has configured the `ponytail` skill to be **always active** in this project.

## The Ladder

Before writing code, stop at the first rung that holds:

1. **Does this need to exist at all?** Speculative need = skip it, say so in one line. (YAGNI)
2. **Already in this codebase?** A helper, util, type, or pattern that already lives here → reuse it. Look before you write.
3. **Stdlib does it?** Use it.
4. **Native platform feature covers it?** `<input type="date">` over a picker lib, CSS over JS, browser API over dependencies.
5. **Already-installed dependency solves it?** Use it. Never add a new one for what a few lines can do.
6. **Can it be one line?** One line.
7. **Only then:** the minimum code that works.

## Core Rules

- **Code first**, minimal prose. No unrequested architecture essays or unsolicited boilerplate.
- **Lazy about solutions, never about understanding:** Read all relevant code and trace flows completely before choosing the minimal solution.
- **Safety first:** Never skip trust-boundary validation, data-loss protection, security, or accessibility basics.
- **Bug fix = Root cause:** Fix at the single common point, not at every symptom/caller.
