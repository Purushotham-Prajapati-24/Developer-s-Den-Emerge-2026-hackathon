# 🚨 Developer's Den — Agent Rules & Constraints

---

## 🔴 1. SOURCE OF TRUTH RULE

All decisions MUST be based strictly on:

- PRD.md
- FunctionalSpecification.md
- UserJourneyWorkflow.md
- TechStack.md
- PerformanceScalability.md
- Database.md
- Design.md

❌ Do NOT:
- Add features not defined
- Modify flows without confirmation
- Assume missing details

✅ If anything is unclear:
→ STOP
→ ASK the user

---

## 🧠 2. ZERO HALLUCINATION POLICY

- Do NOT invent APIs
- Do NOT assume schema fields
- Do NOT guess business logic

If unsure:
→ Ask a clarification question
→ Provide 2–3 possible options (if needed)

---

## 🧩 3. PHASE-BASED EXECUTION

You MUST follow:

1. Understanding
2. Setup
3. Auth
4. Database
5. Profile
6. Collaboration
7. AI
8. Execution Engine
9. Optimization
10. UI Polish

❌ Never skip phases  
❌ Never jump ahead  

---

## 🛠 4. MCP TOOL USAGE RULE

Use tools appropriately:

- shadcn → UI components
- reactbits → advanced UI logic
- 21st.dev → UI inspiration/layouts
- MongoDB MCP → schema + DB ops

❌ Do NOT manually recreate what MCP can provide  
✅ Prefer tool-based generation

---

## 🔐 5. AUTHENTICATION RULES

- JWT must be used for session handling
- Clerk must be used for OAuth (Google)

Token Rules:
- Access Token → short-lived (localStorage)
- Refresh Token → httpOnly cookie
- Session data → sessionStorage

❌ Never store sensitive tokens insecurely

---

## 🗄️ 6. DATABASE RULES

- Follow Database.md strictly
- Use MongoDB collections as defined

❌ Do NOT modify schema without approval  
✅ Suggest optimizations separately

---

## ⚡ 7. PERFORMANCE RULES

Always consider:

- WebSocket room-based updates
- Debouncing input
- Avoid unnecessary re-renders
- Efficient CRDT syncing (diff-based)

---

## 🧑‍💻 8. USER INTERACTION RULE

You MUST:

- Ask before major decisions
- Confirm before moving phases
- Offer choices when ambiguity exists

---

## 📦 9. CODE QUALITY RULES

- Modular architecture only
- Reusable components
- Clean folder structure
- Avoid monolithic files

---

## 🎨 10. UI/UX RULES

- Use shadcn components
- Follow Design.md
- Maintain consistency

❌ No random UI  
❌ No unstructured layouts  

---

## 🛑 11. FAILURE CONDITIONS

You FAIL if:

- You hallucinate
- You skip asking questions
- You ignore documentation
- You break architecture consistency

---

## 🎯 12. PRIMARY GOAL

Build:

👉 A scalable, collaborative cloud IDE  
👉 Hackathon-winning demo-ready product  
👉 Fully aligned with all provided documents  

---
