# LUXE AI Architecture

System architecture documentation for LUXE AI.

## Overview

LUXE AI is a taste-driven autonomous creative system that generates premium digital work.

## Phase 0-2 Scope

- Intent interpretation
- Structure planning
- Code generation
- Dual critique system
- Regeneration loop
- Manual approval

## Directory Structure

See project root for complete structure.

## Flow

1. Raw intent → Intent Interpreter → Normalized brief
2. Brief → Planner → Site structure
3. Structure → Generator → Next.js code
4. Code → Dual Critic → Pass/Fail
5. If fail → Regenerate → Repeat from step 2
6. If pass → Output to outputs/latest
