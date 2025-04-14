import React, { useState } from 'react';
import { motion } from 'framer-motion';

const FlashcardDeck = ({ cards = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [direction, setDirection] = useState(0);

  if (!cards || cards.length === 0) {
    return <div className="empty-deck">No flashcards available</div>;
  }

  const currentCard = cards[currentIndex];

  const goToNextCard = () => {
    if (currentIndex < cards.length - 1) {
      setDirection(1);
      setShowAnswer(false);
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
      }, 300);
    }
  };

  const goToPreviousCard = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setShowAnswer(false);
      setTimeout(() => {
        setCurrentIndex(currentIndex - 1);
      }, 300);
    }
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  const cardVariants = {
    hidden: (direction) => ({
      x: direction > 0 ? '100%' : direction < 0 ? '-100%' : 0,
      opacity: 0
    }),
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: (direction) => ({
      x: direction < 0 ? '100%' : direction > 0 ? '-100%' : 0,
      opacity: 0,
      transition: { duration: 0.3 }
    })
  };

  return (
    <div className="flashcard-deck">
      <div className="flashcard-count">
        Card {currentIndex + 1} of {cards.length}
      </div>

      <motion.div
        className={`flashcard ${showAnswer ? 'flipped' : ''}`}
        key={currentIndex}
        custom={direction}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={toggleAnswer}
      >
        <div className="flashcard-inner">
          <div className="flashcard-front">
            <div className="flashcard-content">{currentCard.front}</div>
          </div>
          <div className="flashcard-back">
            <div className="flashcard-content">{currentCard.back}</div>
          </div>
        </div>
      </motion.div>

      <div className="flashcard-controls">
        <button
          onClick={goToPreviousCard}
          disabled={currentIndex === 0}
          className="flashcard-button"
        >
          Previous
        </button>
        <button
          onClick={toggleAnswer}
          className="flashcard-button"
        >
          {showAnswer ? 'Show Question' : 'Show Answer'}
        </button>
        <button
          onClick={goToNextCard}
          disabled={currentIndex === cards.length - 1}
          className="flashcard-button"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default FlashcardDeck;
