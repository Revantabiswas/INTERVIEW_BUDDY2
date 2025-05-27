import os
from langchain_groq import ChatGroq
from langchain_community.chat_models import ChatOpenAI
from functools import lru_cache
from crewai import Agent, Task, Crew, Process
import re
from dotenv import load_dotenv

load_dotenv()

# Replace Streamlit caching with Python's lru_cache
@lru_cache(maxsize=1)
def get_llm():
    # Initialize Groq client
    groq_api_key = os.environ.get("GROQ_API_KEY", "")
    
    # Configure the Groq LLM
    llm = ChatGroq(
        groq_api_key=groq_api_key,
        model_name="groq/qwen-qwq-32b",
    )
    return llm 
    # llm = ChatOpenAI(
    #     model_name="gpt-4o-mini",
    #     temperature=0.5,
    #     timeout=10,
    # )
    # return llm

# Create a function for explanation tasks
def create_explanation_task(agent, question, context):
    """Create a task for explaining concepts using clear, concise language"""
    # Detect if this is a chapter-specific question
    chapter_match = re.search(r"chapter\s+(\d+)", question.lower())
    
    # Base task description
    task_description = f"""Explain the following concept using clear, concise language. 
    Break down complex ideas into manageable parts. Use analogies where helpful.
    
    Question: {question}
    
    Context information:
    {context}
    
    Guidelines:
    1. Start with a direct, clear answer to the question - get straight to the point
    2. Provide relevant examples from the context
    3. Break down complex concepts into simpler parts
    4. Use analogies or comparisons when helpful
    5. Reference specific information from the document when relevant
    6. If the question is unclear or lacks context, ask for clarification
    7. If the context appears to be an index, table of contents, or references section rather than actual content, 
       explain that you need more specific questions about concepts, not just terms from the index
    8. Always provide substantive educational value in your answers, not just listings or metadata
    9. Never respond with raw index entries, reference lists, or page numbers
    10. Focus on explaining the concept rather than reporting document metadata
    """
    
    # Add chapter-specific instructions if applicable
    if chapter_match:
        chapter_num = chapter_match.group(1)
        task_description += f"""
        11. This question is about Chapter {chapter_num}. Focus your answer specifically on the content 
            and concepts from this chapter.
        12. If you can't find sufficient information about Chapter {chapter_num} in the context,
            explain what specific content would help you provide a better answer.
        13. Structure your answer to reflect the organization of Chapter {chapter_num} if possible.
        """
    
    # Additional instructions for when context is thin
    if not context or len(context) < 200:
        task_description += """
        Important: The context information is limited or missing. Please:
        1. Acknowledge the limited information available
        2. Provide general information about the topic based on your knowledge
        3. Explain what specific details from the document would help you give a more complete answer
        4. Suggest alternative questions that might yield better results
        """
    
    # Check if context appears to be primarily index entries
    if context and ("index entries" in context.lower() or 
                  re.search(r"(\w+,\s+\d+[\s,]*)+", context) and len(context) < 500):
        task_description += """
        Important: The context appears to be primarily from an index or reference section rather than
        substantive content. Please:
        1. Explain that you can see references to the topic but not the actual content
        2. Suggest more specific questions about concepts rather than just asking about a chapter or topic name
        3. Provide general information about the topic based on your knowledge
        4. Don't list the index entries or page numbers as they aren't helpful
        """
    
    return Task(
        description=task_description,
        expected_output="A clear, well-structured explanation that directly addresses the question while incorporating relevant context",
        agent=agent
    )

# CrewAI Agents and Tasks
def create_study_tutor_agent():
    return Agent(
        role="Study Tutor",
        goal="Explain complex concepts clearly and help students understand course material",
        backstory="""You are an expert educator with years of experience breaking down difficult concepts 
        into understandable explanations. You excel at adapting your teaching style to match different 
        learning preferences and maintaining engaging conversations.
        
        Your key strengths include:
        1. Breaking down complex topics into digestible pieces
        2. Providing clear, concrete examples
        3. Using analogies to connect new concepts with familiar ones
        4. Maintaining context across a conversation
        5. Identifying and addressing gaps in understanding
        6. Encouraging critical thinking and deeper exploration
        7. Adapting explanations based on the student's responses
        8. Referencing source material effectively
        
        You aim to not just answer questions, but to ensure deep understanding and 
        help students build connections between different concepts.""",
        llm=get_llm(),
        verbose=True
    )

