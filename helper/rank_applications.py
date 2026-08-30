import json
from typing import Literal

from openai import OpenAI
from pydantic import BaseModel, Field


# ============================================================
# OpenAI
# ============================================================

gpt_api_key = ""

client = OpenAI(api_key=gpt_api_key)


# ============================================================
# GRANT PROGRAM CONFIGURATION
# ============================================================

GRANT_PROGRAM = {
    "name": "Women & Local Enterprise Growth Fund",
    "organization": "Community Enterprise Development Foundation",
    "country": "Ethiopia",

    "minimum_funding_etb": 50_000,
    "maximum_funding_etb": 500_000,

    "eligible_sectors": [
        "Coffee",
        "Garment",
        "Hairdresser/Beauty",
        "Food Processing",
        "Electronics Repair",
        "Vehicle Repair",
        "Handicraft",
        "Other",
    ],

    "eligible_uses": [
        "Production equipment",
        "Business tools",
        "Processing equipment",
        "Packaging equipment",
        "Workshop improvements",
        "Productive technology",
        "Raw materials directly required for production",
        "Other clearly justified business inputs",
    ],

    "ineligible_uses": [
        "Personal expenses",
        "Debt repayment",
        "Luxury purchases",
        "Political activities",
        "Unrelated expenses",
    ],

    "scoring": {
        "problem_need": 15,
        "funding_use": 15,
        "impact": 20,
        "beneficiaries": 10,
        "feasibility": 15,
        "business_evidence": 15,
        "sdg_alignment": 5,
        "completeness": 5,
    },
}


# ============================================================
# PYDANTIC OUTPUT MODELS
# ============================================================

class CriterionScore(BaseModel):
    score: float
    maximum_score: float
    justification: str
    evidence: list[str] = Field(default_factory=list)


class Eligibility(BaseModel):
    eligible: bool
    reasons: list[str] = Field(default_factory=list)


class EvidenceAssessment(BaseModel):
    license_present: bool
    license_identity_consistent: bool
    license_location_consistent: bool

    photo_present: bool
    photo_business_related: bool
    photo_supports_activity: bool

    evidence_conflicts: list[str] = Field(default_factory=list)


class RiskAssessment(BaseModel):
    level: Literal["low", "medium", "high"]
    flags: list[str] = Field(default_factory=list)


class GrantEvaluation(BaseModel):

    eligibility: Eligibility

    problem_need: CriterionScore
    funding_use: CriterionScore
    impact: CriterionScore
    beneficiaries: CriterionScore
    feasibility: CriterionScore
    business_evidence: CriterionScore
    sdg_alignment: CriterionScore
    completeness: CriterionScore

    evidence: EvidenceAssessment

    risk: RiskAssessment

    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)

    recommendation: Literal[
        "priority",
        "human_review",
        "low_priority",
        "ineligible",
    ]

    reviewer_summary: str


# ============================================================
# BUILD PROMPT
# ============================================================

