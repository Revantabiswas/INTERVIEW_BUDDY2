import os
import time
import uuid
from datetime import datetime
from pathlib import Path

# UI and visualization
import streamlit as st
import matplotlib.pyplot as plt
import networkx as nx
from pyvis.network import Network
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import json

# Import from our new modules
from agents import (
    get_llm, create_study_tutor_agent, create_note_taker_agent, 
    create_assessment_expert_agent, create_flashcard_specialist_agent,
    create_visual_learning_expert_agent, create_learning_coach_agent, 
    create_roadmap_planner_agent, create_explanation_task, create_notes_generation_task,
    create_test_generation_task, create_flashcard_generation_task, create_mind_map_task,
    create_progress_analysis_task, create_roadmap_generation_task,
    create_quick_roadmap_generation_task, run_agent_task,
    # Add new DSA-specific agent imports
    create_question_fetching_agent, create_filtering_agent, create_progress_tracking_agent,
    create_personalization_agent, create_debugging_agent, create_dsa_recommendation_agent,
    create_coding_pattern_agent, create_interview_strategy_agent, create_company_specific_agent,
    # Add new DSA-specific task imports
    create_question_fetching_task, create_filtering_task, create_progress_tracking_task,
    create_personalization_task, create_debugging_task, create_dsa_recommendation_task,
    create_pattern_identification_task, create_company_preparation_task, create_mock_interview_task
)

from utils import (
    process_document, create_vector_store, get_document_context,
    generate_mind_map_data, parse_flashcards_from_text, parse_test_from_text,
    parse_roadmap_from_text, MAX_CHUNK_SIZE, OVERLAP_SIZE, BATCH_SIZE, 
    get_sample_dsa_questions, calculate_dsa_progress_metrics, parse_code_analysis
)