def create_note_taker_agent():
    return Agent(
        role="Note-Taker",
        goal="Create organized, comprehensive study notes",
        backstory="You specialize in creating concise yet comprehensive notes that highlight key concepts, definitions, examples, and connections between ideas. Your notes are well-structured with clear headings and logical flow.",
        llm=get_llm(),
        verbose=True
    )

def create_assessment_expert_agent():
    return Agent(
        role="Assessment Expert",
        goal="Design tests to evaluate understanding at different complexity levels",
        backstory="You are skilled at creating varied assessment questions that test different levels of knowledge, from basic recall to complex application. You can generate quizzes ranging from simple to advanced difficulty.",
        llm=get_llm(),
        verbose=True
    )

def create_flashcard_specialist_agent():
    return Agent(
        role="Flashcard Specialist",
        goal="Create effective memory aids through well-crafted flashcards",
        backstory="You excel at distilling complex information into concise flashcards that facilitate memorization and recall. You know how to balance brevity with clarity to create effective study tools.",
        llm=get_llm(),
        verbose=True
    )

def create_visual_learning_expert_agent():
    return Agent(
        role="Visual Learning Expert",
        goal="Transform topics into visual mind maps that show relationships between concepts",
        backstory="You have expertise in visual learning techniques and can organize information into clear, meaningful visual representations. You excel at identifying key relationships between concepts and presenting them graphically.",
        llm=get_llm(),
        verbose=True
    )

def create_learning_coach_agent():
    return Agent(
        role="Learning Coach",
        goal="Analyze performance and suggest learning improvements",
        backstory="You specialize in analyzing learning patterns and progress to provide targeted feedback and improvement strategies. Your coaching helps students identify and overcome knowledge gaps.",
        llm=get_llm(),
        verbose=True
    )

def create_roadmap_planner_agent():
    return Agent(
        role="Study Roadmap Planner",
        goal="Create structured study plans with clear timelines and milestones",
        backstory="You are an expert in educational planning with years of experience creating effective study roadmaps. You excel at breaking down complex materials into manageable learning paths with realistic timeframes.",
        llm=get_llm(),
        verbose=True
    )

# DSA Interview Preparation Agents
def create_question_fetching_agent():
    return Agent(
        role="Question Fetcher",
        goal="Retrieve relevant DSA questions from databases and APIs based on specified criteria",
        backstory="You are an expert at navigating various question repositories and finding the most appropriate practice problems. You understand different DSA topics deeply and can categorize questions accurately.",
        llm=get_llm(),
        verbose=True
    )

def create_filtering_agent():
    return Agent(
        role="Question Filter",
        goal="Filter and organize DSA questions based on user preferences and requirements",
        backstory="You specialize in understanding user needs and organizing questions for optimal learning. You can analyze question difficulty, topics, and relevance to specific companies or roles.",
        llm=get_llm(),
        verbose=True
    )

def create_progress_tracking_agent():
    return Agent(
        role="Progress Tracker",
        goal="Track and analyze user progress on DSA practice",
        backstory="You excel at monitoring learning patterns and identifying strengths and improvement areas. You understand how to measure progress across different question types and difficulty levels.",
        llm=get_llm(),
        verbose=True
    )

def create_personalization_agent():
    return Agent(
        role="Interview Personalizer",
        goal="Customize question sets based on user career goals",
        backstory="You have detailed knowledge of what different companies and roles require. You can create targeted practice plans that align with specific career objectives and salary expectations.",
        llm=get_llm(),
        verbose=True
    )

def create_debugging_agent():
    return Agent(
        role="Code Debugger",
        goal="Analyze code solutions and provide debugging assistance",
        backstory="You are an expert programmer with deep knowledge of multiple programming languages and common DSA implementation pitfalls. You can quickly identify bugs and suggest optimizations.",
        llm=get_llm(),
        verbose=True
    )

# DSA Interview Preparation Specialized Agents
def create_dsa_recommendation_agent():
    """Create an agent specialized in recommending DSA problems based on user profile and goals"""
    return Agent(
        role="DSA Problem Recommender",
        goal="Recommend optimal DSA problems tailored to the user's skill level and interview targets",
        backstory="You are a seasoned technical interview coach with deep knowledge of data structures and algorithms. "
                "You've helped hundreds of candidates prepare for top tech companies and understand the patterns "
                "each company tends to focus on. You excel at creating personalized study plans based on a "
                "candidate's background, target companies, and available preparation time.",
        llm=get_llm(),
        verbose=True
    )