def build_evaluation_prompt(application: dict) -> str:

    program = json.dumps(
        GRANT_PROGRAM,
        ensure_ascii=False,
        indent=2
    )

    application_json = json.dumps(
        application,
        ensure_ascii=False,
        indent=2
    )

    return f"""
You are an AI grant application evaluator.

You are evaluating an application for the following grant program.

============================================================
GRANT PROGRAM
============================================================

{program}

============================================================
YOUR ROLE
============================================================

Evaluate the application fairly and consistently against the
grant program requirements.

Use ONLY the information contained in the application.

NEVER invent information.

NEVER assume information that is not present.

NEVER treat an AI-generated statement as automatically true.

Your job is to identify:

1. Eligibility
2. Funding suitability
3. Potential impact
4. Evidence quality
5. Risk
6. Overall score
7. Whether human review is necessary

============================================================
ELIGIBILITY RULES
============================================================

The application is INELIGIBLE only when there is clear evidence
that one of the following applies:

1. Business operates outside Ethiopia.

2. Funding request is below ETB 50,000.

3. Funding request is above ETB 500,000.

4. Funding is explicitly requested for an ineligible purpose.

5. The project is clearly not a business activity.

6. There is clear evidence of fabricated or fraudulent information.

IMPORTANT:

Missing information does NOT automatically mean ineligible.

Instead, missing critical information should normally result in
human review.

============================================================
FUNDING
============================================================

The grant supports productive business investments.

Strong examples include:

- equipment
- tools
- machinery
- processing equipment
- packaging equipment
- workshop improvements
- productive technology
- necessary production inputs

The funding use should have a clear relationship to the
identified business problem.

============================================================
SCORING
============================================================

Score each criterion independently.

------------------------------
PROBLEM / NEED
------------------------------

Maximum: 15 points

Evaluate whether:

- A specific problem is identified.
- The problem affects the business.
- The problem is supported by evidence.
- Funding could reasonably address the problem.

Do not reward vague claims.

------------------------------
FUNDING USE
------------------------------

Maximum: 15 points

Evaluate:

- Specificity of requested use
- Connection to problem
- Productive nature of expenditure
- Reasonableness

------------------------------
IMPACT
------------------------------

Maximum: 20 points

Evaluate evidence of:

- Job creation
- Job preservation
- Increased production
- Improved services
- Women benefiting
- Youth benefiting
- Community benefits

Do NOT invent future revenue.

Do NOT assume job creation unless supported by the application.

------------------------------
BENEFICIARIES
------------------------------

Maximum: 10 points

Evaluate:

- Who benefits?
- Is the beneficiary group clear?
- Is the number known?
- Is the claim supported?

People visible in photographs do NOT establish beneficiary numbers.

------------------------------
FEASIBILITY
------------------------------

Maximum: 15 points

Evaluate whether:

- The business appears to exist.
- The proposed activity is coherent.
- Funding use is realistic.
- Milestones are meaningful.
- Existing evidence supports implementation.

Do not assume financial viability when financial evidence is absent.

------------------------------
BUSINESS EVIDENCE
------------------------------

Maximum: 15 points

Evaluate:

- Business license
- Registration information
- Business identity
- Location
- Business activity
- Workshop/business photograph
- Consistency across evidence

A mismatch does NOT automatically mean fraud.

Instead:

- reduce the evidence score
- describe the conflict
- consider human review

------------------------------
SDG ALIGNMENT
------------------------------

Maximum: 5 points

Only reward SDGs that are genuinely supported.

Do not reward selecting many SDGs.

------------------------------
COMPLETENESS
------------------------------

Maximum: 5 points

Evaluate whether the following are available:

- Project name
- Problem
- Funding use
- Project description
- Sector
- Location
- Funding target
- Currency
- At least one milestone

============================================================
BUSINESS LICENSE
============================================================

Pay particular attention to:

business_license_verified

business_license_business_name

business_license_owner_name

business_license_number

business_license_location

Compare these against:

project_name

location

project description

business activity

Do not automatically reject an application because the license
has a different name or address.

Possible legitimate explanations exist.

Instead, flag the discrepancy for verification.

============================================================
WORKSHOP PHOTO
============================================================

Pay attention to:

workshop_photo_is_business_related

workshop_photo_is_workshop

workshop_photo_supports_business_activity

workshop_photo_observations

A photograph that does not clearly establish the business should
reduce the business evidence score.

It should NOT automatically make the application ineligible.

============================================================
RISK
============================================================

LOW:

Evidence is generally consistent.

MEDIUM:

There are missing pieces or moderate inconsistencies.

HIGH:

There are significant unresolved contradictions or evidence
problems.

Possible flags:

BUSINESS_LICENSE_NAME_MISMATCH
BUSINESS_LICENSE_LOCATION_MISMATCH
BUSINESS_ACTIVITY_MISMATCH
WEAK_PHOTO_EVIDENCE
MISSING_FUNDING_AMOUNT
MISSING_LOCATION
MISSING_BENEFICIARIES
MISSING_BUSINESS_EVIDENCE
INCONSISTENT_INFORMATION
POSSIBLE_FABRICATION

============================================================
HUMAN REVIEW
============================================================

Recommend human review when:

- Identity information conflicts.
- License and applicant information conflict.
- Business location conflicts.
- Business activity conflicts.
- Photo evidence is weak but the application otherwise appears promising.
- Important information is missing.
- Risk is medium or high.

============================================================
RECOMMENDATION
============================================================

Use exactly one:

priority

human_review

low_priority

ineligible

PRIORITY:

Strong application with score >= 80 and no major unresolved
evidence concerns.

HUMAN_REVIEW:

Promising application requiring verification OR score 60-79
OR meaningful evidence concerns.

LOW_PRIORITY:

Score below 60 without clear eligibility failure.

INELIGIBLE:

Clear violation of an eligibility requirement.

============================================================
APPLICATION
============================================================

{application_json}

============================================================
TASK
============================================================

Evaluate this application.

Every criterion must contain:

- score
- maximum_score
- justification
- evidence

Be conservative.

Do not invent facts.
"""


# ============================================================
# EVALUATE ONE APPLICATION
# ============================================================

