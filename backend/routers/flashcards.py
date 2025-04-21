from fastapi import APIRouter, HTTPException
from typing import List
import os
import json
import uuid
from datetime import datetime
import re

from models.schemas import FlashcardRequest, FlashcardDeck, Flashcard
from utils import get_document_context, get_document_by_id
from agents import create_flashcard_specialist_agent, create_flashcard_generation_task, run_agent_task

router = APIRouter()

# Storage directory
FLASHCARDS_DIR = "./storage/flashcards"
os.makedirs(FLASHCARDS_DIR, exist_ok=True)

@router.post("/generate", response_model=FlashcardDeck)
async def generate_flashcards(request: FlashcardRequest):
    """Generate flashcards for a topic and document"""
    # Validate document exists
    document = get_document_by_id(request.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        # Get document context
        context = get_document_context(request.topic, request.document_id)
        
        # Create flashcard specialist agent
        flashcard_specialist = create_flashcard_specialist_agent()
        
        # Create flashcard generation task
        flashcard_task = create_flashcard_generation_task(
            flashcard_specialist, 
            request.topic, 
            context,
            num_cards=request.num_cards
        )
        
        # Execute task
        print(f"Generating flashcards for topic: {request.topic} with {request.num_cards} cards requested")
        flashcard_data = run_agent_task(flashcard_specialist, flashcard_task)
        print(f"Raw AI response length: {len(flashcard_data)} characters")
        print(f"First 200 chars of AI response: {flashcard_data[:200]}...")
        
        # Safety: Escape any potential string format specifiers in the AI response
        # This prevents "%s" or similar in the text from being interpreted as format specifiers
        flashcard_data = flashcard_data.replace("%", "%%")
        
        # Parse flashcard data
        from utils import parse_flashcards_from_text
        try:
            flashcards = parse_flashcards_from_text(flashcard_data)
        except Exception as parse_error:
            print(f"ERROR parsing flashcards: {str(parse_error)}")
            # Create a debug file with escaped content for troubleshooting
            debug_path = f"{FLASHCARDS_DIR}/debug_error_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            with open(debug_path, "w") as f:
                f.write(flashcard_data)
            # Create fallback flashcards
            flashcards = [
                {
                    "front": "Error Card - Failed to parse flashcards", 
                    "back": "Please try regenerating with a different topic"
                }
            ]
            
        print(f"Parsed {len(flashcards)} flashcards from AI response")
        if len(flashcards) == 0:
            print("WARNING: No flashcards were parsed! Saving raw response for debugging.")
            # Save the raw response for debugging
            debug_path = f"{FLASHCARDS_DIR}/debug_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            with open(debug_path, "w") as f:
                f.write(flashcard_data)
            
            # Create at least one default card to prevent empty deck
            flashcards = [
                {
                    "front": "Error Card - The AI generated no parseable flashcards", 
                    "back": "Please try regenerating cards with a more specific topic"
                }
            ]
        
        # Final validation and normalization of flashcards - with extra safety measures
        valid_flashcards = []
        for i, card in enumerate(flashcards):
            try:
                # Skip cards without both front and back
                if not card.get('front') or not card.get('back'):
                    print(f"Skipping card {i} - missing front or back content")
                    continue
                    
                # Ensure the card has exactly front and back fields with proper escaping
                valid_card = {
                    "front": str(card.get('front', '')).replace("%", "%%").strip(),
                    "back": str(card.get('back', '')).replace("%", "%%").strip()
                }
                
                # Remove any card numbers or prefixes like "Card 1:" from content
                for side in ['front', 'back']:
                    content = valid_card[side]
                    # Remove "Card X:" prefixes
                    content = re.sub(r'^Card\s*\d+:?\s*', '', content)
                    # Remove "Front:" or "Back:" prefixes
                    content = re.sub(r'^(Front|Back):\s*', '', content)
                    # Remove "Question:" or "Answer:" prefixes
                    content = re.sub(r'^(Question|Answer):\s*', '', content)
                    # Trim any extra whitespace
                    valid_card[side] = content.strip()
                
                # Only add card if both sides have content after cleanup
                if valid_card["front"] and valid_card["back"]:
                    valid_flashcards.append(valid_card)
            except Exception as card_error:
                print(f"Error processing card {i}: {str(card_error)}")
                continue
        
        # If all cards were invalid, add an error card
        if not valid_flashcards:
            valid_flashcards = [{
                "front": "Error - No valid flashcards could be created", 
                "back": "Please try again with more specific instructions"
            }]
        
        print(f"Final count after validation: {len(valid_flashcards)} flashcards")
        
        # Generate a unique ID for the deck
        deck_id = str(uuid.uuid4())[:8]
        
        # Create flashcard deck
        deck = FlashcardDeck(
            id=deck_id,
            topic=request.topic,
            cards=valid_flashcards,  # Uses 'cards' to match the schema
            document_id=request.document_id,
            created_at=datetime.now().isoformat()
        )
        
        # Extra safety: validate serialization before saving
        try:
            # Test JSON serialization to catch any formatting issues
            json_data = json.dumps(deck.dict())
            
            # Save deck to file
            with open(f"{FLASHCARDS_DIR}/{deck_id}.json", "w") as f:
                f.write(json_data)
            
            return deck
        except Exception as json_error:
            print(f"ERROR in JSON serialization: {str(json_error)}")
            # Create a simple error-free deck as fallback
            fallback_deck = FlashcardDeck(
                id=deck_id,
                topic=request.topic,
                cards=[{"front": "Error creating flashcards", "back": "Please try again with a different topic"}],
                document_id=request.document_id,
                created_at=datetime.now().isoformat()
            )
            return fallback_deck
            
    except Exception as e:
        print(f"ERROR in flashcard generation: {str(e)}")
        # Provide a more generic error message to avoid exposing formatting issues
        raise HTTPException(status_code=500, detail="Error generating flashcards. Please try again with a different topic.")

@router.get("/", response_model=List[FlashcardDeck])
async def get_all_flashcards():
    """Get all flashcard decks"""
    decks = []
    
    if not os.path.exists(FLASHCARDS_DIR):
        return decks
    
    for file in os.listdir(FLASHCARDS_DIR):
        if file.endswith(".json"):
            with open(f"{FLASHCARDS_DIR}/{file}", "r") as f:
                deck = json.load(f)
                decks.append(FlashcardDeck(**deck))
    
    # Sort by creation date (newest first)
    decks.sort(key=lambda x: x.created_at, reverse=True)
    return decks

@router.get("/{deck_id}", response_model=FlashcardDeck)
async def get_flashcard_deck(deck_id: str):
    """Get a specific flashcard deck"""
    deck_path = f"{FLASHCARDS_DIR}/{deck_id}.json"
    
    if not os.path.exists(deck_path):
        raise HTTPException(status_code=404, detail="Flashcard deck not found")
    
    with open(deck_path, "r") as f:
        deck = json.load(f)
    
    return FlashcardDeck(**deck)

@router.delete("/{deck_id}")
async def delete_flashcard_deck(deck_id: str):
    """Delete a flashcard deck"""
    deck_path = f"{FLASHCARDS_DIR}/{deck_id}.json"
    
    if not os.path.exists(deck_path):
        raise HTTPException(status_code=404, detail="Flashcard deck not found")
    
    os.remove(deck_path)
    return {"status": "success", "message": "Flashcard deck deleted successfully"}