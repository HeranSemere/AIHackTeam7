import base64
import json
from openai import OpenAI

gpt_api_key = ""

client = OpenAI(api_key=gpt_api_key)

def describe_image(image_path):
    with open(image_path, "rb") as f:
        image_data = base64.b64encode(f.read()).decode("utf-8")

    response = client.responses.create(
        model="gpt-5.6-luna",
        input=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": """
Analyze this photograph for a business funding application.

First determine whether the image appears to show a real business
workspace, workshop, shop, office, production area, or other
business-related environment.

Set is_business_related to true ONLY when there is sufficient
visual evidence that the image shows a business-related environment.

Set is_business_related to false if:
- The image is unrelated to a business.
- The image is too unclear to determine.
- The image is primarily a random person, landscape, document,
  selfie, or unrelated object.
- There is insufficient visual evidence of a business environment.

Also determine whether the business environment specifically appears
to be a workshop or production workspace.

IMPORTANT:
- Only report things that are visually observable.
- Never invent facts.
- Do not estimate revenue, employee count, ownership, equipment value,
  years in operation, or profitability.
- If something cannot be established from the image, put it in limitations.
- A person visible in the image does NOT establish the total number
  of employees.
- Equipment visible does NOT establish ownership.
- Do not infer the business type unless there is visual evidence.

Return the information using the required JSON structure.
""",
                    },
                    {
                        "type": "input_image",
                        "image_url": f"data:image/jpeg;base64,{image_data}",
                    },
                ],
            }
        ],
        text={
            "format": {
                "type": "json_schema",
                "name": "workshop_analysis",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "is_business_related": {
                            "type": "boolean"
                        },
                        "is_workshop": {
                            "type": "boolean"
                        },
                        "business_activity": {
                            "type": "string"
                        },
                        "equipment_visible": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            }
                        },
                        "tools_visible": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            }
                        },
                        "materials_visible": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            }
                        },
                        "people_visible": {
                            "type": "integer"
                        },
                        "workspace_description": {
                            "type": "string"
                        },
                        "observations": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            }
                        },
                        "limitations": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            }
                        }
                    },
                    "required": [
                        "is_business_related",
                        "is_workshop",
                        "business_activity",
                        "equipment_visible",
                        "tools_visible",
                        "materials_visible",
                        "people_visible",
                        "workspace_description",
                        "observations",
                        "limitations"
                    ],
                    "additionalProperties": False
                }
            }
        }
    )

    return json.loads(response.output_text)


# result = describe_image(
#     r"C:\Users\Heran\Desktop\AIHackTeam7\uploads\0fa7f276f4d54a65967b01228c9b35b9\workshop_photo.jpg"
# )

# print(json.dumps(result, indent=2))

