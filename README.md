# AI Grant Application Autofill Backend

A Flask-based backend that automatically fills grant and business application forms using **audio, business documents, and images**.

Business owners can describe their business through voice and provide supporting documents and photos. The backend uses AI to extract, translate, validate, and structure this information into a complete application that can be saved and ranked.

## How It Works

The system supports **English, Amharic (አማርኛ), and Afaan Oromo (Afaan Oromoo)**.


                         ┌─────────────────────────────┐
                         │        USER INPUT           │
                         └──────────────┬──────────────┘
                                        │
             ┌──────────────────────────┼──────────────────────────┐
             │                          │                          │
             ▼                          ▼                          ▼
    ┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
    │      AUDIO      │        │ BUSINESS LICENSE│        │ WORKSHOP PHOTO  │
    │                 │        │                 │        │                 │
    │ English         │        │                 │        │                 │
    │ Amharic         │        │                 │        │                 │
    │ Afaan Oromo     │        │                 │        │                 │
    └────────┬────────┘        └────────┬────────┘        └────────┬────────┘
             │                          │                          │
             ▼                          ▼                          ▼
    ┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
    │  SPEECH-TO-TEXT │        │       OCR       │        │      Vision     │
    │                 │        │                 │        │   **Agent:      │
    │ ElevenLabs /    │        │     OCRSpace    │        │  GPT-5.6-LUNA   │
    │ AssemblyAI/     │        │                 │        │                 │
    │ appropriate ASR │        │                 │        │                 │
    └────────┬────────┘        └────────┬────────┘        └────────┬────────┘
             │                          │                          │
             └──────────────────────────┼──────────────────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │   NORMALIZE & TRANSLATE     │
                         │   **Agent: Gemini           │
                         │                             │
                         │   → English                 │
                         │   → Standardized fields     │
                         └──────────────┬──────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │   Information Extraction    │
                         │                             │
                         │   **Agent: GPT-5.6 LUNA +   │
                         │        Pydantic fields      │
                         │                             │
                         │  • Understand context       │
                         │  • Combine all inputs       │
                         │  • Extract grant fields     │
                         └──────────────┬──────────────┘
                                        │
                                        ▼   
                         ┌─────────────────────────────┐
                         │   PYDANTIC STRUCTURED DATA  │
                         │                             │
                         │   Validate/enforce Grant    │
                         │     Fields                  │
                         └──────────────┬──────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │    TRANSLATE FOR USER       │
                         │  **Agent:  GPT-5-mini       │
                         │ English / Amharic / Oromo   │
                         └──────────────┬──────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │     GRANT APPLICATION       │
                         │            FORM             │
                         │                             │
                         │   populated + editable      │
                         └──────────────┬──────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │      FINAL APPLICATION      │
                         │                             │
                         │      Application JSON       │
                         └─────────────────────────────┘

## Project Structure

### `main.py`

`main.py` is the entry point and API layer of the backend. It exposes the Flask endpoints and connects the different AI processing modules.

The main endpoint, `POST /submit_business`, receives the audio, business license, workshop photo, and language, then passes them through the processing pipeline to generate a structured application.

Other endpoints handle saving and retrieving applications and ranking submitted applications.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/submit_business` | Process audio/images and generate an application |
| `POST` | `/applications` | Save an application |
| `GET` | `/applications/<id>` | Retrieve an application |
| `GET` | `/ranked_applications` | Rank saved applications |
| `GET` | `/ranked_applications/<id>` | Retrieve a ranked application |

## Tech Stack

- Python
- Flask
- OpenAI
- AssemblyAI
- Pydantic
- OCRSpace
- Computer Vision
- Gemini

## AI Pipeline

- **Speech-to-Text:** Converts business owners' spoken descriptions into text.
- **OCR:** Extracts information from business licenses and documents.
- **Computer Vision:** Analyzes workshop/business photos.
- **Translation:** Supports English, Amharic, and Afaan Oromo.
- **Application Generation:** Combines extracted information into a structured grant application.
- **Validation:** Uses Pydantic to maintain a consistent application schema.
- **Agentic Ranking:** Scores and prioritizes completed applications.

### Agentic Ranking: Grant Provider Side

- **Eligibility Screening:** Checks applications against configurable grant requirements.
- **AI Evaluation:** Scores applications across predefined criteria.
- **Evidence Assessment:** Compares information across documents, application data, and photos.
- **Risk Assessment:** Identifies missing information, inconsistencies, and potential evidence problems.
- **Deterministic Scoring:** Calculates the final score from the weighted evaluation criteria.
- **Recommendation:** Classifies applications as priority, human review, low priority, or ineligible.
- **Ranking:** Sorts eligible applications by their final score to help reviewers prioritize their work.

## Ranking System

Each application is evaluated against a **100-point scoring framework**:

| Criterion | Maximum |
|---|---:|
| Problem / Need | 15 |
| Funding Use | 15 |
| Impact | 20 |
| Beneficiaries | 10 |
| Feasibility | 15 |
| Business Evidence | 15 |
| SDG Alignment | 5 |
| Completeness | 5 |
| **Total** | **100** |

The AI evaluator provides the score and supporting evidence for each criterion, while the backend **calculates the final score independently**.

This prevents the AI from accidentally miscalculating the total.

Applications are then classified according to both their score and evidence quality:

```text
                    APPLICATION
                         │
                         ▼
                 Eligibility Check
                         │
              ┌──────────┴──────────┐
              │                     │
          INELIGIBLE             ELIGIBLE
              │                     │
              ▼                     ▼
         Ineligible          AI Evaluation
                                    │
                                    ▼
                              Evidence / Risk
                                    │
                                    ▼
                              Final Score
                                  / 100
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
                 ≥ 80            60–79            < 60
                    │               │               │
                    ▼               ▼               ▼
                PRIORITY      HUMAN REVIEW     LOW PRIORITY

