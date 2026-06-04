from sympy import sympify, Eq, solve, Symbol


def solution_preserved(solved_machine_form: str, variable: str, result: dict) -> bool:
    """Check the new problem shares the same correct answer as the original."""
    try:
        sym = Symbol(variable)
        lhs_str, rhs_str = solved_machine_form.split("=", 1)
        original_solutions = solve(Eq(sympify(lhs_str.strip()), sympify(rhs_str.strip())), sym)
        if not original_solutions:
            return False
        original_answer = float(original_solutions[0])
        return abs(float(result["correct_answer"]) - original_answer) < 1e-9
    except Exception:
        return False


def verify(result: dict) -> bool:
    try:
        machine_form = result["machine_form"]
        correct_answer = result["correct_answer"]
        problem_type = result["problem_type"]
        expected = float(correct_answer)

        if problem_type == "equation":
            variable = result["variable"]
            lhs_str, rhs_str = machine_form.split("=", 1)
            sym = Symbol(variable)
            lhs = sympify(lhs_str.strip())
            rhs = sympify(rhs_str.strip())
            solutions = solve(Eq(lhs, rhs), sym)
            return any(abs(float(sol) - expected) < 1e-9 for sol in solutions)

        else:  # arithmetic
            value = float(sympify(machine_form))
            return abs(value - expected) < 1e-9

    except Exception:
        return False