# Set page configuration
st.set_page_config(
    page_title="StudyBuddy AI",
    page_icon="📚",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Define directory paths
BASE_DIR = Path("./studybuddy_data")
CACHE_DIR = BASE_DIR / "cache"
DOCS_DIR = BASE_DIR / "documents"
NOTES_DIR = BASE_DIR / "notes"
FLASHCARDS_DIR = BASE_DIR / "flashcards"
TESTS_DIR = BASE_DIR / "tests"
PROGRESS_DIR = BASE_DIR / "progress"
ROADMAPS_DIR = BASE_DIR / "roadmaps"

# Create directories if they don't exist
for directory in [BASE_DIR, CACHE_DIR, DOCS_DIR, NOTES_DIR, FLASHCARDS_DIR, TESTS_DIR, PROGRESS_DIR, ROADMAPS_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Initialize session state
if 'current_time' not in st.session_state:
    st.session_state.current_time = datetime.now().isoformat()
if 'documents' not in st.session_state:
    st.session_state.documents = {}
if 'vectorstore' not in st.session_state:
    st.session_state.vectorstore = None
if 'chat_history' not in st.session_state:
    st.session_state.chat_history = []
if 'current_document' not in st.session_state:
    st.session_state.current_document = None
if 'study_notes' not in st.session_state:
    st.session_state.study_notes = {}
if 'flashcards' not in st.session_state:
    st.session_state.flashcards = {}
if 'tests' not in st.session_state:
    st.session_state.tests = {}
if 'mind_maps' not in st.session_state:
    st.session_state.mind_maps = {}
if 'progress_data' not in st.session_state:
    st.session_state.progress_data = {}
if 'current_tab' not in st.session_state:
    st.session_state.current_tab = "Home"
if 'roadmaps' not in st.session_state:
    st.session_state.roadmaps = {}
if 'dsa_questions' not in st.session_state:
    st.session_state.dsa_questions = {}
if 'dsa_progress' not in st.session_state:
    st.session_state.dsa_progress = {"questions": []}
if 'current_dsa_question' not in st.session_state:
    st.session_state.current_dsa_question = None
if 'user_code_solutions' not in st.session_state:
    st.session_state.user_code_solutions = {}
if 'dsa_selected_topic' not in st.session_state:
    st.session_state.dsa_selected_topic = None
if 'dsa_selected_company' not in st.session_state:
    st.session_state.dsa_selected_company = None
if 'dsa_difficulty' not in st.session_state:
    st.session_state.dsa_difficulty = "All"

# Initialize additional session states for enhanced DSA features
if 'solved_questions' not in st.session_state:
    st.session_state.solved_questions = set()
if 'dsa_practice_history' not in st.session_state:
    st.session_state.dsa_practice_history = []
if 'personalized_questions' not in st.session_state:
    st.session_state.personalized_questions = {}
if 'favorite_questions' not in st.session_state:
    st.session_state.favorite_questions = set()
if 'current_study_plan' not in st.session_state:
    st.session_state.current_study_plan = None
if 'code_analysis_results' not in st.session_state:
    st.session_state.code_analysis_results = {}

# UI Components
def sidebar():
    with st.sidebar:
        st.title("StudyBuddy AI")
        st.markdown("Your AI-powered study companion")
        
        # Navigation
        st.subheader("Navigation")
        if st.button("📚 Home", use_container_width=True):
            st.session_state.current_tab = "Home"
        if st.button("💬 Chat", use_container_width=True):
            st.session_state.current_tab = "Chat"
        if st.button("📝 Study Notes", use_container_width=True):
            st.session_state.current_tab = "Notes"
        if st.button("🎴 Flashcards", use_container_width=True):
            st.session_state.current_tab = "Flashcards"
        if st.button("🧠 Mind Maps", use_container_width=True):
            st.session_state.current_tab = "MindMaps"
        if st.button("🗺️ Roadmaps", use_container_width=True):
            st.session_state.current_tab = "Roadmaps"
        if st.button("📊 Tests", use_container_width=True):
            st.session_state.current_tab = "Tests"
        if st.button("🧩 DSA Interview Prep", use_container_width=True):
            st.session_state.current_tab = "DSA"
        if st.button("📈 Progress", use_container_width=True):
            st.session_state.current_tab = "Progress"
        if st.button("⚙️ Settings", use_container_width=True):
            st.session_state.current_tab = "Settings"
            
        st.markdown("---")
        
        # Document upload
        st.subheader("Upload Study Material")
        uploaded_file = st.file_uploader("Choose a PDF, DOCX or TXT file", type=["pdf", "docx", "txt"])
        
        if uploaded_file is not None:
            if st.button("Process Document", use_container_width=True):
                with st.spinner("Processing document..."):
                    progress_bar = st.progress(0)
                    doc_info = process_document(uploaded_file, CACHE_DIR, progress_bar)
                    if doc_info:
                        st.session_state.current_document = doc_info['filename']
                        st.session_state.documents[doc_info['filename']] = doc_info
                        with st.spinner("Creating vector store for semantic search..."):
                            st.session_state.vectorstore = create_vector_store(doc_info, CACHE_DIR)
                        st.success(f"Processed {doc_info['filename']} ({doc_info['pages']} pages)")
                    else:
                        st.error("Failed to process document")
                    progress_bar.empty()
        
        # Document selection
        if st.session_state.documents:
            st.subheader("Your Documents")
            doc_names = list(st.session_state.documents.keys())
            for doc_name in doc_names:
                if st.button(f"📄 {doc_name}", key=f"select_{doc_name}", use_container_width=True):
                    st.session_state.current_document = doc_name
                    doc_info = st.session_state.documents[doc_name]
                    with st.spinner("Loading document..."):
                        st.session_state.vectorstore = create_vector_store(doc_info, CACHE_DIR)
                    st.success(f"Loaded {doc_name}")

def home_tab():
    st.header("📚 StudyBuddy AI")
    st.markdown("""
    Welcome to StudyBuddy AI, your personalized AI study companion!
    
    ### How to use StudyBuddy:
    1. **Upload your study materials** (PDF, DOCX, or TXT files) in the sidebar
    2. **Chat with StudyBuddy** to ask questions about your content
    3. **Generate study notes** on specific topics
    4. **Create flashcards** to help with memorization
    5. **Visualize connections** between concepts with mind maps
    6. **Test your knowledge** with custom practice tests
    7. **Track your progress** over time
    
    Get started by uploading a document in the sidebar!
    """)
    if st.session_state.current_document:
        st.success(f"Currently loaded: {st.session_state.current_document}")
        if st.button("Ask questions about this document"):
            st.session_state.current_tab = "Chat"
    else:
        st.info("No document loaded. Please upload a document to begin.")

def chat_tab():
    st.header("💬 Chat with StudyBuddy")
    if not st.session_state.current_document:
        st.warning("Please upload and select a document first.")
        return
    st.markdown(f"Ask questions about **{st.session_state.current_document}**")
    for message in st.session_state.chat_history:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
    if question := st.chat_input("Ask a question about your document"):
        st.session_state.chat_history.append({"role": "user", "content": question})
        with st.chat_message("user"):
            st.markdown(question)
        with st.chat_message("assistant"):
            with st.spinner("Thinking..."):
                context = get_document_context(question, st.session_state.vectorstore)
                tutor = create_study_tutor_agent()
                explanation_task = create_explanation_task(tutor, question, context)
                result = run_agent_task(tutor, explanation_task)
                st.markdown(result)
                st.session_state.chat_history.append({"role": "assistant", "content": result})

def notes_tab():
    st.header("📝 Study Notes Generator")
    if not st.session_state.current_document:
        st.warning("Please upload and select a document first.")
        return
    st.markdown(f"Generate comprehensive study notes from **{st.session_state.current_document}**")
    topic = st.text_input("Enter the topic for your study notes (leave blank for full document summary):")
    if st.button("Generate Study Notes"):
        with st.spinner("Generating study notes..."):
            if topic:
                context = get_document_context(topic, st.session_state.vectorstore, top_k=10)
                notes_topic = topic
            else:
                doc_info = st.session_state.documents[st.session_state.current_document]
                full_text = "\n\n".join(doc_info['text_by_page'])
                context = full_text[:10000] + "..." if len(full_text) > 10000 else full_text
                notes_topic = f"Complete summary of {st.session_state.current_document}"
            note_taker = create_note_taker_agent()
            notes_task = create_notes_generation_task(note_taker, notes_topic, context)
            notes = run_agent_task(note_taker, notes_task)
            note_id = str(uuid.uuid4())[:8]
            st.session_state.study_notes[note_id] = {
                "topic": notes_topic,
                "content": notes,
                "created_at": datetime.now().isoformat(),
                "document": st.session_state.current_document
            }
    if st.session_state.study_notes:
        st.subheader("Your Study Notes")
        for note_id, note_data in st.session_state.study_notes.items():
            with st.expander(f"{note_data['topic']} - {note_data['document']}"):
                st.markdown(note_data["content"])
                col1, col2 = st.columns(2)
                with col1:
                    filename = f"{note_data['topic'].replace(' ', '_')}.md"
                    st.download_button(
                        label="Download Markdown",
                        data=note_data["content"],
                        file_name=filename,
                        mime="text/markdown",
                        key=f"dl_{note_id}"
                    )
                with col2:
                    if st.button("Delete", key=f"delete_{note_id}"):
                        del st.session_state.study_notes[note_id]
                        st.experimental_rerun()

def flashcards_tab():
    st.header("🎴 Flashcard Generator")
    if not st.session_state.current_document:
        st.warning("Please upload and select a document first.")
        return
    st.markdown(f"Generate flashcards from **{st.session_state.current_document}**")
    topic = st.text_input("Enter the topic for your flashcards:")
    num_cards = st.slider("Number of flashcards", min_value=5, max_value=30, value=10)
    if st.button("Generate Flashcards", disabled=not topic):
        with st.spinner("Generating flashcards..."):
            context = get_document_context(topic, st.session_state.vectorstore, top_k=10)
            flashcard_specialist = create_flashcard_specialist_agent()
            flashcard_task = create_flashcard_generation_task(flashcard_specialist, topic, context)
            flashcards_text = run_agent_task(flashcard_specialist, flashcard_task)
            flashcards = parse_flashcards_from_text(flashcards_text)
            if flashcards:
                deck_id = str(uuid.uuid4())[:8]
                st.session_state.flashcards[deck_id] = {
                    "topic": topic,
                    "cards": flashcards,
                    "created_at": datetime.now().isoformat(),
                    "document": st.session_state.current_document
                }
                st.success(f"Generated {len(flashcards)} flashcards!")
            else:
                st.error("Failed to generate flashcards. Please try again.")
    if st.session_state.flashcards:
        st.subheader("Your Flashcard Decks")
        for deck_id, deck_data in st.session_state.flashcards.items():
            with st.expander(f"{deck_data['topic']} ({len(deck_data['cards'])} cards) - {deck_data['document']}"):
                if 'current_card_index' not in st.session_state:
                    st.session_state.current_card_index = 0
                cards = deck_data['cards']
                current_index = st.session_state.current_card_index % len(cards)
                card = cards[current_index]
                col1, col2 = st.columns(2)
                with col1:
                    if st.button("Previous", key=f"prev_{deck_id}"):
                        st.session_state.current_card_index = (current_index - 1) % len(cards)
                        st.experimental_rerun()
                with col2:
                    if st.button("Next", key=f"next_{deck_id}"):
                        st.session_state.current_card_index = (current_index + 1) % len(cards)
                        st.experimental_rerun()
                st.markdown(f"**Card {current_index + 1} of {len(cards)}**")
                front_tab, back_tab = st.tabs(["Front", "Back"])
                with front_tab:
                    st.markdown(f"### {card['front']}")
                with back_tab:
                    st.markdown(f"### {card['back']}")
                c1, c2 = st.columns(2)
                with c1:
                    filename = f"{deck_data['topic'].replace(' ', '_')}_flashcards.json"
                    json_data = json.dumps(deck_data['cards'], indent=2)
                    st.download_button(
                        label="Download JSON",
                        data=json_data,
                        file_name=filename,
                        mime="application/json",
                        key=f"dl_{deck_id}"
                    )
                with c2:
                    if st.button("Delete Deck", key=f"delete_{deck_id}"):
                        del st.session_state.flashcards[deck_id]
                        st.experimental_rerun()

def mind_maps_tab():
    st.header("🧠 Mind Map Generator")
    if not st.session_state.current_document:
        st.warning("Please upload and select a document first.")
        return
    st.markdown(f"Generate mind maps from **{st.session_state.current_document}**")
    topic = st.text_input("Enter the topic for your mind map:")
    if st.button("Generate Mind Map", disabled=not topic):
        with st.spinner("Generating mind map..."):
            context = get_document_context(topic, st.session_state.vectorstore, top_k=10)
            visual_expert = create_visual_learning_expert_agent()
            mind_map_task = create_mind_map_task(visual_expert, topic, context)
            mind_map_text = run_agent_task(visual_expert, mind_map_task)
            graph_data = generate_mind_map_data(mind_map_text)
            map_id = str(uuid.uuid4())[:8]
            st.session_state.mind_maps[map_id] = {
                "topic": topic,
                "description": mind_map_text,
                "graph_data": graph_data,
                "created_at": datetime.now().isoformat(),
                "document": st.session_state.current_document
            }
            st.success("Mind map generated successfully!")
    if st.session_state.mind_maps:
        st.subheader("Your Mind Maps")
        for map_id, map_data in st.session_state.mind_maps.items():
            with st.expander(f"{map_data['topic']} - {map_data['document']}"):
                viz_tab, desc_tab = st.tabs(["Visualization", "Description"])
                with viz_tab:
                    G = nx.Graph()
                    for node in map_data['graph_data']['nodes']:
                        G.add_node(node['id'], label=node['label'], group=node['group'])
                    for edge in map_data['graph_data']['edges']:
                        G.add_edge(edge['from'], edge['to'])
                    pos = nx.spring_layout(G, k=0.3)
                    fig, ax = plt.subplots(figsize=(8, 6))
                    node_groups = {d['id']: d.get('group', 0) for d in map_data['graph_data']['nodes']}
                    node_colors = [node_groups[node] for node in G.nodes()]
                    nx.draw_networkx(
                        G,
                        pos=pos,
                        with_labels=True,
                        node_color=node_colors,
                        cmap=plt.cm.tab10,
                        node_size=1500,
                        font_size=10,
                        edge_color='gray',
                        alpha=0.8,
                        ax=ax
                    )
                    labels = {d['id']: d['label'] for d in map_data['graph_data']['nodes']}
                    nx.draw_networkx_labels(G, pos, labels=labels, font_size=8)
                    ax.set_title(f"Mind Map: {map_data['topic']}")
                    ax.axis('off')
                    st.pyplot(fig)
                with desc_tab:
                    st.markdown(map_data['description'])
                col1, col2 = st.columns(2)
                with col1:
                    filename = f"{map_data['topic'].replace(' ', '_')}_mind_map.txt"
                    st.download_button(
                        label="Download Text",
                        data=map_data['description'],
                        file_name=filename,
                        mime="text/plain",
                        key=f"dl_{map_id}"
                    )
                with col2:
                    if st.button("Delete", key=f"delete_{map_id}"):
                        del st.session_state.mind_maps[map_id]
                        st.experimental_rerun()

def roadmap_tab():
    st.header("🗺️ Study Roadmap Generator")
    if not st.session_state.current_document:
        st.warning("Please upload and select a document first.")
        return
    st.markdown(f"Generate a customized study roadmap for **{st.session_state.current_document}**")
    quick_roadmap = st.checkbox("Generate quick overview roadmap", help="Generate a simplified roadmap with less detail but faster creation")
    col1, col2 = st.columns(2)
    with col1:
        days_available = st.slider("Days available for studying", min_value=1, max_value=60, value=14, help="How many days do you have to study this material?")
    with col2:
        hours_per_day = st.slider("Hours available per day", min_value=1, max_value=12, value=2, help="How many hours can you study each day on average?")
    with st.expander("Additional preferences (optional)"):
        focus_areas = st.text_area("Specific areas to focus on (comma separated)", help="Leave blank if you want to cover everything equally")
        learning_style = st.selectbox("Your preferred learning style", options=["Visual", "Auditory", "Reading/Writing", "Kinesthetic", "Mixed"], help="This helps customize how you should approach the material")
        prior_knowledge = st.select_slider("Prior knowledge of this subject", options=["None", "Beginner", "Intermediate", "Advanced"], value="Beginner")
    with st.expander("Exam preparation (optional)"):
        has_exam = st.checkbox("Preparing for an exam?")
        if has_exam:
            exam_date = st.date_input("Exam date", min_value=datetime.now().date(), help="Select your exam date to optimize study schedule")
            exam_format = st.selectbox("Exam format", options=["Multiple choice", "Essay", "Mixed", "Open book", "Other"], help="This helps customize practice activities")
    if st.button("Generate Roadmap"):
        with st.spinner("Creating your personalized study roadmap..."):
            doc_info = st.session_state.documents[st.session_state.current_document]
            full_text = "\n\n".join(doc_info['text_by_page'])
            first_pages = "\n\n".join(doc_info['text_by_page'][:3])
            sampled_pages = []
            if len(doc_info['text_by_page']) > 5:
                import random
                sample_indices = random.sample(range(3, len(doc_info['text_by_page'])), min(5, len(doc_info['text_by_page'])-3))
                sampled_pages = [doc_info['text_by_page'][i] for i in sample_indices]
            context = f"Document Title: {st.session_state.current_document}\n"
            context += f"Total Pages: {doc_info['pages']}\n\n"
            context += f"DOCUMENT BEGINNING:\n{first_pages}\n\n"
            if sampled_pages:
                context += f"SAMPLE SECTIONS FROM DOCUMENT:\n" + "\n---\n".join(sampled_pages)
            context += f"\n\nSTUDY PREFERENCES:\n"
            context += f"Days Available: {days_available}\n"
            context += f"Hours Per Day: {hours_per_day}\n"
            if focus_areas:
                context += f"Focus Areas: {focus_areas}\n"
            context += f"Learning Style: {learning_style}\n"
            context += f"Prior Knowledge: {prior_knowledge}\n"
            if 'has_exam' in locals() and has_exam:
                context += f"Exam Date: {exam_date}\n"
                context += f"Exam Format: {exam_format}\n"
                context += f"Days until exam: {(exam_date - datetime.now().date()).days}\n"
            roadmap_planner = create_roadmap_planner_agent()
            if quick_roadmap:
                roadmap_task = create_quick_roadmap_generation_task(
                    roadmap_planner,
                    st.session_state.current_document,
                    days_available,
                    hours_per_day,
                    context
                )
            else:
                roadmap_task = create_roadmap_generation_task(
                    roadmap_planner,
                    st.session_state.current_document,
                    days_available,
                    hours_per_day,
                    context
                )
            roadmap_text = run_agent_task(roadmap_planner, roadmap_task)
            roadmap_data = parse_roadmap_from_text(roadmap_text)
            roadmap_id = str(uuid.uuid4())[:8]
            st.session_state.roadmaps[roadmap_id] = {
                "document": st.session_state.current_document,
                "days_available": days_available,
                "hours_per_day": hours_per_day,
                "focus_areas": focus_areas if focus_areas else "General study",
                "learning_style": learning_style,
                "prior_knowledge": prior_knowledge,
                "roadmap_text": roadmap_text,
                "roadmap_data": roadmap_data,
                "created_at": datetime.now().isoformat()
            }
            st.success("Study roadmap generated successfully!")
    if st.session_state.roadmaps:
        st.subheader("Your Study Roadmaps")
        for roadmap_id, roadmap in st.session_state.roadmaps.items():
            with st.expander(f"Roadmap for {roadmap['document']} ({roadmap['days_available']} days)"):
                overview_tab, schedule_tab, viz_tab, full_tab = st.tabs(["Overview", "Day-by-Day Schedule", "Visualization", "Full Roadmap"])
                with overview_tab:
                    if roadmap['roadmap_data']['overview']:
                        st.markdown(roadmap['roadmap_data']['overview'])
                    else:
                        st.markdown(roadmap['roadmap_text'])
                    if roadmap['roadmap_data']['milestones']:
                        st.subheader("Milestones")
                        for i, milestone in enumerate(roadmap['roadmap_data']['milestones']):
                            st.markdown(f"**{i+1}.** {milestone}")
                with schedule_tab:
                    schedule = roadmap['roadmap_data']['schedule']
                    if schedule:
                        for day_data in schedule:
                            day_num = day_data['day']
                            hours = day_data.get('hours', 0)
                            st.markdown(f"### Day {day_num} {f'({hours} hours)' if hours else ''}")
                            if day_data.get('topics'):
                                st.markdown("**Topics:**")
                                for topic in day_data['topics']:
                                    st.markdown(f"- {topic}")
                            st.markdown("**Plan:**")
                            st.markdown(day_data['content'])
                            st.markdown("---")
                    else:
                        st.markdown(roadmap['roadmap_text'])
                with viz_tab:
                    fig = go.Figure()
                    schedule = roadmap['roadmap_data']['schedule']
                    if schedule:
                        timeline_data = []
                        for day_data in schedule:
                            day_num = day_data['day']
                            topics = day_data.get('topics', [])
                            if not topics:
                                first_line = day_data['content'].split('\n')[0]
                                topics = [first_line]
                            for topic in topics:
                                timeline_data.append({
                                    "Day": day_num,
                                    "Topic": topic
                                })
                        if timeline_data:
                            df = pd.DataFrame(timeline_data)
                            fig = px.timeline(
                                df,
                                x_start="Day",
                                x_end=df["Day"] + 1,
                                y="Topic",
                                color="Day",
                                title=f"Study Roadmap: {roadmap['document']}",
                                labels={"Day": "Study Day"}
                            )
                            fig.update_yaxes(autorange="reversed")
                            fig.update_layout(height=400 + len(timeline_data) * 25)
                            st.plotly_chart(fig, use_container_width=True)
                    if not schedule or not timeline_data:
                        st.warning("Not enough structured data for visualization. Showing text schedule instead.")
                        st.markdown(roadmap['roadmap_text'])
                with full_tab:
                    st.markdown(roadmap['roadmap_text'])
                col1, col2 = st.columns(2)
                with col1:
                    filename = f"{roadmap['document'].replace(' ', '_')}_roadmap.md"
                    st.download_button(
                        label="Download Roadmap",
                        data=roadmap['roadmap_text'],
                        file_name=filename,
                        mime="text/markdown",
                        key=f"dl_{roadmap_id}"
                    )
                with col2:
                    if st.button("Delete", key=f"delete_{roadmap_id}"):
                        del st.session_state.roadmaps[roadmap_id]
                        st.experimental_rerun()

def tests_tab():
    st.header("📊 Test Generator")
    if not st.session_state.current_document:
        st.warning("Please upload and select a document first.")
        return
    st.markdown(f"Generate practice tests from **{st.session_state.current_document}**")
    topic = st.text_input("Enter the topic for your test:")
    difficulty = st.select_slider("Select test difficulty", options=["Easy", "Medium", "Hard"], value="Medium")
    if st.button("Generate Test", disabled=not topic):
        with st.spinner("Generating test..."):
            context = get_document_context(topic, st.session_state.vectorstore, top_k=10)
            assessment_expert = create_assessment_expert_agent()
            test_task = create_test_generation_task(assessment_expert, topic, difficulty, context)
            test_content_str = run_agent_task(assessment_expert, test_task)
            test_data = parse_test_from_text(test_content_str)
            test_id = str(uuid.uuid4())[:8]
            st.session_state.tests[test_id] = {
                "topic": topic,
                "difficulty": difficulty,
                "content": test_content_str,
                "questions": test_data["questions"],
                "answer_key": test_data["answer_key"],
                "created_at": datetime.now().isoformat(),
                "document": st.session_state.current_document
            }
            st.success(f"Generated test with {len(test_data['questions'])} questions!")
    if st.session_state.tests:
        st.subheader("Your Practice Tests")
        for test_id, test_data in st.session_state.tests.items():
            with st.expander(f"{test_data['topic']} ({test_data['difficulty']}) - {test_data['document']}"):
                questions_tab, answers_tab, raw_tab = st.tabs(["Questions", "Answer Key", "Raw Content"])
                with questions_tab:
                    for i, question in enumerate(test_data.get('questions', [])):
                        st.markdown(f"**Question {i+1}:** {question}")
                with answers_tab:
                    for num, answer in test_data.get('answer_key', {}).items():
                        st.markdown(f"**Answer {num}:** {answer}")
                with raw_tab:
                    st.markdown(test_data.get('content', 'No content available'))
                col1, col2 = st.columns(2)
                with col1:
                    filename = f"{test_data['topic'].replace(' ', '_')}_test.md"
                    st.download_button(
                        label="Download Markdown",
                        data=test_data['content'],
                        file_name=filename,
                        mime="text/markdown",
                        key=f"dl_{test_id}"
                    )
                with col2:
                    if st.button("Delete", key=f"delete_{test_id}"):
                        del st.session_state.tests[test_id]
                        st.experimental_rerun()

def progress_tab():
    st.header("📈 Progress Tracking")
    if not st.session_state.documents:
        st.warning("Please upload at least one document first.")
        return
    st.markdown("Track and analyze your study progress")
    if not st.session_state.progress_data:
        st.session_state.progress_data = {
            "daily_study_time": {
                "2025-03-16": 45,
                "2025-03-17": 60,
                "2025-03-18": 30,
                "2025-03-19": 90,
                "2025-03-20": 75,
                "2025-03-21": 60,
                "2025-03-22": 120,
                "2025-03-23": 45,
            },
            "quiz_scores": {
                "Biology Basics": [65, 75, 90],
                "Cell Structure": [70, 85],
                "Organic Chemistry": [60, 65, 80],
            },
            "documents_studied": {
                "biology_textbook.pdf": {
                    "pages_read": 45,
                    "total_pages": 120,
                    "time_spent": 180,
                },
                "chemistry_notes.pdf": {
                    "pages_read": 15,
                    "total_pages": 30,
                    "time_spent": 90,
                },
            },
            "flashcard_performance": {
                "Biology Terms": {
                    "correct": 25,
                    "incorrect": 5,
                    "review_count": 3,
                },
                "Chemical Elements": {
                    "correct": 18,
                    "incorrect": 12,
                    "review_count": 2,
                },
            },
        }
    col1, col2 = st.columns(2)
    with col1:
        st.subheader("Study Time")
        study_time_df = pd.DataFrame(list(st.session_state.progress_data["daily_study_time"].items()), columns=["Date", "Minutes"])
        fig = px.bar(study_time_df, x="Date", y="Minutes", title="Daily Study Time", labels={"Minutes": "Minutes Studied"}, color="Minutes", color_continuous_scale="Viridis")
        st.plotly_chart(fig, use_container_width=True)
        avg_time = study_time_df["Minutes"].mean()
        st.metric("Average Daily Study Time", f"{avg_time:.0f} minutes")
        st.subheader("Quiz Performance")
        quiz_data = []
        for quiz, scores in st.session_state.progress_data["quiz_scores"].items():
            for i, score in enumerate(scores):
                quiz_data.append({"Quiz": quiz, "Attempt": i + 1, "Score": score})
        quiz_df = pd.DataFrame(quiz_data)
        fig = px.line(quiz_df, x="Attempt", y="Score", color="Quiz", labels={"Score": "Score (%)"}, title="Quiz Performance")
        st.plotly_chart(fig, use_container_width=True)
        avg_score = quiz_df["Score"].mean()
        st.metric("Average Quiz Score", f"{avg_score:.1f}%")
    st.subheader("Document Progress")
    doc_data = []
    for doc, data in st.session_state.progress_data["documents_studied"].items():
        doc_data.append({
            "Document": doc,
            "Pages Read": data["pages_read"],
            "Total Pages": data["total_pages"],
            "Completion": (data["pages_read"] / data["total_pages"]) * 100,
            "Time Spent (min)": data["time_spent"]
        })
    doc_df = pd.DataFrame(doc_data)
    for _, row in doc_df.iterrows():
        st.markdown(f"**{row['Document']}**")
        st.progress(row["Completion"] / 100)
        st.markdown(f"Pages: {row['Pages Read']}/{row['Total Pages']} | Time spent: {row['Time Spent (min)']} minutes")
    st.subheader("Learning Coach Insights")
    if st.button("Generate Study Recommendations"):
        with st.spinner("Analyzing your progress..."):
            learning_coach = create_learning_coach_agent()
            progress_task = create_progress_analysis_task(learning_coach, json.dumps(st.session_state.progress_data))
            analysis = run_agent_task(learning_coach, progress_task)
            st.markdown(analysis)

def settings_tab():
    st.header("⚙️ Settings")
    st.subheader("API Configuration")
    groq_api_key = st.text_input("Groq API Key", type="password", help="Enter your Groq API key")
    if st.button("Save Settings"):
        if groq_api_key:
            st.success("API key saved successfully")
        else:
            st.error("Please enter your Groq API key")
    st.subheader("Document Processing")
    chunk_size = st.slider("Chunk Size", min_value=100, max_value=2000, value=MAX_CHUNK_SIZE, step=100, help="Size of text chunks for processing (smaller chunks for more precise retrieval, larger for more context)")
    overlap_size = st.slider("Chunk Overlap", min_value=0, max_value=500, value=OVERLAP_SIZE, step=50, help="Amount of overlap between text chunks")
    batch_size = st.slider("Batch Size", min_value=5, max_value=50, value=BATCH_SIZE, step=5, help="Number of pages to process at once (reduce if experiencing memory issues)")
    if st.button("Save Processing Settings"):
        st.info("Settings would be saved in a production application")
        st.success("Settings saved successfully")
    st.subheader("Danger Zone")
    if st.button("Clear All Data", type="primary", help="This will clear all your documents, notes, flashcards, and other data"):
        st.session_state.documents = {}
        st.session_state.vectorstore = None
        st.session_state.chat_history = []
        st.session_state.current_document = None
        st.session_state.study_notes = {}
        st.session_state.flashcards = {}
        st.session_state.tests = {}
        st.session_state.mind_maps = {}
        st.session_state.progress_data = {}
        st.success("All data cleared successfully")
        st.experimental_rerun()

def dsa_interview_tab():
    st.header("🧩 DSA Interview Preparation")
    st.markdown("""
        Prepare for technical interviews with Data Structures and Algorithms practice.
        - Get personalized question sets based on your target companies and roles
        - Track your progress across different topics and difficulty levels
        - Receive code analysis and optimization suggestions
        - Follow customized study plans to maximize your interview success
    """)
    
    # Create tabs for the different DSA features
    question_tab, personalize_tab, progress_tab, debugging_tab, interview_tab = st.tabs([
        "Practice Questions", "Personalized Plan", "Progress Tracking", 
        "Code Analysis", "Mock Interview"
    ])
    
    # Practice Questions Tab
    with question_tab:
        st.subheader("DSA Practice Questions")
        
        # Filter options
        col1, col2, col3 = st.columns(3)
        with col1:
            difficulty = st.selectbox("Difficulty Level", 
                options=["All", "Easy", "Medium", "Hard"], 
                index=0)
        with col2:
            topics = st.multiselect("Topics", 
                options=["Array", "String", "Hash Table", "Dynamic Programming", 
                        "Tree", "Graph", "Sorting", "Greedy", "Binary Search", 
                        "Stack", "Queue", "Linked List", "Recursion", "Backtracking"])
        with col3:
            companies = st.multiselect("Companies", 
                options=["Google", "Amazon", "Microsoft", "Facebook", "Apple", 
                        "Netflix", "Uber", "Twitter", "LinkedIn", "Bloomberg"])
        
        platforms = st.multiselect("Platforms", 
            options=["LeetCode", "GeeksforGeeks", "HackerRank", "CodeSignal", "LeetCode Premium"], 
            default=["LeetCode"])
        
        # Get questions button
        if st.button("Get Practice Questions", use_container_width=True):
            with st.spinner("Fetching DSA questions..."):
                # Use the Question Fetching Agent
                questions = get_sample_dsa_questions()
                
                # Use the Filtering Agent
                filters = {
                    'difficulty': difficulty,
                    'topics': topics,
                    'companies': companies,
                    'platform': platforms
                }
                
                if difficulty != "All" or topics or companies or platforms != ["LeetCode"]:
                    filtering_agent = create_filtering_agent()
                    filtering_task = create_filtering_task(filtering_agent, str(questions), filters)
                    try:
                        # For simpler filtering, we'll do it directly instead of using the agent
                        filtered_questions = questions
                        if difficulty != "All":
                            filtered_questions = [q for q in filtered_questions if q["difficulty"] == difficulty]
                        if topics:
                            filtered_questions = [q for q in filtered_questions if any(topic in q["topics"] for topic in topics)]
                        if companies:
                            filtered_questions = [q for q in filtered_questions if any(company in q["companies"] for company in companies)]
                        if platforms != ["LeetCode"]:
                            filtered_questions = [q for q in filtered_questions if q.get("platform", "LeetCode") in platforms]
                    except Exception as e:
                        st.error(f"Error filtering questions: {e}")
                        filtered_questions = questions
                else:
                    filtered_questions = questions
                
                st.session_state.dsa_questions = {q["id"]: q for q in filtered_questions}
                st.success(f"Found {len(filtered_questions)} questions matching your criteria")
        
        # Display questions with improved UI
        if st.session_state.dsa_questions:
            st.subheader("Available Questions")
            
            # Sort and display questions
            sort_by = st.selectbox("Sort by", 
                options=["Difficulty (Easy to Hard)", "Difficulty (Hard to Easy)", 
                        "Company Frequency", "Most Popular"], 
                index=0)
            
            questions = list(st.session_state.dsa_questions.values())
            if sort_by == "Difficulty (Easy to Hard)":
                difficulty_order = {"Easy": 0, "Medium": 1, "Hard": 2}
                questions.sort(key=lambda q: difficulty_order.get(q["difficulty"], 1))
            elif sort_by == "Difficulty (Hard to Easy)":
                difficulty_order = {"Hard": 0, "Medium": 1, "Easy": 2}
                questions.sort(key=lambda q: difficulty_order.get(q["difficulty"], 1))
            
            # Display questions in a table with clickable links
            question_data = []
            for q in questions:
                solved = q["id"] in st.session_state.solved_questions
                status = "✅" if solved else "⬜"
                favorite = q["id"] in st.session_state.favorite_questions
                favorite_icon = "⭐" if favorite else "☆"
                
                difficulty_color = {
                    "Easy": "green",
                    "Medium": "orange",
                    "Hard": "red"
                }.get(q["difficulty"], "black")
                
                question_data.append({
                    "Status": status,
                    "Favorite": favorite_icon,
                    "ID": q["id"],
                    "Title": q["title"],
                    "Difficulty": f"<span style='color:{difficulty_color}'>{q['difficulty']}</span>",
                    "Topics": ", ".join(q["topics"][:2]) + ("..." if len(q["topics"]) > 2 else ""),
                    "Companies": ", ".join(q["companies"][:2]) + ("..." if len(q["companies"]) > 2 else "")
                })
            
            # Create DataFrame for display
            question_df = pd.DataFrame(question_data)
            
            # Convert to HTML for better styling
            question_html = question_df.to_html(escape=False, index=False)
            question_html = question_html.replace('<table', '<table style="width:100%"')
            st.write(question_html, unsafe_allow_html=True)
            
            # Show expanded view for selected question
            selected_question_id = st.selectbox("Select a question to view details", 
                options=[q["id"] for q in questions],
                format_func=lambda id: f"{st.session_state.dsa_questions[id]['title']} ({st.session_state.dsa_questions[id]['difficulty']})")
            
            if selected_question_id:
                q = st.session_state.dsa_questions[selected_question_id]
                
                # Create columns for question details and actions
                col1, col2 = st.columns([3, 1])
                
                with col1:
                    st.markdown(f"### {q['title']}")
                    st.markdown(f"**Difficulty**: {q['difficulty']}")
                    st.markdown(f"**Topics**: {', '.join(q['topics'])}")
                    st.markdown(f"**Companies**: {', '.join(q['companies'])}")
                    st.markdown(f"**Description**: {q['description']}")
                    if 'example' in q:
                        st.markdown("**Example**:")
                        st.code(q['example'])
                
                with col2:
                    # Question actions
                    solved = selected_question_id in st.session_state.solved_questions
                    if st.button("✅ Mark as Solved" if not solved else "⬜ Mark as Unsolved", key=f"solve_{selected_question_id}"):
                        if not solved:
                            st.session_state.solved_questions.add(selected_question_id)
                            # Track when solved for progress metrics
                            st.session_state.dsa_practice_history.append({
                                "id": selected_question_id,
                                "title": q["title"],
                                "difficulty": q["difficulty"],
                                "date_solved": datetime.now().isoformat(),
                                "topics": q["topics"]
                            })
                        else:
                            st.session_state.solved_questions.remove(selected_question_id)
                        st.experimental_rerun()
                    
                    favorite = selected_question_id in st.session_state.favorite_questions
                    if st.button("⭐ Remove from Favorites" if favorite else "☆ Add to Favorites", key=f"fav_{selected_question_id}"):
                        if not favorite:
                            st.session_state.favorite_questions.add(selected_question_id)
                        else:
                            st.session_state.favorite_questions.remove(selected_question_id)
                        st.experimental_rerun()
                    
                    # Link to problem
                    if 'link' in q:
                        st.markdown(f"[Open Problem in {q.get('platform', 'LeetCode')}]({q['link']})")
                    
                    # Actions for practice
                    st.button("Submit Solution", key=f"solve_now_{selected_question_id}", 
                              on_click=lambda: st.session_state.update({"current_tab": "DSA", "active_subtab": "debugging", "active_problem": selected_question_id}))
                    
                    # Get hints
                    if st.button("Get Hints", key=f"hints_{selected_question_id}"):
                        with st.spinner("Generating hints..."):
                            pattern_agent = create_coding_pattern_agent()
                            similar_problems = [p["title"] for p in questions if any(topic in p["topics"] for topic in q["topics"])][:3]
                            pattern_task = create_pattern_identification_task(
                                pattern_agent, 
                                q["description"], 
                                ", ".join(similar_problems)
                            )
                            hints = run_agent_task(pattern_agent, pattern_task)
                            st.info("Hints and Patterns")
                            st.markdown(hints)
    
    # Personalized Plan Tab
    with personalize_tab:
        st.subheader("Personalized Interview Preparation Plan")
        
        col1, col2 = st.columns(2)
        with col1:
            target_company = st.selectbox("Target Company", 
                options=["Any", "Google", "Amazon", "Microsoft", "Facebook", "Apple", 
                        "Netflix", "Uber", "Twitter", "LinkedIn", "Bloomberg"], 
                index=0)
            
            target_role = st.selectbox("Target Role", 
                options=["Software Engineer", "Senior Software Engineer", 
                        "Software Engineer - Frontend", "Software Engineer - Backend", 
                        "Data Engineer", "ML Engineer", "DevOps Engineer"], 
                index=0)
        
        with col2:
            target_salary = st.select_slider("Target Salary Range", 
                options=["Entry Level ($80k-$120k)", "Mid Level ($120k-$180k)", 
                        "Senior Level ($180k-$250k)", "Staff+ Level ($250k+)"], 
                value="Mid Level ($120k-$180k)")
            
            timeline = st.select_slider("Preparation Timeline", 
                options=["1-2 weeks", "1 month", "2-3 months", "4-6 months"], 
                value="1 month")
        
        experience_level = st.select_slider("Your Experience Level", 
            options=["Student/New Grad", "1-3 years", "4-6 years", "7+ years"], 
            value="1-3 years")
        
        if st.button("Generate Personalized Plan", use_container_width=True):
            with st.spinner("Creating your personalized interview preparation plan..."):
                # Use the Personalization Agent
                user_profile = f"""
                Experience Level: {experience_level}
                Target Role: {target_role}
                Preparation Timeline: {timeline}
                """
                
                user_goals = {
                    "target_company": target_company if target_company != "Any" else "Not specified",
                    "target_role": target_role,
                    "target_salary": target_salary,
                    "timeline": timeline
                }
                
                personalization_agent = create_personalization_agent()
                questions = get_sample_dsa_questions()
                personalization_task = create_personalization_task(
                    personalization_agent,
                    str(questions),
                    user_goals
                )
                
                try:
                    plan_result = run_agent_task(personalization_agent, personalization_task)
                    st.session_state.current_study_plan = {
                        "plan": plan_result,
                        "created_at": datetime.now().isoformat(),
                        "user_goals": user_goals
                    }
                except Exception as e:
                    st.error(f"Error generating personalized plan: {e}")
                    # Fallback to company-specific agent if personalization fails
                    if target_company != "Any":
                        company_agent = create_company_specific_agent()
                        company_task = create_company_preparation_task(
                            company_agent,
                            target_company,
                            user_experience=experience_level,
                            available_time=timeline
                        )
                        plan_result = run_agent_task(company_agent, company_task)
                        st.session_state.current_study_plan = {
                            "plan": plan_result,
                            "created_at": datetime.now().isoformat(),
                            "user_goals": user_goals
                        }
        
        # Display the personalized plan if available
        if st.session_state.current_study_plan:
            st.subheader("Your Personalized DSA Study Plan")
            st.markdown(st.session_state.current_study_plan["plan"])
            
            # Add a way to save the plan to file
            col1, col2 = st.columns(2)
            with col1:
                company_name = st.session_state.current_study_plan["user_goals"]["target_company"]
                filename = f"dsa_plan_{company_name.lower().replace(' ', '_')}.md"
                st.download_button(
                    label="Download Plan",
                    data=st.session_state.current_study_plan["plan"],
                    file_name=filename,
                    mime="text/markdown"
                )
            with col2:
                if st.button("Clear Plan"):
                    st.session_state.current_study_plan = None
                    st.experimental_rerun()
    
    # Progress Tracking Tab
    with progress_tab:
        st.subheader("Progress Tracking")
        
        # Generate progress metrics
        metrics = calculate_dsa_progress_metrics({
            "questions": [
                {
                    "id": q_id,
                    "title": st.session_state.dsa_questions[q_id]["title"] if q_id in st.session_state.dsa_questions else "Unknown",
                    "difficulty": st.session_state.dsa_questions[q_id]["difficulty"] if q_id in st.session_state.dsa_questions else "Medium",
                    "topics": st.session_state.dsa_questions[q_id]["topics"] if q_id in st.session_state.dsa_questions else [],
                    "companies": st.session_state.dsa_questions[q_id]["companies"] if q_id in st.session_state.dsa_questions else [],
                    "status": "completed",
                    "attempts": 1
                } for q_id in st.session_state.solved_questions
            ]
        })
        
        # Display progress metrics
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Questions Completed", metrics.get("total_completed", 0))
        with col2:
            total_questions = len(st.session_state.dsa_questions) or 1
            completion_rate = (metrics.get("total_completed", 0) / total_questions) * 100
            st.metric("Completion Rate", f"{completion_rate:.1f}%")
        with col3:
            st.metric("Success Rate", f"{metrics.get('success_rate', 100):.1f}%")
        
        # Progress by difficulty
        st.subheader("Progress by Difficulty")
        by_difficulty = metrics.get("by_difficulty", {"Easy": 0, "Medium": 0, "Hard": 0})
        # Calculate total questions by difficulty
        total_by_difficulty = {"Easy": 0, "Medium": 0, "Hard": 0}
        for q in st.session_state.dsa_questions.values():
            difficulty = q.get("difficulty", "Medium")
            total_by_difficulty[difficulty] = total_by_difficulty.get(difficulty, 0) + 1
        
        difficulty_df = pd.DataFrame({
            "Difficulty": list(by_difficulty.keys()),
            "Completed": list(by_difficulty.values()),
            "Total": [total_by_difficulty.get(diff, 0) for diff in by_difficulty.keys()]
        })
        
        difficulty_df["Completion Rate"] = (difficulty_df["Completed"] / difficulty_df["Total"].replace(0, 1)) * 100
        
        # Use Plotly for interactive charts
        fig = px.bar(
            difficulty_df,
            x="Difficulty",
            y=["Completed", "Total"],
            barmode="group",
            title="Questions by Difficulty",
            labels={"value": "Number of Questions", "variable": "Status"}
        )
        st.plotly_chart(fig, use_container_width=True)
        
        # Progress by topic
        st.subheader("Progress by Topic")
        by_topic = metrics.get("by_topic", {})
        if by_topic:
            topic_data = []
            for topic, data in by_topic.items():
                if data["total"] > 0:
                    completion_rate = (data["completed"] / data["total"]) * 100
                    topic_data.append({
                        "Topic": topic,
                        "Completed": data["completed"],
                        "Total": data["total"],
                        "Completion Rate (%)": completion_rate
                    })
            
            if topic_data:
                topic_df = pd.DataFrame(topic_data)
                topic_df = topic_df.sort_values("Completion Rate (%)", ascending=False)
                
                fig = px.bar(
                    topic_df,
                    x="Topic",
                    y="Completion Rate (%)",
                    color="Completion Rate (%)",
                    color_continuous_scale="viridis",
                    title="Topic Completion Rates"
                )
                st.plotly_chart(fig, use_container_width=True)
        
        # Recent activity
        st.subheader("Recent Activity")
        if st.session_state.dsa_practice_history:
            # Sort by most recent
            history = sorted(st.session_state.dsa_practice_history, 
                            key=lambda x: x.get("date_solved", ""), reverse=True)
            
            activity_df = pd.DataFrame(history)
            if not activity_df.empty:
                # Format date for display
                if "date_solved" in activity_df.columns:
                    activity_df["Date Solved"] = pd.to_datetime(activity_df["date_solved"]).dt.strftime("%Y-%m-%d")
                
                # Display recent activity table
                st.table(activity_df[["title", "difficulty", "Date Solved"]].head(10))
        else:
            st.info("No activity recorded yet. Start solving problems to track your progress.")
        
        # Add an option to get recommendations based on progress
        if st.button("Get Study Recommendations"):
            with st.spinner("Analyzing your progress..."):
                # Use the Progress Tracking Agent
                progress_agent = create_progress_tracking_agent()
                progress_task = create_progress_tracking_task(
                    progress_agent,
                    json.dumps(metrics),
                    json.dumps([q for q in st.session_state.dsa_questions.values() 
                              if q["id"] in st.session_state.solved_questions])
                )
                
                try:
                    recommendations = run_agent_task(progress_agent, progress_task)
                    st.subheader("Study Recommendations")
                    st.markdown(recommendations)
                except Exception as e:
                    st.error(f"Error generating recommendations: {e}")
                    st.info("Focus on topics with lower completion rates to improve your overall skills.")
    
    # Code Analysis Tab
    with debugging_tab:
        st.subheader("Code Analysis & Debugging")
        
        # Select a problem to solve
        problem_options = [(qid, f"{q['title']} ({q['difficulty']})") 
                          for qid, q in st.session_state.dsa_questions.items()]
        
        selected_problem = st.selectbox(
            "Select a problem to solve",
            options=[p[0] for p in problem_options],
            format_func=lambda x: next((p[1] for p in problem_options if p[0] == x), "Select a problem")
        )
        
        if selected_problem and selected_problem in st.session_state.dsa_questions:
            problem = st.session_state.dsa_questions[selected_problem]
            
            # Show problem description
            st.markdown(f"### {problem['title']}")
            st.markdown(f"**Difficulty**: {problem['difficulty']}")
            st.markdown(f"**Description**: {problem['description']}")
            
            if 'example' in problem:
                st.markdown("**Example**:")
                st.code(problem['example'])
            
            # Code editor
            language = st.selectbox("Select programming language", 
                                   ["Python", "Java", "C++", "JavaScript"])
            
            # Template code based on language
            code_templates = {
                "Python": "def solution(nums):\n    # Your code here\n    pass",
                "Java": "class Solution {\n    public int[] solution(int[] nums) {\n        // Your code here\n        return null;\n    }\n}",
                "C++": "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> solution(vector<int>& nums) {\n        // Your code here\n        return {};\n    }\n};",
                "JavaScript": "/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar solution = function(nums) {\n    // Your code here\n};"
            }
            
            # Load existing solution if any
            solution_key = f"{selected_problem}_{language}"
            if solution_key in st.session_state.user_code_solutions:
                user_code = st.session_state.user_code_solutions[solution_key]
            else:
                user_code = code_templates.get(language, "// Your solution here")
            
            # Code editor
            user_solution = st.text_area("Your Solution", user_code, height=300)
            
            col1, col2, col3 = st.columns(3)
            with col1:
                if st.button("Save Solution"):
                    st.session_state.user_code_solutions[solution_key] = user_solution
                    st.success("Solution saved!")
            
            with col2:
                if st.button("Analyze Code"):
                    with st.spinner("Analyzing your solution..."):
                        # Use the Debugging Agent
                        debugging_agent = create_debugging_agent()
                        debugging_task = create_debugging_task(
                            debugging_agent,
                            user_solution,
                            problem["description"],
                            language
                        )
                        
                        try:
                            analysis_result = run_agent_task(debugging_agent, debugging_task)
                            analysis = parse_code_analysis(analysis_result)
                            
                            # Store analysis for reference
                            st.session_state.code_analysis_results[solution_key] = analysis
                            
                            # Display analysis
                            st.subheader("Code Analysis Results")
                            
                            with st.expander("Issues and Bugs", expanded=True):
                                if analysis.get("bugs"):
                                    for i, bug in enumerate(analysis["bugs"], 1):
                                        st.markdown(f"{i}. {bug}")
                                else:
                                    st.success("No significant issues found!")
                            
                            with st.expander("Optimization Suggestions", expanded=True):
                                if analysis.get("optimizations"):
                                    for i, opt in enumerate(analysis["optimizations"], 1):
                                        st.markdown(f"{i}. {opt}")
                                else:
                                    st.info("No optimization suggestions available.")
                            
                            with st.expander("Complexity Analysis", expanded=True):
                                if analysis.get("time_complexity"):
                                    st.markdown(f"**Time Complexity:** {analysis['time_complexity']}")
                                if analysis.get("space_complexity"):
                                    st.markdown(f"**Space Complexity:** {analysis['space_complexity']}")
                            
                            if analysis.get("improved_code"):
                                with st.expander("Improved Solution", expanded=False):
                                    st.code(analysis["improved_code"], language=language.lower())
                        
                        except Exception as e:
                            st.error(f"Error analyzing code: {e}")
                            st.info("Try simplifying your code and ensure it's syntactically correct.")
            
            with col3:
                if st.button("Mark as Completed"):
                    st.session_state.solved_questions.add(selected_problem)
                    st.session_state.dsa_practice_history.append({
                        "id": selected_problem,
                        "title": problem["title"],
                        "difficulty": problem["difficulty"],
                        "date_solved": datetime.now().isoformat(),
                        "topics": problem["topics"]
                    })
                    st.success("Problem marked as completed!")
    
    # Mock Interview Tab
    with interview_tab:
        st.subheader("Mock Technical Interview")
        
        # Select company for interview style
        interview_company = st.selectbox(
            "Select company interview style",
            options=["General", "Google", "Amazon", "Microsoft", "Facebook", "Apple"]
        )
        
        # Select difficulty
        interview_difficulty = st.select_slider(
            "Interview difficulty",
            options=["Easy", "Medium", "Hard"],
            value="Medium"
        )
        
        # Select problem category
        problem_category = st.selectbox(
            "Problem category",
            options=["Any", "Array", "String", "Linked List", "Tree", "Graph", "Dynamic Programming"]
        )
        
        if st.button("Start Mock Interview"):
            with st.spinner("Setting up your mock interview..."):
                # Filter problems based on selected criteria
                filtered_problems = []
                for q in st.session_state.dsa_questions.values():
                    matches_difficulty = q["difficulty"] == interview_difficulty
                    matches_category = problem_category == "Any" or problem_category in q["topics"]
                    filtered_problems.append(q)
                
                if not filtered_problems:
                    st.warning("No matching problems found. Try different criteria.")
                else:
                    # Select a random problem
                    import random
                    selected_problem = random.choice(filtered_problems)
                    
                    # Use the Interview Strategy Agent
                    interview_agent = create_interview_strategy_agent()
                    mock_interview_task = create_mock_interview_task(
                        interview_agent,
                        selected_problem["description"],
                        interview_difficulty,
                        interview_company
                    )
                    
                    try:
                        interview_session = run_agent_task(interview_agent, mock_interview_task)
                        
                        st.subheader("Mock Technical Interview Session")
                        st.markdown(f"**Problem**: {selected_problem['title']}")
                        st.markdown(f"**Difficulty**: {selected_problem['difficulty']}")
                        st.markdown(f"**Company Style**: {interview_company}")
                        
                        st.markdown("### Interview Simulation")
                        st.markdown(interview_session)
                        
                        # Provide space for user to write their solution
                        st.text_area("Write your solution here as you work through the problem:", 
                                    height=300, key="mock_interview_solution")
                        
                        if st.button("Finish Interview"):
                            st.success("Mock interview completed! Review the feedback above.")
                    
                    except Exception as e:
                        st.error(f"Error setting up mock interview: {e}")
                        st.info("Try again with different settings or select a specific problem.")

# Main app
def main():
    sidebar()
    if st.session_state.current_tab == "Home":
        home_tab()
    elif st.session_state.current_tab == "Chat":
        chat_tab()
    elif st.session_state.current_tab == "Notes":
        notes_tab()
    elif st.session_state.current_tab == "Flashcards":
        flashcards_tab()
    elif st.session_state.current_tab == "MindMaps":
        mind_maps_tab()
    elif st.session_state.current_tab == "Roadmaps":
        roadmap_tab()
    elif st.session_state.current_tab == "Tests":
        tests_tab()
    elif st.session_state.current_tab == "DSA":
        dsa_interview_tab()
    elif st.session_state.current_tab == "Progress":
        progress_tab()
    elif st.session_state.current_tab == "Settings":
        settings_tab()

if __name__ == "__main__":
    main()