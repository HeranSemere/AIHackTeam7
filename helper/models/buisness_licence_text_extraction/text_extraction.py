import ocrspace

def extract_text_from_image(image_path: str) -> str:
    
    api = ocrspace.API(
        api_key=""
    )
    
    result = api.ocr_file(r""+image_path)
    
    # print("OCR Result:", result)

    
    return result