def evaluate_application(application: dict) -> dict:

    prompt = build_evaluation_prompt(application)

    response = client.responses.parse(
        model="gpt-5.6-luna",
        input=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        text_format=GrantEvaluation,
    )

    evaluation = response.output_parsed

    # --------------------------------------------------------
    # Calculate total score ourselves.
    #
    # This prevents the LLM from accidentally adding scores
    # incorrectly.
    # --------------------------------------------------------

    criteria = [
        evaluation.problem_need,
        evaluation.funding_use,
        evaluation.impact,
        evaluation.beneficiaries,
        evaluation.feasibility,
        evaluation.business_evidence,
        evaluation.sdg_alignment,
        evaluation.completeness,
    ]

    total_score = sum(
        criterion.score
        for criterion in criteria
    )

    total_score = round(
        min(100, max(0, total_score)),
        2
    )

    # --------------------------------------------------------
    # Determine recommendation ourselves.
    # --------------------------------------------------------

    if not evaluation.eligibility.eligible:

        recommendation = "ineligible"

    elif evaluation.risk.level in ["medium", "high"]:

        recommendation = "human_review"

    elif total_score >= 80:

        recommendation = "priority"

    elif total_score >= 60:

        recommendation = "human_review"

    else:

        recommendation = "low_priority"

    return {
        "total_score": total_score,

        "eligibility":
            evaluation.eligibility.model_dump(),

        "scores": {
            "problem_need":
                evaluation.problem_need.model_dump(),

            "funding_use":
                evaluation.funding_use.model_dump(),

            "impact":
                evaluation.impact.model_dump(),

            "beneficiaries":
                evaluation.beneficiaries.model_dump(),

            "feasibility":
                evaluation.feasibility.model_dump(),

            "business_evidence":
                evaluation.business_evidence.model_dump(),

            "sdg_alignment":
                evaluation.sdg_alignment.model_dump(),

            "completeness":
                evaluation.completeness.model_dump(),
        },

        "evidence":
            evaluation.evidence.model_dump(),

        "risk":
            evaluation.risk.model_dump(),

        "strengths":
            evaluation.strengths,

        "weaknesses":
            evaluation.weaknesses,

        "recommendation":
            recommendation,

        "reviewer_summary":
            evaluation.reviewer_summary,
    }


# ============================================================
# RANK MANY APPLICATIONS
# ============================================================

def rank_applications(
    applications: list[dict]
) -> list[dict]:

    results = []

    for index, application in enumerate(applications):

        application_id = application.get(
            "application_id",
            f"APP-{index + 1:04d}"
        )

        print(
            f"[{index + 1}/{len(applications)}] "
            f"Evaluating {application_id}"
        )

        try:

            evaluation = evaluate_application(
                application
            )

            results.append({
                "application_id": application_id,
                "application": application,
                "evaluation": evaluation,
            })

        except Exception as error:

            print(
                f"ERROR: {application_id}: {error}"
            )

            results.append({
                "application_id": application_id,
                "application": application,
                "error": str(error),
            })

    # --------------------------------------------------------
    # Sort by score.
    # Applications with errors go to the bottom.
    # --------------------------------------------------------

    results.sort(
        key=lambda x: x.get(
            "evaluation",
            {}
        ).get(
            "total_score",
            -1
        ),
        reverse=True
    )

    # --------------------------------------------------------
    # Assign ranks.
    # --------------------------------------------------------

    rank = 1

    for result in results:

        if "evaluation" in result:

            result["rank"] = rank

            rank += 1

    return results


# ============================================================
# SAVE
# ============================================================

def save_results(
    results: list[dict],
    filename: str = "ranked_applications.json"
):

    with open(
        filename,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            results,
            file,
            ensure_ascii=False,
            indent=2
        )


# ============================================================
# SUMMARY
# ============================================================

def print_summary(results: list[dict]):

    priority = 0
    human_review = 0
    low_priority = 0
    ineligible = 0

    for result in results:

        recommendation = result.get(
            "evaluation",
            {}
        ).get(
            "recommendation"
        )

        if recommendation == "priority":
            priority += 1

        elif recommendation == "human_review":
            human_review += 1

        elif recommendation == "low_priority":
            low_priority += 1

        elif recommendation == "ineligible":
            ineligible += 1

    print("\n====================================")
    print("GRANT SCREENING RESULTS")
    print("====================================")

    print(
        f"Priority:       {priority}"
    )

    print(
        f"Human review:   {human_review}"
    )

    print(
        f"Low priority:   {low_priority}"
    )

    print(
        f"Ineligible:     {ineligible}"
    )

    print(
        f"Total:          {len(results)}"
    )

    print("\nTOP APPLICATIONS")
    print("------------------------------------")

    for result in results[:20]:

        evaluation = result.get(
            "evaluation"
        )

        if not evaluation:
            continue

        print(
            f"#{result['rank']:03d} "
            f"{result['application_id']} "
            f"| {evaluation['total_score']:>5} "
            f"| {evaluation['recommendation']}"
        )

