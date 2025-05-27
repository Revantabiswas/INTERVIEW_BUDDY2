from typing import Dict, Any, List

def create_exam_test_generation_task(agent, topic, difficulty, context, **kwargs):
    """
    Create a test generation task with advanced parameters for the assessment expert.
    
    Args:
        agent: The agent to use for test generation
        topic: The topic to generate a test for
        difficulty: The difficulty level of the test
        context: Context information to help generate the test
        **kwargs: Additional parameters for the test
    
    Returns:
        A test generation task
    """
    question_count = kwargs.get("question_count", 10)
    subject = kwargs.get("subject")
    board = kwargs.get("board")
    class_level = kwargs.get("class_level")
    with_difficulty_levels = kwargs.get("with_difficulty_levels", False)
    with_topic_tags = kwargs.get("with_topic_tags", False)
    with_time_estimates = kwargs.get("with_time_estimates", False)
    
    # Base prompt
    prompt = f"""Generate a {difficulty} difficulty test on {topic}. 
The test should have {question_count} multiple-choice questions, each with 4 options.
"""

    # Add subject, board, class info if available
    if subject:
        prompt += f"Subject: {subject}\n"
    if board:
        prompt += f"Board/Exam: {board}\n"
    if class_level:
        prompt += f"Class/Grade: {class_level}\n"
    
    # Add additional parameters
    if with_difficulty_levels:
        prompt += "Include a difficulty level (Easy, Medium, or Hard) for each question.\n"
    if with_topic_tags:
        prompt += "Tag each question with its specific sub-topic.\n"
    if with_time_estimates:
        prompt += "Provide an estimated time in seconds to solve each question.\n"
        
    # Add format requirements
    prompt += """
For each question:
1. Provide a clear, concise question.
2. Include 4 options labeled A, B, C, and D.
3. Include the correct answer.

Please format the output as valid JSON with the following structure:
```json
{
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "difficulty": "Medium", 
      "topic": "Specific topic",
      "expected_time": 60,
      "marks": 1
    }
  ],
  "answer_key": {
    "q1": "A",
    "q2": "B"
  }
}
```
"""

    # Add context if available
    if context:
        prompt += f"\nUse the following context to generate relevant questions:\n\n{context}"
    
    from agents import create_enhanced_test_generation_task
    return create_enhanced_test_generation_task(
        agent, 
        topic, 
        difficulty, 
        context,
        question_count=question_count,
        subject=subject,
        board=board, 
        class_level=class_level,
        with_difficulty_levels=with_difficulty_levels,
        with_topic_tags=with_topic_tags,
        with_time_estimates=with_time_estimates
    )
