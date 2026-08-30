


def transcribe_audio(audio_file_path, lang):
    if lang == "amh":
        from helper.models.transcription.amharic_transcriber import transcribe_amh_audio
        transcription = transcribe_amh_audio(audio_file_path)    
    elif lang == "eng":
        from helper.models.transcription.english_transcriber import transcribe_eng_audio
        transcription = transcribe_eng_audio(audio_file_path)
    elif lang == "om":
        from helper.models.transcription.oromifa_transcriber import transcribe_om_audio
        transcription = transcribe_om_audio(audio_file_path)
    else:
        transcription = "Unsupported language"
        
    return transcription