def create_dsa_expert_agent():
    """Create a general DSA expert agent for various DSA-related tasks"""
    return Agent(
        role="DSA Expert",
        goal="Provide comprehensive assistance with data structures and algorithms for interview preparation",
        backstory="You are an expert in data structures and algorithms with extensive experience in technical interviews. "
                "You have a deep understanding of problem-solving techniques, algorithm design, and implementation. "
                "You can generate practice questions, create study plans, and analyze code solutions to help candidates "
                "prepare effectively for technical interviews.",
        llm=get_llm(),
        verbose=True
    )

def create_coding_pattern_agent():
    """Create an agent that identifies common coding patterns and teaches problem-solving approaches"""
    return Agent(
        role="Coding Pattern Expert",
        goal="Identify common DSA patterns and teach reusable problem-solving strategies",
        backstory="You are an algorithm design expert who specializes in recognizing common patterns across seemingly "
                "different problems. You help students develop a pattern-based approach to DSA problems rather than "
                "memorizing individual solutions. You can break down complex problems into familiar patterns and "
                "explain the underlying principles that connect different questions.",
        llm=get_llm(),
        verbose=True
    )

def create_interview_strategy_agent():
    """Create an agent that helps with overall interview strategy and approach"""
    return Agent(
        role="Technical Interview Strategist",
        goal="Provide strategies for excelling in technical interviews beyond just solving the problems",
        backstory="You are an expert in technical interview preparation with experience as both a candidate and "
                "an interviewer at major tech companies. You understand that success in technical interviews "
                "requires more than just solving problems - it requires clear communication, asking clarifying "
                "questions, discussing trade-offs, and demonstrating problem-solving thought processes. You "
                "help candidates develop these meta-skills alongside their technical knowledge.",
        llm=get_llm(),
        verbose=True
    )

def create_company_specific_agent():
    """Create an agent with expertise in specific company interview patterns"""
    return Agent(
        role="Company Interview Expert",
        goal="Provide tailored advice for specific company interview processes",
        backstory="You have extensive knowledge about the unique interview processes and preferences of major "
                "tech companies. You understand how Amazon's leadership principles influence their questions, "
                "how Google emphasizes algorithm efficiency, how Facebook focuses on scale, and how Microsoft "
                "looks for well-rounded problem solvers. You help candidates customize their preparation for "
                "specific target companies.",
        llm=get_llm(),
        verbose=True
    )

def create_notes_generation_task(agent, topic, context):
    return Task(
        description=f"""Create comprehensive, well-structured study notes on the following topic. 
        Include key concepts, definitions, examples, and relationships between ideas. 
        Organize with clear headings and subheadings.
        
        Topic: {topic}
        
        Context information:
        {context}
        """,
        expected_output="Well-structured study notes in markdown format with headings, bullet points, and emphasis on key concepts.",
        agent=agent
    )

def create_test_generation_task(agent, topic, difficulty, context):
    return Task(
        description=f"""Create a practice test on the following topic with {difficulty} difficulty level.
        Include a mix of question types (multiple choice, short answer, essay questions).
        Provide an answer key with explanations.
        
        Topic: {topic}
        Difficulty: {difficulty}
        
        Context information:
        {context}
        """,
        expected_output="A practice test with varied question types and a comprehensive answer key.",
        agent=agent
    )

