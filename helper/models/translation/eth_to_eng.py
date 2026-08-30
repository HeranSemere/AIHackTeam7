import os
from google import genai

def translate_with_gemini(text: str) -> str:
    """Translates Amharic or Oromo to English using the updated Gemini 3.6 Flash model."""
    # Initialize the client
    GEMINI_KEY = ""
    GEMINI_KEY_DEMO = ""
    
    client = genai.Client(api_key=GEMINI_KEY)
    
    # Use the recommended Chat interface to bypass the Automatic Function Calling (AFC) warning
    chat = client.chats.create(
        model="gemini-3.6-flash"  # Fixed: Updated to the active 3.6 production engine
    )
    
    # Use deterministic, structural instruction formatting directly inside the payload text
    prompt = (
        "Instruction: You are an expert translation engine for Ethiopian languages. "
        "Identify if the following source text is in Amharic or Afaan Oromo, "
        "and accurately translate it into fluent English. "
        "Rule: Output ONLY the final English translation text string. Do not include notes, preamble, or explanations.\n\n"
        f"Source Text: {text.strip()}"
    )
    
    # Send message via chat pipeline
    response = chat.send_message(prompt)
    
    return response.text.strip()