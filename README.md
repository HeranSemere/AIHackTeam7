# AI Grant Application Autofill Backend

A Flask-based backend that automatically fills grant and business application forms using **audio, business documents, and images**.

Business owners can describe their business through voice and provide supporting documents and photos. The backend uses AI to extract, translate, validate, and structure this information into a complete application that can be saved and ranked.

## How It Works

```text
Audio ───────────────► Speech-to-Text ──┐
                                        │
Business License ────► OCR ─────────────┤
                                        ├──► AI Processing ──► Application JSON
Workshop Photo ──────► Vision ──────────┘
```

The system supports **English, Amharic (አማርኛ), and Afaan Oromo (Afaan Oromoo)**.

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

## AI Pipeline

- **Speech-to-Text:** Converts business owners' spoken descriptions into text.
- **OCR:** Extracts information from business licenses and documents.
- **Computer Vision:** Analyzes workshop/business photos.
- **Translation:** Supports English, Amharic, and Afaan Oromo.
- **Application Generation:** Combines extracted information into a structured grant application.
- **Validation:** Uses Pydantic to maintain a consistent application schema.
- **Agentic Ranking:** Scores and prioritizes completed applications.

## Tech Stack

- Python
- Flask
- OpenAI
- AssemblyAI
- Pydantic
- OCR
- Computer Vision

## Setup

Create a virtual environment:

```bash
python -m venv venv

The response is a structured JSON application ready to be displayed, stored, or ranked.