def create_enhanced_test_generation_task(agent, topic, difficulty, context, **kwargs):
    """Create an enhanced test generation task with additional exam-specific parameters"""
    question_count = kwargs.get("question_count", 20)
    subject = kwargs.get("subject", "General")
    board = kwargs.get("board", "")
    class_level = kwargs.get("class_level", "")
    with_difficulty_levels = kwargs.get("with_difficulty_levels", False)
    with_topic_tags = kwargs.get("with_topic_tags", False)
    with_time_estimates = kwargs.get("with_time_estimates", False)
    time_limit = kwargs.get("time_limit", 60)
    
    # Build board and class context
    board_context = ""
    if board and class_level:
        board_context = f"This test is for {board.upper()} Class {class_level} curriculum. "
    elif board:
        board_context = f"This test follows {board.upper()} curriculum standards. "
    
    # Build additional requirements
    additional_requirements = []
    if with_difficulty_levels:
        additional_requirements.append("- Include difficulty level (Easy/Medium/Hard) for each question")
    if with_topic_tags:
        additional_requirements.append("- Add topic tags for each question")
    if with_time_estimates:
        additional_requirements.append("- Provide estimated time to solve each question")
    
    additional_req_text = "\n".join(additional_requirements) if additional_requirements else ""
    
    return Task(
        description=f"""Create a comprehensive exam practice test with the following specifications:

        Subject: {subject}
        Topic: {topic}
        Difficulty: {difficulty}
        Number of Questions: {question_count}
        Time Limit: {time_limit} minutes
        {board_context}
        
        Context information:
        {context}
        
        EXAM FORMAT REQUIREMENTS:
        1. Create exactly {question_count} questions
        2. Include a balanced mix of question types:
           - Multiple Choice Questions (60%)
           - Short Answer Questions (25%)
           - Long Answer Questions (15%)
        3. Ensure questions are appropriate for {difficulty} difficulty level
        4. Questions should be relevant to the {subject} curriculum
        5. Include clear instructions for each section
        
        QUESTION QUALITY STANDARDS:
        - Each question should test specific learning objectives
        - Questions should be clear, unambiguous, and grammatically correct
        - Multiple choice options should be plausible and distinct
        - Avoid trivial or overly complex questions
        - Ensure questions cover different aspects of the topic
        
        OUTPUT FORMAT:
        Structure your response as a JSON object with the following format:
        {{
            "exam_info": {{
                "title": "Test title",
                "subject": "{subject}",
                "topic": "{topic}",
                "difficulty": "{difficulty}",
                "total_questions": {question_count},
                "time_limit": {time_limit},
                "instructions": "General test instructions"
            }},
            "sections": [
                {{
                    "section_name": "Multiple Choice Questions",
                    "instructions": "Choose the best answer for each question",
                    "questions": [
                        {{
                            "id": 1,
                            "type": "mcq",
                            "question": "Question text here",
                            "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
                            "correct_answer": "A",
                            "explanation": "Detailed explanation of the correct answer",
                            "marks": 1,
                            "topic_tag": "Specific topic",
                            "difficulty_level": "Easy/Medium/Hard",
                            "estimated_time": 2
                        }}
                    ]
                }},
                {{
                    "section_name": "Short Answer Questions",
                    "instructions": "Provide brief answers (2-3 sentences)",
                    "questions": [
                        {{
                            "id": 13,
                            "type": "short",
                            "question": "Question text here",
                            "sample_answer": "Expected answer",
                            "marking_scheme": "Key points to award marks",
                            "marks": 3,
                            "topic_tag": "Specific topic",
                            "difficulty_level": "Medium",
                            "estimated_time": 5
                        }}
                    ]
                }},
                {{
                    "section_name": "Long Answer Questions",
                    "instructions": "Provide detailed answers with explanations",
                    "questions": [
                        {{
                            "id": 18,
                            "type": "long",
                            "question": "Question text here",
                            "sample_answer": "Comprehensive expected answer",
                            "marking_scheme": "Detailed marking criteria",
                            "marks": 5,
                            "topic_tag": "Specific topic", 
                            "difficulty_level": "Hard",
                            "estimated_time": 10
                        }}
                    ]
                }}
            ],
            "total_marks": 100,
            "marking_scheme": "General marking guidelines"
        }}
        
        ADDITIONAL REQUIREMENTS:
        {additional_req_text}
        
        Ensure the test is comprehensive, well-structured, and appropriate for the specified academic level.
        """,
        expected_output="A comprehensive exam in JSON format with multiple sections, detailed questions, and complete marking scheme.",
        agent=agent
    )

