import React, { useState, useEffect, useCallback } from 'react';
import { dsa } from '../api';
import CodeEditor from './CodeEditor';
import { Box, Button, Card, CardContent, Chip, CircularProgress, FormControl, Grid, InputLabel, MenuItem, Paper, Select, Tab, Tabs, TextField, Typography, Divider, IconButton, Alert, Snackbar } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import FilterListIcon from '@mui/icons-material/FilterList';
import CodeIcon from '@mui/icons-material/Code';
import BugReportIcon from '@mui/icons-material/BugReport';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const DSAPractice = () => {
  // State for questions and filtering
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [difficulty, setDifficulty] = useState('All');
  const [topics, setTopics] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [platforms, setPlatforms] = useState(['LeetCode']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // State for code editor
  const [codeLanguage, setCodeLanguage] = useState('Python');
  const [userCode, setUserCode] = useState('');
  const [codeAnalysis, setCodeAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // State for patterns and hints
  const [hints, setHints] = useState(null);
  const [isLoadingHints, setIsLoadingHints] = useState(false);

  // State for UI
  const [activeTab, setActiveTab] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  // Available options for filters
  const difficultyOptions = ['All', 'Easy', 'Medium', 'Hard'];
  const topicOptions = [
    'Array', 'String', 'Hash Table', 'Dynamic Programming', 
    'Tree', 'Graph', 'Sorting', 'Greedy', 'Binary Search', 
    'Stack', 'Queue', 'Linked List', 'Recursion', 'Backtracking'
  ];
  const companyOptions = [
    'Google', 'Amazon', 'Microsoft', 'Facebook', 'Apple', 
    'Netflix', 'Uber', 'Twitter', 'LinkedIn', 'Bloomberg'
  ];
  const languageOptions = ['Python', 'Java', 'JavaScript', 'C++'];

  // Load questions on component mount
  useEffect(() => {
    fetchQuestions();
  }, []);

  // Apply filters to questions
  useEffect(() => {
    if (questions.length) {
      let filtered = [...questions];
      
      // Apply difficulty filter
      if (difficulty !== 'All') {
        filtered = filtered.filter(q => q.difficulty === difficulty);
      }
      
      // Apply topics filter
      if (topics.length > 0) {
        filtered = filtered.filter(q => 
          q.topics.some(topic => topics.includes(topic))
        );
      }
      
      // Apply companies filter
      if (companies.length > 0) {
        filtered = filtered.filter(q => 
          q.companies.some(company => companies.includes(company))
        );
      }
      
      setFilteredQuestions(filtered);
    }
  }, [questions, difficulty, topics, companies]);

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = {};
      if (difficulty !== 'All') params.difficulty = difficulty;
      if (topics.length > 0) params.topics = topics;
      if (companies.length > 0) params.companies = companies;
      if (platforms.length > 0) params.platforms = platforms;
      
      const response = await dsa.getQuestions(params);
      setQuestions(response.data);
      setFilteredQuestions(response.data);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Failed to fetch questions. Please try again.');
      setNotification({
        open: true, 
        message: 'Failed to fetch questions', 
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  }, [difficulty, topics, companies, platforms]);

  const handleQuestionSelect = useCallback((question) => {
    setSelectedQuestion(question);
    setCodeAnalysis(null);
    setHints(null);
    
    // Set up default code template based on language
    const codeTemplates = {
      'Python': `def solution(nums):\n    # Your code here\n    pass`,
      'Java': `class Solution {\n    public int[] solution(int[] nums) {\n        // Your code here\n        return null;\n    }\n}`,
      'C++': `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> solution(vector<int>& nums) {\n        // Your code here\n        return {};\n    }\n};`,
      'JavaScript': `/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar solution = function(nums) {\n    // Your code here\n};`
    };
    
    setUserCode(codeTemplates[codeLanguage] || '// Your solution here');
    
  }, [codeLanguage]);

  const handleLanguageChange = (language) => {
    setCodeLanguage(language);
    
    // Update code template based on new language
    const codeTemplates = {
      'Python': `def solution(nums):\n    # Your code here\n    pass`,
      'Java': `class Solution {\n    public int[] solution(int[] nums) {\n        // Your code here\n        return null;\n    }\n}`,
      'C++': `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> solution(vector<int>& nums) {\n        // Your code here\n        return {};\n    }\n};`,
      'JavaScript': `/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar solution = function(nums) {\n    // Your code here\n};`
    };
    
    setUserCode(codeTemplates[language] || '// Your solution here');
    setCodeAnalysis(null);
  };

  const handleCodeChange = (code) => {
    setUserCode(code);
  };

  const handleAnalyzeCode = async () => {
    if (!selectedQuestion || !userCode) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await dsa.analyzeCode(userCode, codeLanguage, selectedQuestion.id);
      setCodeAnalysis(response.data.analysis);
      setNotification({
        open: true, 
        message: 'Code analysis completed', 
        severity: 'success'
      });
    } catch (err) {
      console.error('Error analyzing code:', err);
      setError('Failed to analyze code');
      setNotification({
        open: true, 
        message: 'Failed to analyze code', 
        severity: 'error'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGetHints = async () => {
    if (!selectedQuestion) return;
    
    setIsLoadingHints(true);
    
    try {
      const response = await dsa.getPatternHints(selectedQuestion.id);
      setHints(response.data);
      setNotification({
        open: true, 
        message: 'Hints loaded successfully', 
        severity: 'info'
      });
    } catch (err) {
      console.error('Error getting hints:', err);
      setError('Failed to get hints');
      setNotification({
        open: true, 
        message: 'Failed to get hints', 
        severity: 'error'
      });
    } finally {
      setIsLoadingHints(false);
    }
  };

  const toggleSolved = async () => {
    if (!selectedQuestion) return;
    
    setIsLoading(true);
    
    try {
      if (selectedQuestion.solved) {
        await dsa.markAsUnsolved(selectedQuestion.id);
        setNotification({
          open: true,
          message: 'Question marked as unsolved',
          severity: 'info'
        });
      } else {
        await dsa.markAsSolved(selectedQuestion.id);
        setNotification({
          open: true,
          message: 'Question marked as solved! Great job!',
          severity: 'success'
        });
      }
      
      // Update the selected question and questions list
      const updatedSolved = !selectedQuestion.solved;
      setSelectedQuestion({...selectedQuestion, solved: updatedSolved});
      setQuestions(questions.map(q => 
        q.id === selectedQuestion.id ? {...q, solved: updatedSolved} : q
      ));
      setFilteredQuestions(filteredQuestions.map(q => 
        q.id === selectedQuestion.id ? {...q, solved: updatedSolved} : q
      ));
    } catch (err) {
      console.error('Error updating question status:', err);
      setNotification({
        open: true,
        message: 'Failed to update question status',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!selectedQuestion) return;
    
    setIsLoading(true);
    
    try {
      if (selectedQuestion.favorite) {
        await dsa.removeFromFavorites(selectedQuestion.id);
        setNotification({
          open: true,
          message: 'Question removed from favorites',
          severity: 'info'
        });
      } else {
        await dsa.addToFavorites(selectedQuestion.id);
        setNotification({
          open: true,
          message: 'Question added to favorites',
          severity: 'success'
        });
      }
      
      // Update the selected question and questions list
      const updatedFavorite = !selectedQuestion.favorite;
      setSelectedQuestion({...selectedQuestion, favorite: updatedFavorite});
      setQuestions(questions.map(q => 
        q.id === selectedQuestion.id ? {...q, favorite: updatedFavorite} : q
      ));
      setFilteredQuestions(filteredQuestions.map(q => 
        q.id === selectedQuestion.id ? {...q, favorite: updatedFavorite} : q
      ));
    } catch (err) {
      console.error('Error updating favorite status:', err);
      setNotification({
        open: true,
        message: 'Failed to update favorite status',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const renderDifficultyChip = (difficulty) => {
    const colorMap = {
      Easy: 'success',
      Medium: 'warning',
      Hard: 'error',
    };
    return (
      <Chip 
        label={difficulty} 
        color={colorMap[difficulty] || 'default'} 
        size="small" 
        variant="outlined"
      />
    );
  };

  return (
    <Box className="dsa-practice">
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>

      <Grid container spacing={2}>
        {/* Left panel - Question list */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, height: '100%', minHeight: '80vh' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">DSA Problems</Typography>
              <Button 
                variant="outlined" 
                startIcon={<FilterListIcon />}
                onClick={() => setShowFilters(!showFilters)}
                size="small"
              >
                Filters
              </Button>
            </Box>

            {showFilters && (
              <Box sx={{ mb: 2, p: 1, backgroundColor: 'background.paper', borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Difficulty</InputLabel>
                      <Select
                        value={difficulty}
                        label="Difficulty"
                        onChange={(e) => setDifficulty(e.target.value)}
                      >
                        {difficultyOptions.map(option => (
                          <MenuItem key={option} value={option}>{option}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Topics</InputLabel>
                      <Select
                        multiple
                        value={topics}
                        label="Topics"
                        onChange={(e) => setTopics(e.target.value)}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        {topicOptions.map(option => (
                          <MenuItem key={option} value={option}>{option}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Companies</InputLabel>
                      <Select
                        multiple
                        value={companies}
                        label="Companies"
                        onChange={(e) => setCompanies(e.target.value)}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        {companyOptions.map(option => (
                          <MenuItem key={option} value={option}>{option}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Button 
                      variant="contained" 
                      fullWidth
                      onClick={fetchQuestions}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Loading...' : 'Apply Filters'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            )}

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : (
              <Box sx={{ maxHeight: showFilters ? '50vh' : '70vh', overflow: 'auto' }}>
                {filteredQuestions.length > 0 ? (
                  filteredQuestions.map(question => (
                    <Card 
                      key={question.id} 
                      sx={{ 
                        mb: 1, 
                        cursor: 'pointer', 
                        bgcolor: selectedQuestion?.id === question.id ? 'action.selected' : 'background.paper',
                        border: selectedQuestion?.id === question.id ? 1 : 0,
                        borderColor: 'primary.main'
                      }}
                      onClick={() => handleQuestionSelect(question)}
                    >
                      <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {question.solved ? 
                              <CheckCircleOutlineIcon color="success" fontSize="small" /> : 
                              <RadioButtonUncheckedIcon fontSize="small" />
                            }
                            <Typography variant="body2" noWrap>{question.title}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {question.favorite && <StarIcon color="warning" fontSize="small" />}
                            {renderDifficultyChip(question.difficulty)}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Typography variant="body2" sx={{ py: 2, textAlign: 'center' }}>
                    No questions found. Try different filters.
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right panel - Question details and code editor */}
        <Grid item xs={12} md={8}>
          {selectedQuestion ? (
            <Paper elevation={3} sx={{ p: 2, height: '100%', minHeight: '80vh' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">{selectedQuestion.title}</Typography>
                <Box>
                  <IconButton 
                    color={selectedQuestion.favorite ? "warning" : "default"} 
                    onClick={toggleFavorite}
                    disabled={isLoading}
                  >
                    {selectedQuestion.favorite ? <StarIcon /> : <StarBorderIcon />}
                  </IconButton>
                  <Button
                    variant={selectedQuestion.solved ? "outlined" : "contained"}
                    color={selectedQuestion.solved ? "success" : "primary"}
                    onClick={toggleSolved}
                    disabled={isLoading}
                    startIcon={selectedQuestion.solved ? <CheckCircleOutlineIcon /> : <RadioButtonUncheckedIcon />}
                    sx={{ ml: 1 }}
                  >
                    {selectedQuestion.solved ? 'Solved' : 'Mark Solved'}
                  </Button>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {renderDifficultyChip(selectedQuestion.difficulty)}
                {selectedQuestion.topics.map(topic => (
                  <Chip key={topic} label={topic} size="small" />
                ))}
              </Box>

              <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                <Tab label="Problem" />
                <Tab label="Code" />
                <Tab label="Analysis" disabled={!codeAnalysis} />
                <Tab label="Hints" />
              </Tabs>

              <Box sx={{ mt: 2, p: 1 }}>
                {activeTab === 0 && (
                  <Box>
                    <Typography variant="h6">Problem Description</Typography>
                    <Typography variant="body1" sx={{ my: 2 }}>
                      {selectedQuestion.description}
                    </Typography>

                    {selectedQuestion.example && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1">Example:</Typography>
                        <Paper sx={{ p: 1, bgcolor: 'background.paper', mt: 1 }}>
                          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                            {selectedQuestion.example}
                          </pre>
                        </Paper>
                      </Box>
                    )}

                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle1">Companies:</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {selectedQuestion.companies.map(company => (
                          <Chip key={company} label={company} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  </Box>
                )}

                {activeTab === 1 && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <FormControl sx={{ minWidth: 120 }} size="small">
                        <InputLabel>Language</InputLabel>
                        <Select
                          value={codeLanguage}
                          label="Language"
                          onChange={(e) => handleLanguageChange(e.target.value)}
                        >
                          {languageOptions.map(lang => (
                            <MenuItem key={lang} value={lang}>{lang}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Box>
                        <Button
                          variant="outlined"
                          startIcon={<HelpOutlineIcon />}
                          onClick={handleGetHints}
                          disabled={isLoadingHints}
                          sx={{ mr: 1 }}
                        >
                          Get Hints
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<CodeIcon />}
                          onClick={handleAnalyzeCode}
                          disabled={isAnalyzing || !userCode}
                        >
                          {isAnalyzing ? 'Analyzing...' : 'Analyze Code'}
                        </Button>
                      </Box>
                    </Box>

                    <Paper 
                      elevation={1} 
                      sx={{ 
                        height: '60vh', 
                        overflow: 'auto',
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <CodeEditor
                        value={userCode}
                        onChange={handleCodeChange}
                        language={codeLanguage.toLowerCase()}
                        height="60vh"
                      />
                    </Paper>
                  </Box>
                )}

                {activeTab === 2 && codeAnalysis && (
                  <Box sx={{ p: 1 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BugReportIcon /> Code Analysis Results
                    </Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1">Time & Space Complexity:</Typography>
                      <Box sx={{ display: 'flex', gap: 4, mt: 1 }}>
                        {codeAnalysis.time_complexity && (
                          <Typography variant="body2">
                            <strong>Time:</strong> {codeAnalysis.time_complexity}
                          </Typography>
                        )}
                        {codeAnalysis.space_complexity && (
                          <Typography variant="body2">
                            <strong>Space:</strong> {codeAnalysis.space_complexity}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {codeAnalysis.bugs && codeAnalysis.bugs.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" color="error">Issues and Bugs:</Typography>
                        <ul>
                          {codeAnalysis.bugs.map((bug, index) => (
                            <li key={index}>
                              <Typography variant="body2">{bug}</Typography>
                            </li>
                          ))}
                        </ul>
                      </Box>
                    )}

                    {codeAnalysis.optimizations && codeAnalysis.optimizations.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" color="primary">Optimization Suggestions:</Typography>
                        <ul>
                          {codeAnalysis.optimizations.map((opt, index) => (
                            <li key={index}>
                              <Typography variant="body2">{opt}</Typography>
                            </li>
                          ))}
                        </ul>
                      </Box>
                    )}

                    {codeAnalysis.improved_code && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle1" color="success.main">Improved Solution:</Typography>
                        <Paper sx={{ p: 1, mt: 1, bgcolor: 'background.paper' }}>
                          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                            {codeAnalysis.improved_code}
                          </pre>
                        </Paper>
                      </Box>
                    )}
                  </Box>
                )}

                {activeTab === 3 && (
                  <Box sx={{ p: 1 }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LightbulbIcon color="warning" /> Hints & Patterns
                    </Typography>
                    
                    {isLoadingHints ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                      </Box>
                    ) : hints ? (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body1">
                          {hints.hints}
                        </Typography>
                        
                        {hints.similar_problems && hints.similar_problems.length > 0 && (
                          <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle1">Similar Problems:</Typography>
                            <ul>
                              {hints.similar_problems.map((problem, index) => (
                                <li key={index}>
                                  <Typography variant="body2">{problem}</Typography>
                                </li>
                              ))}
                            </ul>
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Typography variant="body1">
                          Click "Get Hints" in the Code tab to receive helpful hints and patterns for solving this problem.
                        </Typography>
                        <Button
                          variant="outlined"
                          startIcon={<HelpOutlineIcon />}
                          onClick={handleGetHints}
                          disabled={isLoadingHints}
                          sx={{ mt: 2 }}
                        >
                          Get Hints
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </Paper>
          ) : (
            <Paper elevation={3} sx={{ p: 4, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6">Select a problem from the list to get started</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  No problem selected. Choose a DSA problem from the list on the left to view details and start coding.
                </Typography>
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default DSAPractice;
