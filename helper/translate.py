from helper.models.translation.eth_to_eng import translate_with_gemini

def translate_to_eng(sample_text):
    try:
        translated_text = translate_with_gemini(sample_text)

        return translated_text
    except Exception as e:
        return f"\nExecution Failed: {e}"