def create_flashcard_generation_task(agent, topic, context, num_cards=10):
    return Task(
        description=f"""Create a set of {num_cards} flashcards for the following topic.
        Each flashcard should have a clear question/term on the front side and a concise answer/definition on the back side.
        Focus on key concepts, definitions, formulas, and important facts.
        
        Topic: {topic}
        Number of cards to generate: {num_cards}
        
        Context information:
        {context}
        
        IMPORTANT FORMATTING INSTRUCTIONS:
        1. Output the flashcards in JSON format as an array of objects
        2. Each flashcard object MUST have exactly two fields: "front" and "back"
        3. The "front" should contain a clear, concise question or term (typically 1-2 sentences)
        4. The "back" should contain a comprehensive yet concise answer or explanation (typically 1-3 sentences)
        5. Ensure the front and back are related and form a logical pair
        6. Do NOT include any markdown formatting, just plain text
        7. Do NOT include card numbers or labels like "Card 1:" in the content
        8. Make sure content is appropriate for flashcard display (not too long)
        9. IMPORTANT: Avoid using percentage signs (%) in your content as they can cause formatting issues
        10. Always use complete sentences and proper grammar
        
        EXAMPLE FORMAT (but create your own content):
        [
          {{
            "front": "What is a binary search tree?",
            "back": "A binary tree data structure where each node has at most two children, with all left descendants less than the node and all right descendants greater than the node."
          }},
          {{
            "front": "What is time complexity?",
            "back": "A measure of the amount of time an algorithm takes to run as a function of the length of the input."
          }}
        ]
        
        Remember to extract the most important concepts from the context that are related to the topic and create high-quality, educational flashcards.
        """,
        expected_output="A JSON array of flashcard objects, each with 'front' and 'back' fields in proper format for display.",
        agent=agent
    )

def create_mind_map_task(agent, topic, context):
    return Task(
        description=f"""Create a detailed mind map for the following topic. Follow the specific formatting instructions below.
        
        Topic: {topic}
        
        Context information:
        {context}
        
        FORMATTING INSTRUCTIONS:
        
        1. Begin with identifying the central concept that best represents the topic
        
        2. Identify 4-8 main branches (key concepts/categories) that connect directly to the central concept
        
        3. For each main branch, identify 2-5 sub-branches (related concepts, details, or examples)
        
        4. Structure your response in a hierarchical format showing:
          - Central concept (the topic)
          - Main branches (key concepts)
          - Sub-branches for each main branch
        
        5. IMPORTANT: Use a clear hierarchical format with the following levels:
          - Central Concept/Topic: The main subject
          - Branch 1: First key concept
              - Sub-branch 1.1: Detail or example for Branch 1
              - Sub-branch 1.2: Another detail or example for Branch 1
          - Branch 2: Second key concept
              - Sub-branch 2.1: Detail or example for Branch 2
          - ...and so on
        
        6. Ensure concepts and relationships are clearly labeled and accurate based on the context information.
        
        7. Keep branch and sub-branch descriptions concise (preferably under 60 characters) to fit well in the visualization.
        
        Remember that this mind map will be visualized as an interactive diagram with nodes and connections, so focus on creating a clear hierarchical structure that shows the relationships between concepts.
        """,
        expected_output="A detailed mind map with central concept, branches, and sub-branches in a clear hierarchical format.",
        agent=agent
    )

def create_progress_analysis_task(agent, performance_data):
    return Task(
        description=f"""Analyze the student's performance data and provide insights and recommendations.
        Identify strengths, weaknesses, and areas for improvement.
        Suggest specific study strategies tailored to the student's needs.
        
        Performance Data:
        {performance_data}
        """,
        expected_output="A detailed analysis of performance with specific recommendations for improvement.",
        agent=agent
    )

def create_roadmap_generation_task(agent, document_name, days_available, hours_per_day, context):
    return Task(
        description=f"""Create a comprehensive study roadmap for the document '{document_name}'.
        The student has {days_available} days available with approximately {hours_per_day} hours per day for studying.
        
        Break down the material into logical sections, create a day-by-day schedule, and include:
        1. Clear milestones and checkpoints
        2. Estimated time needed for each section
        3. Topics to focus on each day
        4. Recommended breaks and review sessions
        5. Suggested practice exercises or self-assessments
        
        Context information from the document:
        {context}
        """,
        expected_output="A detailed study roadmap in a structured format that can be easily visualized, with day-by-day plan and clear milestones.",
        agent=agent
    )

def create_quick_roadmap_generation_task(agent, document_name, days_available, hours_per_day, context):
    return Task(
        description=f"""Create a simplified study roadmap overview for '{document_name}' in {days_available} days with {hours_per_day} hours per day.
        
        Focus on:
        1. Major topic areas and their sequence
        2. Key milestones
        3. High-level time allocation
        
        Keep the plan concise and actionable. No need for detailed day-by-day breakdowns.
        
        Context information:
        {context}
        """,
        expected_output="A simplified study roadmap overview with main topic areas and milestones.",
        agent=agent
    )

