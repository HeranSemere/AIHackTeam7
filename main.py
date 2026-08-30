
from email.mime import application
from gettext import translation
import os
import uuid
import json
from flask import Flask, jsonify, request, abort
from werkzeug.utils import secure_filename

from helper.models.translation.eng_to_amh import translate_to_amharic
from helper.models.translation.eng_to_amh import translate_to_amharic
from helper.populate_form import application_to_json, generate_funding_application
from helper.process_form import process_data
from helper.rank_applications import print_summary, rank_applications, save_results

from flask import Flask, jsonify, request, abort
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.route("/", methods=["GET"])
def index():
	return jsonify({"message": "Flask API is running"})


@app.route("/submit_business", methods=["POST"])
def submit_assets():
    # Expect multipart/form-data with:
    # 'audio', 'business_license', 'workshop_photo'
    # and form field 'lang'

    file_keys = ("audio", "business_license", "workshop_photo")

    missing = [key for key in file_keys if key not in request.files]

    lang = request.form.get("lang")

    if missing:
        abort(400, description=f"Missing file fields: {', '.join(missing)}")

    if not lang:
        abort(400, description="Missing 'lang' form field")

    req_id = uuid.uuid4().hex
    dest_dir = os.path.join(UPLOAD_DIR, req_id)
    os.makedirs(dest_dir, exist_ok=True)

    saved = {}

    for key in file_keys:
        f = request.files[key]

        filename = (
            secure_filename(f.filename)
            if f.filename
            else f"{key}_{uuid.uuid4().hex}.bin"
        )

        path = os.path.join(dest_dir, filename)
        f.save(path)

        saved[key] = {
            "filename": filename,
            "path": path,
            "size": os.path.getsize(path)
        }

    # Get paths for all uploaded files
    audio_path = saved["audio"]["path"]
    business_license_path = saved["business_license"]["path"]
    workshop_photo_path = saved["workshop_photo"]["path"]
    
    transcription, translation, extracted_text, described_photo = process_data(
        audio_path=audio_path,
        business_license_path=business_license_path,
        workshop_photo_path=workshop_photo_path,
        lang=lang
    )
    

    # print(f"Translation: {translation}")
    # print(f"Extracted Text: {extracted_text}")
    # print(f"Described Photo: {described_photo}")
    
    application = generate_funding_application(
        audio_text=translation,
        extracted_text=extracted_text,
        described_photo=described_photo
    )
    
    if lang.lower() == "amh":
        application = translate_to_amharic(application)
    elif lang.lower() == "om":
        # TODO Placeholder for Oromo translatioN
        pass
    
    
    # return application_to_json(application), 201
    
    return application_to_json(application), 201
    
    
    # return jsonify({
    #     "transcription": transcription,
    #     "translation": translation,
    #     "extracted_text": extracted_text,
    #     "described_photo": described_photo
    #     # "id": req_id,
    #     # "lang": lang,
    #     # "files": saved
    # }), 201
    
@app.route("/applications", methods=["POST"])
def save_application():
    # Accepts application JSON and appends it to uploads/applications/applications.json
    if not request.is_json:
        abort(400, description="Expected application/json")
    data = request.get_json()

    dest_dir = os.path.join(UPLOAD_DIR, "applications")
    os.makedirs(dest_dir, exist_ok=True)

    apps_file = os.path.join(dest_dir, "applications.json")

    req_id = uuid.uuid4().hex
    # Attach an id to the saved record
    record = {"id": req_id, **data}

    applications = []
    if os.path.exists(apps_file):
        try:
            with open(apps_file, "r", encoding="utf-8") as fh:
                applications = json.load(fh)
                if not isinstance(applications, list):
                    applications = []
        except Exception:
            applications = []

    applications.append(record)

    with open(apps_file, "w", encoding="utf-8") as fh:
        json.dump(applications, fh, ensure_ascii=False, indent=2)

    return jsonify({"id": req_id, "filename": "applications.json", "count": len(applications), "path": os.path.relpath(apps_file, start=os.path.dirname(__file__))}), 201


@app.route("/ranked_applications", methods=["GET"])
def ranked_applications_endpoint():

    with open(
        "C:\\Users\\Heran\\Desktop\\AIHackTeam7\\uploads\\applications\\applications.json",
        "r",
        encoding="utf-8"
    ) as file:

        applications = json.load(file)

    results = rank_applications(
        applications
    )

    save_results(
        results,
        "C:\\Users\\Heran\\Desktop\\AIHackTeam7\\uploads\\applications\\ranked_applications.json"
    )

    print_summary(results)
    
    return jsonify(results), 200


def _load_applications_file():
    dest_dir = os.path.join(UPLOAD_DIR, "applications")
    apps_file = os.path.join(dest_dir, "applications.json")
    if not os.path.exists(apps_file):
        return []
    try:
        with open(apps_file, "r", encoding="utf-8") as fh:
            data = json.load(fh)
            return data if isinstance(data, list) else []
    except Exception:
        return []


@app.route("/ranked_applications/<app_id>", methods=["GET"])
def get_ranked_application(app_id):
    dest_dir = os.path.join(UPLOAD_DIR, "applications")
    apps_file = os.path.join(dest_dir, "ranked_applications.json")
    if not os.path.exists(apps_file):
        abort(404, description="ranked_applications.json not found")
    try:
        with open(apps_file, "r", encoding="utf-8") as fh:
            data = json.load(fh)
    except Exception:
        abort(500, description="Failed to read ranked_applications.json")

    # Assume ranked file is a list of application records. Match against several possible places:
    # - top-level 'id'
    # - top-level 'application_id'
    # - nested 'application'.'id'
    for rec in data:
        # direct id
        if str(rec.get("id")) == str(app_id):
            return jsonify(rec)
        # top-level application_id (e.g., APP-0003)
        if str(rec.get("application_id")) == str(app_id):
            return jsonify(rec)
        # nested application object with its own id
        app_obj = rec.get("application") if isinstance(rec, dict) else None
        if isinstance(app_obj, dict) and str(app_obj.get("id")) == str(app_id):
            return jsonify(rec)

    abort(404, description="Ranked application not found")



@app.route("/applications/<app_id>", methods=["GET"])
def get_application(app_id):
    apps = _load_applications_file()
    for rec in apps:
        if str(rec.get("id")) == str(app_id):
            return jsonify(rec)
    abort(404, description="Application not found")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)






