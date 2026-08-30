import json
from typing import Optional

from openai import OpenAI
from pydantic import BaseModel, Field

gpt_api_key = ""

import json
from typing import Optional

from openai import OpenAI
from pydantic import BaseModel, Field


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

    sdg_categories: list[int] = Field(default_factory=list)

    funding_target: Optional[float] = None
    currency: str

    number_of_beneficiaries: Optional[int] = None
    beneficiaries: list[str] = Field(default_factory=list)

    implementing_organisation: str

    milestones: list[Milestone] = Field(default_factory=list)

    # Business license information
    business_license_verified: bool
    business_license_business_name: str
    business_license_owner_name: str
    business_license_number: str
    business_license_business_type: str
    business_license_location: str

    # Workshop / business photo verification
    workshop_photo_is_business_related: bool
    workshop_photo_is_workshop: bool
    workshop_photo_supports_business_activity: bool
    workshop_photo_observations: list[str] = Field(default_factory=list)


def generate_funding_application(
    audio_text: str = "",
    extracted_text: str = "",
    described_photo: dict | str = "",
) -> FundingApplication:

    if isinstance(described_photo, dict):
        photo_analysis = json.dumps(
            described_photo,
            ensure_ascii=False,
            indent=2
        )
    else:
        photo_analysis = described_photo

    prompt = f"""
You are an AI assistant filling out a business funding application.

Your task is to analyze the provided evidence and populate the
funding application.

There are THREE primary evidence sources:

1. AUDIO / USER-PROVIDED INFORMATION
2. BUSINESS LICENSE OCR
3. WORKSHOP / BUSINESS PHOTOGRAPH ANALYSIS

Use all three sources together, but understand what each source
can and cannot establish.

==================================================
IMPORTANT GENERAL RULES
==================================================

1. Use ONLY information supported by the provided evidence.

2. NEVER invent facts.

3. NEVER guess financial amounts.

4. NEVER guess the number of beneficiaries.

5. NEVER invent an organisation name.

6. NEVER invent a location.

7. NEVER invent the duration of a business.

8. If information is unavailable:
   - For text fields, return an empty string "".
   - For numeric fields, return null.
   - For lists, return [].
   - For boolean verification fields, return false unless there
     is sufficient evidence to establish that the condition is true.

9. ALL fields must be returned.

10. The project description MUST be no more than 2000 characters.

11. The project description should explain:
    - What the business/project does
    - The problem it addresses
    - What the funding will enable
    - The expected impact

12. The problem field should describe the actual problem,
    challenge, or constraint supported by the evidence.

13. The funding_use field should explain what the requested money
    will be used for.

14. The tagline should be a concise one-line explanation of
    what changes for people as a result of the project.

15. Do not make unsupported claims about:
    - Revenue
    - Profitability
    - Employee count
    - Ownership
    - Market size
    - Equipment value
    - Business growth
    - Future income
    - Number of customers

16. A person visible in a photograph does NOT establish the
    total number of employees or beneficiaries.

17. Equipment visible in a photograph does NOT establish
    ownership.

18. Only use information from the photograph for things that
    are visually observable.

19. When sources disagree, do NOT silently choose one.
    Prefer the most direct evidence and describe the uncertainty
    in the relevant text field.

==================================================
BUSINESS LICENSE EVIDENCE
==================================================

The BUSINESS LICENSE OCR contains information extracted from
a business license or business-related document.

Use the license to identify information such as:

- Business name
- Owner name
- License number
- Registered business type
- Registered location
- Other explicitly stated registration information

IMPORTANT:

The OCR text may contain errors.

Do not assume that every OCR string is correct.

Only extract information that is reasonably readable and
supported by the OCR evidence.

Do not use the license to infer:

- Current revenue
- Current profitability
- Number of employees
- Current equipment
- Current beneficiaries
- Whether the business is currently operating

For business_license_verified:

Set it to true ONLY if the OCR evidence appears to contain
clear business-license information that identifies the business.

Otherwise return false.

==================================================
WORKSHOP / BUSINESS PHOTO EVIDENCE
==================================================

The WORKSHOP / BUSINESS PHOTO ANALYSIS describes what is
visually observable in the uploaded photograph.

Use it to determine:

- Whether the photograph appears business-related
- Whether it appears to show a workshop
- Whether the visible environment supports the claimed
  business activity
- What equipment, tools, materials, people, and workspace
  characteristics are visible

IMPORTANT:

The photograph cannot establish:

- Business ownership
- Equipment ownership
- Revenue
- Profitability
- Number of employees
- Number of beneficiaries
- Business registration
- Exact business age

For workshop_photo_supports_business_activity:

Set this to true ONLY if the visible evidence is consistent
with the stated business activity.

Do not treat visual similarity alone as definitive proof.

==================================================
CROSS-SOURCE REASONING
==================================================

Compare information across the audio, business license, and
workshop photograph.

For example:

If the business license says:

"ABC Furniture Manufacturing"

and the photograph shows:

"woodworking tools, furniture, wood materials"

then the photograph supports the stated business activity.

However, if the license says:

"Vehicle Repair"

and the photograph shows:

"a restaurant kitchen"

then the photograph does NOT support the business activity.

Do not invent an explanation for discrepancies.

==================================================
SECTORS
==================================================

The sector MUST be exactly one of:

Coffee
Garment
Hairdresser/Beauty
Food Processing
Electronics Repair
Vehicle Repair
Handicraft
Other

Choose the sector using the strongest available evidence.

If the business license explicitly states a business type,
prefer that evidence.

Use the photograph to determine whether the current visible
business environment is consistent with the stated sector.

If the sector cannot reasonably be determined:

"Other"

==================================================
CURRENCIES
==================================================

The currency MUST be exactly one of:

ETB
USD
EUR
KES
NGN
UGX
TZS
RWF
ETH
USDC
USDT

If the currency cannot be determined:

""

==================================================
SDG CATEGORIES
==================================================

Select ONLY SDGs that are genuinely supported by the evidence.

1  - No Poverty
2  - Zero Hunger
3  - Good Health
4  - Quality Education
5  - Gender Equality
6  - Clean Water
7  - Clean Energy
8  - Decent Work
9  - Industry & Innovation
10 - Reduced Inequalities
11 - Sustainable Cities
12 - Responsible Consumption
13 - Climate Action
14 - Life Below Water
15 - Life on Land
16 - Peace & Justice
17 - Partnership

Return ONLY the numbers.

Example:

[8, 9]

Do NOT select SDGs simply because they sound generally relevant.

There must be evidence supporting the connection.

==================================================
BENEFICIARY CATEGORIES
==================================================

Choose ONLY categories supported by the evidence.

Allowed values:

Youth (15-35)
Women
Unemployed adults
MSME / small business owners
Refugees / IDPs
People with disabilities
Rural communities
Students / trainees
Other

Return the exact category names.

Do not infer beneficiaries merely from the type of business.

==================================================
MILESTONES
==================================================

Create milestones only when there is enough evidence to describe
realistic project activities.

Each milestone must contain:

- title
- description

Do NOT invent activities simply to create milestones.

If there is insufficient information:

[]

==================================================
FUNDING INFORMATION
==================================================

Funding target should ONLY be populated if a specific amount
is provided in the evidence.

Do not estimate or calculate a requested amount.

Number of beneficiaries should ONLY be populated if the evidence
explicitly provides a number.

Do not use the number of people visible in the photograph as
the number of beneficiaries.

==================================================
EVIDENCE
==================================================

-------------------------
AUDIO / USER INFORMATION
-------------------------

{audio_text}


-------------------------
BUSINESS LICENSE OCR
-------------------------

{extracted_text}


-------------------------
WORKSHOP / BUSINESS PHOTO ANALYSIS
-------------------------

{photo_analysis}


==================================================
TASK
==================================================

Using the evidence above, populate the complete funding application.

Every field must be returned.

For missing information:

Text:
""

Numbers:
null

Lists:
[]

Verification booleans:
false unless supported by evidence.

Do not fabricate information.

The final project description MUST be 2000 characters or fewer.
"""

    response = client.responses.parse(
        model="gpt-5.6-luna",
        input=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        text_format=FundingApplication,
    )

    return response.output_parsed


def application_to_json(
    application: FundingApplication
) -> str:
    return application.model_dump_json(
        indent=2,
        exclude_none=False
    )