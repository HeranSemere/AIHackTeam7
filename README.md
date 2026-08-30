**Flask API (main.py)**

This repository runs a small Flask API implemented in [main.py](main.py). It provides endpoints to submit business applications (including file uploads), save application JSON, and list or fetch ranked application results.

**Prerequisites**
- **Python**: 3.8+ installed
- **Dependencies**: listed in [requirements.txt](requirements.txt)

**Install**

```bash
python -m venv venv
# Windows PowerShell
venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**Run**

```bash
python main.py
```

The server listens on port `5000` by default.

**Endpoints**
- **GET** `/` : Health check, returns a small JSON message.
- **POST** `/submit_business` : multipart/form-data. Required file fields: `audio`, `business_license`, `workshop_photo`. Required form field: `lang`.
- **POST** `/applications` : Accepts `application/json` and appends the record to `uploads/applications/applications.json`.
- **GET** `/applications/<id>` : Fetch a saved application by its `id` (the `id` added when saved via `/applications`).
- **GET** `/ranked_applications` : Runs ranking over saved applications and writes `uploads/applications/ranked_applications.json`, returning the ranked results.
- **GET** `/ranked_applications/<id>` : Fetch a single ranked entry by matching `id`, top-level `application_id` (e.g. `APP-0003`), or the nested `application.id`.

**Uploads & storage**
- **Uploads root**: `uploads/`
- **Applications list**: `uploads/applications/applications.json` (array)
- **Ranked results**: `uploads/applications/ranked_applications.json`

**Examples**
- Submit business (multipart):

```bash
curl -X POST \
	-F "audio=@/path/to/audio.wav" \
	-F "business_license=@/path/to/license.jpg" \
	-F "workshop_photo=@/path/to/photo.jpg" \
	-F "lang=en" \
	http://localhost:5000/submit_business
```

- Save an application JSON (appends to applications.json):

```bash
curl -X POST -H "Content-Type: application/json" -d '{"project_name":"My Project","funding_target":100000}' http://localhost:5000/applications
```

- Get a saved application by id:

```bash
curl http://localhost:5000/applications/<id>
```

- Get ranked results:

```bash
curl http://localhost:5000/ranked_applications
```

- Get single ranked entry (matches nested `application.id` or `application_id`):

```bash
curl http://localhost:5000/ranked_applications/94f7b72658f24be583bf74d01a4de37e
```

**Notes & next steps**
- Uploaded files and generated JSON files are stored in `uploads/` and are persistent across restarts unless deleted.
- The ranking step calls helper logic in `helper/rank_applications.py` — adjust that module to change ranking behaviour.
- If you want responses to return only the nested `application` object for ranked fetches, I can update the endpoint to do that.
