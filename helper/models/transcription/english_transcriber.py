import assemblyai as aai

def transcribe_eng_audio(audio_path):
    aai.settings.api_key = ""

    config = aai.TranscriptionConfig(
        speech_models=["universal-3-pro", "universal-2"],
        language_detection=True,
        speaker_labels=True,
    )

    transcript = aai.Transcriber().transcribe(
        audio_path,
        config=config
    )

    if transcript.status == aai.TranscriptStatus.error:
        raise RuntimeError(f"Transcription failed: {transcript.error}")

    return transcript.text