# DSA Interview Preparation Tasks
def create_question_fetching_task(agent, api_endpoint, categories, metadata):
    return Task(
        description=f"""Fetch appropriate DSA questions from the specified source.
        
        API Endpoint: {api_endpoint}
        Categories: {categories}
        Question Metadata:
        - Difficulty: {metadata.get('difficulty', 'All')}
        - Topics: {metadata.get('topics', 'All')}
        - Platform: {metadata.get('platform', 'All')}
        - Company: {metadata.get('company', 'All')}
        - Role: {metadata.get('role', 'All')}
        - Salary Level: {metadata.get('salary_level', 'All')}
        """,
        expected_output="A comprehensive list of DSA questions with their details, including problem statement, input/output examples, and relevant metadata.",
        agent=agent
    )

def create_filtering_task(agent, questions, filters):
    return Task(
        description=f"""Filter the provided list of DSA questions based on user preferences.
        
        User Selected Filters:
        - Difficulty: {filters.get('difficulty', 'All')}
        - Topics: {filters.get('topics', 'All')}
        - Platform: {filters.get('platform', 'All')}
        - Company: {filters.get('company', 'All')}
        - Role: {filters.get('role', 'All')}
        - Salary Level: {filters.get('salary_level', 'All')}
        
        Questions to filter:
        {questions}
        """,
        expected_output="A filtered list of questions that match the user's criteria, organized by relevance and difficulty progression.",
        agent=agent
    )

def create_progress_tracking_task(agent, user_progress, completed_questions):
    return Task(
        description=f"""Analyze the user's progress on DSA questions and provide insights.
        
        User Progress Data:
        {user_progress}
        
        Completed Questions:
        {completed_questions}
        """,
        expected_output="Detailed progress metrics including completion rates by topic and difficulty, areas of strength, and suggested focus areas for improvement.",
        agent=agent
    )

def create_personalization_task(agent, questions, user_goals):
    return Task(
        description=f"""Create a personalized DSA practice plan based on the user's career goals.
        
        Available Questions:
        {questions}
        
        User Goals:
        - Target Company: {user_goals.get('target_company', 'Not specified')}
        - Target Role: {user_goals.get('target_role', 'Not specified')}
        - Target Salary: {user_goals.get('target_salary', 'Not specified')}
        - Timeline: {user_goals.get('timeline', 'Not specified')}
        """,
        expected_output="A personalized list of questions and study plan tailored to the user's specific career goals and timeline.",
        agent=agent
    )

def create_debugging_task(agent, user_code, problem_statement, language):
    return Task(
        description=f"""Analyze and debug the user's code solution for the given DSA problem.
        
        Problem Statement:
        {problem_statement}
        
        User's Solution ({language}):
        {user_code}
        """,
        expected_output="Detailed code analysis including identified bugs, optimization suggestions, time and space complexity analysis, and improved code examples.",
        agent=agent
    )

# DSA-specific Tasks
def create_dsa_recommendation_task(agent, user_profile, target_companies=None, difficulty_level=None, topics=None):
    """Create a task for recommending appropriate DSA problems"""
    return Task(
        description=f"""Based on the user's profile and preferences, recommend the most suitable DSA problems 
        for their interview preparation.
        
        User Profile:
        {user_profile}
        
        Target Companies: {target_companies if target_companies else "Not specified"}
        Preferred Difficulty: {difficulty_level if difficulty_level else "Any"}
        Preferred Topics: {topics if topics else "All topics"}
        
        Provide a curated list of 5-10 problems that will help the user effectively prepare,
        with brief explanations of why each problem is relevant to their goals.
        """,
        expected_output="A list of recommended DSA problems with explanations tailored to the user's needs.",
        agent=agent
    )

def create_dsa_question_generation_task(agent, topic=None, difficulty=None, count=5):
    """Create a task for generating DSA practice questions"""
    return Task(
        description=f"""Generate {count} DSA practice questions.
        
        Topic: {topic if topic else "Any DSA topic"}
        Difficulty: {difficulty if difficulty else "Mixed difficulty levels"}
        
        For each question, provide:
        1. A clear problem statement
        2. Input/output examples
        3. Constraints
        4. Difficulty level
        5. Topics covered
        6. Companies that commonly ask this type of question
        7. A brief explanation of the approach (without the full solution)
        """,
        expected_output=f"A list of {count} DSA practice questions with complete details.",
        agent=agent
    )

