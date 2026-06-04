import os
from anthropic import Anthropic
from dotenv import load_dotenv
from sympy import sympify, Eq, solve, Symbol

load_dotenv()

GENERATE_TOOL = {
    "name": "generate_problem",
    "description": "Generate a new maths problem for a student",
    "input_schema": {
        "type": "object",
        "properties": {
            "description": {
                "type": "string",
                "description": "The problem as shown to the student (human-readable)"
            },
            "machine_form": {
                "type": "string",
                "description": (
                    "Sympy-parseable representation of the problem. "
                    "For equations use 'lhs = rhs' (e.g. '2*x + 4 = 10'). "
                    "For arithmetic use the full expression (e.g. '6 * 4'). "
                    "Always use * for multiplication, never implicit."
                )
            },
            "problem_type": {
                "type": "string",
                "enum": ["equation", "arithmetic"],
                "description": "'equation' if the problem requires solving for a variable; 'arithmetic' if it is a direct calculation"
            },
            "variable": {
                "type": "string",
                "description": "The variable to solve for (e.g. 'x'). Use an empty string for arithmetic problems."
            },
            "correct_answer": {
                "type": "string",
                "description": "The correct numerical answer as a string (e.g. '3' or '24')"
            },
            "difficulty": {
                "type": "integer",
                "description": "Difficulty level of the generated problem on a 1-10 scale"
            },
            "solution_steps": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Step-by-step solution walkthrough a teacher would show"
            },
            "new_skill": {
                "type": "string",
                "description": "The specific mathematical skill or concept this problem practices"
            }
        },
        "required": [
            "description", "machine_form", "problem_type", "variable",
            "correct_answer", "difficulty", "solution_steps", "new_skill"
        ]
    }
}

_DIRECTION_GUIDANCE = {
    "harder": (
        "Make it HARDER than the solved problem by introducing ONE new technique "
        "the student wasn't required to use before. Pick from:\n"
        "  - combining like terms (e.g. add a second variable term)\n"
        "  - distribution / parentheses (e.g. 2(x + 3) = 14)\n"
        "  - variable on both sides (e.g. 2x + 3 = x + 8)\n"
        "  - one extra solving step\n"
        "Increment the difficulty by exactly 1 from the original.\n"
        "VALID:    original 2x + 3 = 5   ->  harder 2x + 3 + 4x = 15   (added like-terms step)\n"
        "VALID:    original 2x + 3 = 5   ->  harder 2(x + 3) = 14      (added distribution)\n"
        "INVALID:  3x + 7 = 16  (same structure, just bigger numbers — not actually harder)\n"
        "INVALID:  5x - 2 = 8   (same shape, different numbers)"
    ),
    "easier": (
        "Make it EASIER than the solved problem by REMOVING ONE technique "
        "the student had to use. Pick from:\n"
        "  - drop the constant term  (e.g. 5x + 7 = 22  ->  5x = 15, now one-step division)\n"
        "  - drop the coefficient    (e.g. 5x + 7 = 22  ->  x + 7 = 22, now one-step subtraction)\n"
        "  - reduce a multi-step equation to a one-step equation\n"
        "Decrement the difficulty by exactly 1 from the original.\n"
        "VALID:    original 5x + 7 = 22  ->  easier 5x = 15      (one-step, division only)\n"
        "VALID:    original 5x + 7 = 22  ->  easier x + 7 = 22   (one-step, subtraction only)\n"
        "INVALID:  3x + 5 = 14   (same structure, just smaller numbers — not actually easier)\n"
        "INVALID:  2x + 1 = 5    (same two-step shape, different numbers)"
    ),
    "similar": (
        "Make it SIMILAR to the solved problem: keep the same structure and number of steps, "
        "but use different numbers or coefficients so it is not trivially the same question."
    ),
    "scaffold": (
        "The student FAILED the original equation. Generate the EXACT intermediate "
        "equation that results from applying ONE solving step to the original — "
        "usually adding or subtracting the same value from both sides. The scaffold "
        "MUST be a direct algebraic transformation of the original, NOT a different "
        "equation that merely shares the answer.\n"
        "VALID:    original 3x + 2 = 8  ->  scaffold 3x = 6   (subtracted 2 from both sides)\n"
        "INVALID:  5x - 3 = 7    (unrelated equation, even if the answer matches)\n"
        "INVALID:  x = 2         (that is the final answer, not an intermediate step)\n"
        "INVALID:  6x + 4 = 16   (multiplying the original by 2 is not a solving step)\n"
        "The scaffold is easier because one step is already done. Set difficulty "
        "one level below the original."
),
}


def _solve_original(solved_machine_form: str, variable: str) -> str | None:
    """Return the solution to solved_machine_form as a string, or None on failure."""
    try:
        sym = Symbol(variable)
        lhs_str, rhs_str = solved_machine_form.split("=", 1)
        solutions = solve(Eq(sympify(lhs_str.strip()), sympify(rhs_str.strip())), sym)
        if solutions:
            return str(float(solutions[0]))
    except Exception:
        pass
    return None


def generate_problem(
    solved_problem: str,
    solved_machine_form: str,
    variable: str,
    topic: str,
    difficulty: int,
    direction: str = "harder",
) -> dict:
    guidance = _DIRECTION_GUIDANCE.get(direction, _DIRECTION_GUIDANCE["similar"])

    target_answer_line = ""
    if direction == "scaffold" and solved_machine_form and variable:
        
        target = _solve_original(solved_machine_form, variable)
        if target:
            target_answer_line = (
                f"Verification: solving your scaffold for {variable} MUST yield "
                f"{variable} = {target} (the same as the original)."
            )
    prompt = f"""You are an expert maths curriculum designer creating problems for children.

The student just solved this problem:
{solved_problem}

Task: generate ONE new {topic} problem. {guidance}
{target_answer_line}

Target difficulty: {difficulty} (on a 1-10 scale where 1=single-step arithmetic, 10=olympiad reasoning).

Rules for machine_form:
- Always use * for multiplication (never implicit, never ×)
- Equations: write as "lhs = rhs" (e.g. "2*x + 4 = 10")
- Arithmetic: write the full expression (e.g. "6 * 4")
- The expression must be parseable by Python's sympy library

Set problem_type to "equation" if the student must solve for a variable, otherwise "arithmetic".
Set variable to the letter being solved for, or "" for arithmetic.

Use the generate_problem tool to return the problem."""

    client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=600,
        tools=[GENERATE_TOOL],
        tool_choice={"type": "tool", "name": "generate_problem"},
        messages=[{"role": "user", "content": prompt}],
    )

    return message.content[0].input
