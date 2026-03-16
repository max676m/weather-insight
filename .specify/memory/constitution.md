# Weather Insight Constitution

## Core Architecture Principles

### I. Clear Service Separation
The system follows a three-service architecture where each component has a single, isolated responsibility.

* **Frontend (React):** Responsible only for UI rendering and user interaction.
* **Backend API (Node.js with Express):** Acts as the API gateway; orchestrates external API calls and internal service communication.
* **AI Service (Python FastAPI):** Responsible only for AI-related logic, such as generating location facts.

**Rule:** The Frontend must never directly call external APIs or the AI service. All integrations must pass through the Node.js backend.

---

### II. API Gateway & Design
The Backend API acts as the single entry point for all client requests. It is responsible for combining weather data and AI facts into a unified JSON response.

* **Communication:** All service communication occurs over HTTP using JSON.
* **Public Endpoint:** `GET /api/location-info` (Exposed to Frontend).
* **Internal Endpoint:** `POST /generate-facts` (AI Microservice).

---

### III. AI Fact Generation Logic
The AI service must generate exactly **three** facts about the searched location based on the following requirements:

1.  **Positive Aspects:** Two facts must highlight strengths or attractions.
2.  **Challenging Aspects:** One fact must highlight a negative or challenging element.
3.  **Data Grounding:** Facts must be short, relevant, and grounded in real data sources before processing.

---

### IV. Security & Secret Management
* **Key Protection:** External API keys must **never** be exposed to the frontend.
* **Server-Side Execution:** All external API calls must occur within backend services.
* **Environment Variables:** All secrets and credentials must be stored in environment variables.

---

### V. Repository Structure
The repository must maintain the following hierarchy to support independent service execution:

* `frontend/` - React application.
* `backend/` - Node.js API gateway.
* `ai-service/` - Python FastAPI service.
* `.specify/` - Spec-Kit configuration.
* `specs/` - Generated specifications.
* `tasks/` - Implementation tasks.

---

### VI. Development Workflow (Spec-Kit)
All development must follow the Spec-Kit lifecycle:
1.  **Define:** Maintain this Project Constitution.
2.  **Specify:** Generate features via `/speckit.specify`.
3.  **Clarify:** Refine requirements via `/speckit.clarify`.
4.  **Plan:** Create architecture plans via `/speckit.plan`.
5.  **Task:** Generate implementation tasks via `/speckit.tasks`.

---

### VII. Governance & Versioning
This constitution defines the architectural laws of the project. Any changes to the tech stack or architecture must be documented and approved.

* **Version:** 1.0.0
* **Ratified:** 2026-03-16
* **Status:** Active