import json
from openai import OpenAI

from typing import Optional
from pydantic import BaseModel
from openai import OpenAI

gpt_api_key = ""




client = OpenAI(api_key=gpt_api_key)


class Milestone(BaseModel):
    title: str
    description: str


class FundingApplication(BaseModel):
    project_name: str
    tagline: str
    problem: str
    funding_use: str
    project_description: str

    sector: str
    location: str

    sdg_categories: list[int]

    funding_target: Optional[float]
    currency: str
    number_of_beneficiaries: Optional[int]

    beneficiaries: list[str]
    implementing_organisation: str

    milestones: list[Milestone]

    business_license_verified: bool
    business_license_business_name: str
    business_license_owner_name: str
    business_license_number: str
    business_license_business_type: str
    business_license_location: str

    workshop_photo_is_business_related: bool
    workshop_photo_is_workshop: bool
    workshop_photo_supports_business_activity: bool
    workshop_photo_observations: list[str]


def translate_to_amharic(application: FundingApplication) -> FundingApplication:

    response = client.responses.parse(
        model="gpt-5-mini",

        instructions="""
You are an expert English-to-Amharic translator.

Translate the English content in this funding application into
natural, accurate, professional Amharic.

IMPORTANT RULES:

1. Do NOT change any field names.
2. Do NOT add any fields.
3. Do NOT remove any fields.
4. Every field in the input must be present in the output.
5. Translate only human-readable English text.
6. Do not translate numbers.
7. Do not translate boolean values.
8. Preserve business license numbers exactly.
9. Preserve names of people and organizations accurately.
10. Preserve dates, addresses, URLs, and other identifiers.
11. Preserve the meaning of the original text.
12. Do not summarize.
13. Do not add information that is not present.
14. Use natural Amharic rather than word-for-word translation.
15. Return the complete FundingApplication object.
""",

        input=application.model_dump_json(),

        text_format=FundingApplication
    )
    
    # print(f"Translation response: {response.output_parsed}")

    return response.output_parsed