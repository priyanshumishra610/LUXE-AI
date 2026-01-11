# LUXE AI Directory Structure

## Complete Directory Tree

```
LUXE-AI/
│
├── constitution/
│   ├── premium-constitution.md
│   └── quality-rubric.md
│
├── prompts/
│   ├── intent-interpreter.prompt.txt
│   ├── planner.prompt.txt
│   ├── generator.prompt.txt
│   ├── critic-technical.prompt.txt
│   └── critic-taste.prompt.txt
│
├── scripts/
│   ├── interpret.ts
│   ├── plan.ts
│   ├── generate.ts
│   ├── critique.ts
│   ├── regenerate.ts
│   ├── types.ts
│   └── utils/
│       ├── llm.ts
│       ├── promptLoader.ts
│       ├── fileWriter.ts
│       └── logger.ts
│
├── templates/
│   └── nextjs-base/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   └── globals.css
│       ├── components/
│       ├── public/
│       ├── styles/
│       ├── package.json
│       ├── tailwind.config.js
│       ├── postcss.config.js
│       ├── next.config.js
│       └── tsconfig.json
│
├── outputs/
│   ├── latest/
│   └── archive/
│
├── docs/
│   ├── architecture.md
│   └── structure.md
│
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## Folder Responsibilities

### `constitution/`
Human-written rules and standards. Never modified by code. Contains the non-negotiable quality standards that all output must meet.

### `prompts/`
Static system prompts used by agents. Plain text files. No logic, no templating. Single source of truth for each agent's instructions.

### `scripts/`
Orchestration logic only. Coordinates the flow between agents. No business logic, no hardcoded prompts. Pure orchestration.

### `scripts/utils/`
Pure utility functions. File I/O, LLM abstraction, logging. Reusable across scripts. No business logic or AI-specific logic.

### `templates/nextjs-base/`
Clean Next.js baseline template. Used as reference/structure for generation. Never modified by generation logic. Pure template.

### `outputs/latest/`
Generated artifacts go here. Latest generated work. Overwritten on each generation cycle. Never manually edited.

### `outputs/archive/`
Archived previous outputs. For reference or rollback. Populated by archive scripts (future).

### `docs/`
Architecture and structure documentation. Human-readable reference. Not used by code.

---

## File Responsibilities

### Constitution Files

**`constitution/premium-constitution.md`**  
Defines visual, copy, and code standards. Forbidden elements list. The law.

**`constitution/quality-rubric.md`**  
Scoring system for critique. Defines metrics and thresholds. Pass/fail criteria.

### Prompt Files

**`prompts/intent-interpreter.prompt.txt`**  
Instructions for converting raw user input into structured brief JSON.

**`prompts/planner.prompt.txt`**  
Instructions for creating site structure from interpreted intent.

**`prompts/generator.prompt.txt`**  
Instructions for generating production-ready Next.js code.

**`prompts/critic-technical.prompt.txt`**  
Instructions for technical code correctness evaluation.

**`prompts/critic-taste.prompt.txt`**  
Instructions for visual and emotional quality evaluation.

### Script Files

**`scripts/interpret.ts`**  
Takes raw intent, calls intent-interpreter prompt, returns normalized JSON.

**`scripts/plan.ts`**  
Takes interpreted intent, calls planner prompt, returns site structure JSON.

**`scripts/generate.ts`**  
Main orchestrator. Coordinates interpret → plan → generate → critique → regenerate loop.

**`scripts/critique.ts`**  
Runs both critics. Returns combined pass/fail report.

**`scripts/regenerate.ts`**  
Triggered on critique failure. Applies subtraction/simplification. Returns refined plan.

**`scripts/types.ts`**  
Shared TypeScript type definitions. Used across scripts.

### Utility Files

**`scripts/utils/llm.ts`**  
LLM API abstraction. Takes prompt string, returns response. No prompt content here.

**`scripts/utils/promptLoader.ts`**  
Loads prompt files from prompts/ directory. Pure file I/O.

**`scripts/utils/fileWriter.ts`**  
Writes generated files to outputs/. Handles directory creation.

**`scripts/utils/logger.ts`**  
Structured logging utility. Simple, predictable output.

### Template Files

**`templates/nextjs-base/`**  
Complete Next.js App Router base structure. All standard files and configs. Reference template only.

### Config Files

**`package.json`**  
Root package.json. Scripts and dependencies for LUXE AI system itself.

**`tsconfig.json`**  
TypeScript config for scripts/. Excludes templates and outputs.

**`.gitignore`**  
Standard ignores. Excludes outputs/latest, node_modules, .env.

---

## Why This Structure Prevents Mistakes

1. **Single Responsibility**  
   Each folder has one clear purpose. Prompts can't contain logic. Scripts can't contain prompts. Outputs can't be edited.

2. **Clear Boundaries**  
   Constitution is human-only. Prompts are static. Scripts orchestrate. Utils are pure. Templates are reference. Outputs are write-only.

3. **Predictable Locations**  
   Everything has one place. New developers know where to look. No ambiguity about where files belong.

4. **Separation of Concerns**  
   Business logic (constitution) separated from execution (scripts). Prompts separated from code. Generation separated from critique.

5. **Scalability**  
   Adding new agents = add prompt file. Adding new utilities = add to utils/. Structure supports growth without refactoring.

6. **No Overlap**  
   No file serves multiple purposes. No folder has mixed responsibilities. Each file has one job.

7. **Explicit Dependencies**  
   Scripts depend on prompts, not hardcoded strings. Utils are imported, not duplicated. Clear dependency flow.

This structure enforces discipline at the filesystem level. Mistakes become impossible because the structure itself prevents them.
