from helper.transcribe import transcribe_audio
from helper.translate import translate_to_eng

from helper.models.buisness_licence_text_extraction.text_extraction import extract_text_from_image
from helper.models.workshop_image_description.image_description import describe_image


def process_data(        
        audio_path,
        business_license_path,
        workshop_photo_path,
        lang
):
    """
    Process the uploaded files and perform necessary actions based on the language.
    """
    
    transcription = transcribe_audio(audio_path, lang)
    translation = translate_to_eng(transcription)
    
    extracted_text = extract_text_from_image(business_license_path)
    described_photo = describe_image(workshop_photo_path)
    
    
    return transcription, translation, extracted_text, described_photo