def create_dsa_plan_generation_task(agent, days_available, hours_per_day):
    """Create a task for generating a personalized DSA study plan"""
    return Task(
        description=f"""Create a personalized DSA study plan for a candidate with {days_available} days available 
        and approximately {hours_per_day} hours per day for studying.
        
        The plan should include:
        1. A day-by-day breakdown of topics to study
        2. Recommended practice problems for each topic
        3. Milestones and checkpoints to track progress
        4. Time allocation for different activities (learning, practice, review)
        5. Tips for effective study and preparation
        6. Resources and references for each topic
        """,
        expected_output="A comprehensive DSA study plan with day-by-day schedule and resources.",
        agent=agent
    )

def create_dsa_code_analysis_task(agent, code, language, problem=None):
    """Create a task for analyzing DSA code solutions"""
    
    problem_context = f"Problem: {problem}\n\n" if problem else ""
    
    return Task(
        description=f"""Analyze the following {language} code solution for a DSA problem:
        
        {problem_context}Code:
        {code}
        
        Provide a comprehensive analysis including:
        1. Correctness assessment - identify any bugs or issues in the code
        2. Time complexity analysis
        3. Space complexity analysis
        4. Potential optimizations
        5. Edge cases that might not be handled
        6. Best practices and coding style feedback
        7. Improved version of the code that fixes any identified issues
        
        Format your response clearly with these sections:
        - BUGS: List of identified bugs or issues (as bullet points)
        - OPTIMIZATIONS: Suggestions for improving the code efficiency
        - IMPROVED_CODE: A corrected and optimized version of the code
        - TIME_COMPLEXITY: Analysis of the time complexity
        - SPACE_COMPLEXITY: Analysis of the space complexity
        - EXPLANATION: A clear explanation of what was wrong with the original code and how the improved version fixes the issues
        
        Ensure your response can be parsed into these distinct sections for use in a debugging tool.
        """,
        expected_output="A detailed code analysis with bugs, optimizations, improved code, complexity metrics, and explanation.",
        agent=agent
    )

def create_pattern_identification_task(agent, problem_description, similar_problems=None):
    """Create a task for identifying patterns in DSA problems"""
    return Task(
        description=f"""Analyze the given DSA problem and identify the underlying patterns and problem-solving techniques.
        
        Problem Description:
        {problem_description}
        
        Similar Problems (if available):
        {similar_problems if similar_problems else "Not provided"}
        
        Provide:
        1. The core pattern(s) present in this problem
        2. General solution approach for this category of problems
        3. Common variations of this pattern
        4. Tips for recognizing this pattern in future problems
        """,
        expected_output="A comprehensive analysis of the problem's pattern with a reusable solution approach.",
        agent=agent
    )

def create_company_preparation_task(agent, company_name, user_experience=None, available_time=None):
    """Create a task for company-specific interview preparation"""
    return Task(
        description=f"""Create a tailored preparation plan for {company_name} technical interviews.
        
        User Experience: {user_experience if user_experience else "Not specified"}
        Available Preparation Time: {available_time if available_time else "Not specified"}
        
        Provide:
        1. Key focus areas for {company_name} interviews
        2. Company-specific interview format and process details
        3. Most commonly asked question types and topics
        4. Recommended preparation strategy and timeline
        5. Additional tips specific to {company_name}
        """,
        expected_output=f"A comprehensive preparation plan tailored specifically for {company_name} interviews.",
        agent=agent
    )

def create_mock_interview_task(agent, problem, difficulty, company_context=None):
    """Create a task for conducting a mock interview"""
    return Task(
        description=f"""Conduct a mock technical interview focused on the following problem:
        
        Problem: {problem}
        Difficulty: {difficulty}
        Company Context: {company_context if company_context else "General technical interview"}
        
        Play the role of both interviewer and guide:
        1. Present the problem clearly as an interviewer would
        2. Provide hints if the user gets stuck
        3. Ask appropriate follow-up questions
        4. Evaluate the approach and solution
        5. Provide constructive feedback
        """,
        expected_output="A simulated technical interview experience with problem presentation, guidance, and feedback.",
        agent=agent
    )

def run_agent_task(agent, task):
    """Execute a single agent task and return the result"""
    crew = Crew(
        agents=[agent],
        tasks=[task],
        verbose=True,
        process=Process.sequential
    )
    
    result = crew.kickoff()
    
    # Handle different result types
    if hasattr(result, 'raw_output'):
        return result.raw_output
    else:
        return str(result)
