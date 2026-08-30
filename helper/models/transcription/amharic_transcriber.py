
from elevenlabs.client import ElevenLabs

def transcribe_amh_audio(audio_path):
    """
    Transcribe an audio file using ElevenLabs Scribe v2.
    """
    client = ElevenLabs(api_key="")

    with open(audio_path, "rb") as audio_file:
        transcription = client.speech_to_text.convert(
            file=audio_file,
            model_id="scribe_v2"
        )

    return transcription.text
