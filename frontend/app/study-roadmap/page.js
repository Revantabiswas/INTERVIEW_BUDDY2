"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar, MapPin, Clock, BookOpen, ArrowRight,
  CalendarCheck, Calendar as CalendarIcon,
  CheckCircle2, Star, BookMarked, Brain, Trophy, Target, Loader2
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { documentApi, roadmapsApi } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

// Topic colors for visual distinction
const topicColors = {
  "Foundations of Algorithms": "from-blue-500/20 to-blue-700/20 border-blue-500/50",
  "Sorting and Order Statistics": "from-green-500/20 to-green-700/20 border-green-500/50",
  "Data Structures": "from-purple-500/20 to-purple-700/20 border-purple-500/50",
  "Advanced Design Techniques": "from-amber-500/20 to-amber-700/20 border-amber-500/50",
  "Graph Algorithms": "from-pink-500/20 to-pink-700/20 border-pink-500/50",
  "Selected Topics": "from-cyan-500/20 to-cyan-700/20 border-cyan-500/50",
};

// Network icon for Graph Algorithms
function Network(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="7" cy="5" r="1" />
      <circle cx="17" cy="5" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
      <circle cx="7" cy="19" r="1" />
      <circle cx="17" cy="19" r="1" />
      <path d="M12 11V5.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5V11" />
      <path d="M18 11h.5a.5.5 0 0 1 .5.5V16" />
      <path d="M23 18v.5a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1-.5-.5V18" />
      <path d="M17 18v.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V18" />
      <path d="M7 18v.5a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1-.5-.5V18" />
      <path d="M1 11v.5a.5.5 0 0 0 .5.5H6a.5.5 0 0 0 .5-.5V11" />
      <path d="M7 11v-5.5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0-.5.5V11" />
    </svg>
  );
}

// Topic icons for visual appeal
const topicIcons = {
  "Foundations of Algorithms": <BookMarked className="h-5 w-5" />,
  "Sorting and Order Statistics": <ArrowRight className="h-5 w-5" />,
  "Data Structures": <BookOpen className="h-5 w-5" />,
  "Advanced Design Techniques": <Brain className="h-5 w-5" />,
  "Graph Algorithms": <Network className="h-5 w-5" />,
  "Selected Topics": <Star className="h-5 w-5" />,
};

// Different difficulty levels with visual indicators
const difficultyBadges = {
  "easy": { label: "Easy", class: "bg-green-500/10 text-green-500 border-green-500/20" },
  "medium": { label: "Medium", class: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  "hard": { label: "Hard", class: "bg-red-500/10 text-red-500 border-red-500/20" },
};

export default function RoadmapPage() {
  const [days, setDays] = useState([30]);
  const [hoursPerDay, setHoursPerDay] = useState([4]);
  const [isExamPrep, setIsExamPrep] = useState(true);
  const [examDate, setExamDate] = useState(new Date("2025/04/17"));
  const [examFormat, setExamFormat] = useState("Mixed");
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState("");
  const [roadmapGenerated, setRoadmapGenerated] = useState(false);
  const [roadmapSteps, setRoadmapSteps] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const [activeStep, setActiveStep] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const docs = await documentApi.getAllDocuments();
      setDocuments(docs);
      if (docs.length > 0) {
        setSelectedDocument(docs[0].id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch documents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateRoadmap = async () => {
    if (!selectedDocument) {
      toast({
        title: "Error",
        description: "Please select a document first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      
      // Call the API with better error handling
      const roadmapData = await roadmapsApi.generateRoadmap(
        selectedDocument, 
        days[0],
        hoursPerDay[0],
        false // not using quick mode
      );

      console.log('Roadmap data received:', roadmapData);
      
      if (!roadmapData) {
        throw new Error("Empty response from roadmap API");
      }

      // Process the roadmap data into our UI format
      const generatedSteps = processRoadmapData(roadmapData);
      
      setRoadmapSteps(generatedSteps);
      setRoadmapGenerated(true);
      toast({
        title: "Success",
        description: "Roadmap generated successfully",
      });
    } catch (error) {
      console.error("Roadmap generation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate roadmap",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Process the structured roadmap data from the API into the UI format
  const processRoadmapData = (roadmapData) => {
    const steps = [];
    
    // Extract schedule data - handle different possible formats from LLM
    let schedule = [];
    
    if (roadmapData.schedule && Array.isArray(roadmapData.schedule)) {
      schedule = roadmapData.schedule;
    } else if (roadmapData.sections && Array.isArray(roadmapData.sections)) {
      // Alternative format might use sections instead of schedule
      schedule = roadmapData.sections.map((section, idx) => ({
        day: idx + 1,
        content: section.content || section.description || '',
        topics: section.topics || [section.title || `Day ${idx + 1}`],
        hours: section.hours || hoursPerDay[0]
      }));
    } else if (typeof roadmapData === 'object' && roadmapData !== null) {
      // In case of unstructured data, create a simple schedule
      const totalDays = days[0] || 30; // Default to user input or 30 days
      
      console.log("Creating schedule from unstructured roadmap data");
      
      // Extract any sections or content we can find
      const overviewText = roadmapData.overview || '';
      const sectionsData = [];
      
      // Try to extract day information from any available field
      for (const key in roadmapData) {
        if (typeof roadmapData[key] === 'string' && roadmapData[key].toLowerCase().includes('day')) {
          sectionsData.push(roadmapData[key]);
        }
      }
      
      // Create a basic schedule from available content or create empty days
      for (let i = 1; i <= totalDays; i++) {
        const dayContent = sectionsData[i-1] || `Day ${i} study plan`;
        schedule.push({
          day: i,
          content: dayContent,
          topics: [`Day ${i} Focus`],
          hours: hoursPerDay[0]
        });
      }
    }
    
    // Ensure days are sequential (day 1, 2, 3...) regardless of what API returns
    schedule = schedule
      .filter(day => day && (day.content || day.topics))
      .map((day, index) => ({
        ...day,
        day: day.day || index + 1, // Use existing day number or create sequential number
        // Ensure these fields exist
        content: day.content || `Study plan for day ${index + 1}`,
        topics: day.topics || []
      }));
    
    // Sort the schedule by day number first
    schedule.sort((a, b) => {
      const dayA = parseInt(a.day) || (index + 1);
      const dayB = parseInt(b.day) || (index + 1);
      return dayA - dayB;
    });
    
    // Ensure we have enough days based on user selection
    const requestedDays = days[0] || 30;
    if (schedule.length < requestedDays) {
      // Add missing days
      for (let i = schedule.length + 1; i <= requestedDays; i++) {
        schedule.push({
          day: i,
          content: `Day ${i} study plan`,
          topics: [`Day ${i} Focus`],
          hours: hoursPerDay[0]
        });
      }
    } else if (schedule.length > requestedDays) {
      // Trim extra days
      schedule = schedule.slice(0, requestedDays);
    }
    
    // Create topic mappings from the roadmap data
    const topicAssignments = {};
    
    // Assign initial topics based on the schedule
    for (const dayData of schedule) {
      const dayNumber = parseInt(dayData.day) || 0;
      const content = dayData.content || '';
      const topics = Array.isArray(dayData.topics) ? dayData.topics : [];
      
      // Find the most appropriate topic for this day
      let topic = null;
      
      // First, try to find a direct match with a known topic
      for (const mainTopic of Object.keys(topicColors)) {
        // Check if this topic is explicitly mentioned
        const isExplicitTopic = topics.some(t => 
          t && typeof t === 'string' && t.toLowerCase().includes(mainTopic.toLowerCase())
        );
        
        // Also check the content for mentions
        const isInContent = typeof content === 'string' && content.toLowerCase().includes(mainTopic.toLowerCase());
        
        if (isExplicitTopic || isInContent) {
          topic = mainTopic;
          break;
        }
      }
      
      // If no direct match, determine topic based on content
      if (!topic) {
        topic = getTopicFromContent(content);
      }
      
      topicAssignments[dayNumber] = topic;
      
      // Determine if this is a milestone day (every 7 days)
      const isMilestone = dayNumber % 7 === 0;
      let milestoneType = null;
      if (isMilestone) {
        // Rotate through milestone types
        const milestoneTypes = ["quiz", "project", "review"];
        milestoneType = milestoneTypes[Math.floor(dayNumber / 7) % milestoneTypes.length];
      }
      
      // Create the step object
        const step = {
        day: dayNumber,
        topic,
        subtopic: topics.length > 0 ? (topics[0] || `Day ${dayNumber}`) : `Day ${dayNumber} Focus`,
        hours: dayData.hours || hoursPerDay[0],
        exercises: Math.floor(Math.random() * 4) + 1, // Random 1-4 exercises
        description: content,
        difficulty: getDifficultyFromContent(content),
        isMilestone,
        milestoneType,
        progress: 0,
        completed: false
      };
      
      // Add resources
      step.resources = generateResourcesForStep(step);

        steps.push(step);
    }
    
    console.log(`Processed ${steps.length} roadmap steps`);
    
    // Sort by day number to ensure correct order
    return steps.sort((a, b) => a.day - b.day);
  };

  // Extract topic from content based on keywords
  const getTopicFromContent = (content) => {
    const topicsKeywords = {
      "Foundations of Algorithms": ["foundations", "basics", "introduction", "fundamentals"],
      "Sorting and Order Statistics": ["sort", "quick", "merge", "heap", "bubble", "order statistics"],
      "Data Structures": ["data structure", "tree", "graph", "hash", "linked list", "stack", "queue"],
      "Advanced Design Techniques": ["dynamic programming", "greedy", "amortized", "design technique"],
      "Graph Algorithms": ["graph", "bfs", "dfs", "shortest path", "spanning tree", "network"],
      "Selected Topics": ["advanced topic", "specialized", "np-complete", "approximation"]
    };
    
    for (const [topic, keywords] of Object.entries(topicsKeywords)) {
      for (const keyword of keywords) {
        if (content.toLowerCase().includes(keyword.toLowerCase())) {
          return topic;
        }
      }
    }
    
    return "Foundations of Algorithms"; // Default topic
  };

  // Determine difficulty based on content and day number
  const getDifficultyFromContent = (content) => {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes("advanced") || 
        lowerContent.includes("complex") || 
        lowerContent.includes("difficult") ||
        lowerContent.includes("challenging")) {
      return "hard";
    } else if (lowerContent.includes("basic") || 
               lowerContent.includes("simple") || 
               lowerContent.includes("fundamental") ||
               lowerContent.includes("introduction")) {
      return "easy";
    }
    
    return "medium"; // Default difficulty
  };

  // Generate resource links for each step
  const generateResourcesForStep = (step) => {
    const resourceTypes = [
      { type: "video", title: "Video Lecture" },
      { type: "document", title: "Reading Materials" },
      { type: "exercise", title: "Practice Problems" }
    ];
    
    // If it's a milestone, provide different resources
    if (step.isMilestone) {
      switch (step.milestoneType) {
        case "quiz":
          return [
            { type: "document", title: "Quiz Preparation", link: "#" },
            { type: "exercise", title: "Sample Questions", link: "#" }
          ];
        case "project":
          return [
            { type: "document", title: "Project Guidelines", link: "#" },
            { type: "video", title: "Implementation Demo", link: "#" }
          ];
        case "review":
          return [
            { type: "document", title: "Review Guide", link: "#" },
            { type: "exercise", title: "Practice Test", link: "#" }
          ];
      }
    }
    
    // Regular day resources
    return resourceTypes.map(resource => ({
      ...resource,
      link: "#"
    }));
  };

  const MilestoneIcon = ({ type }) => {
    switch (type) {
      case "quiz":
        return <CheckCircle2 className="h-5 w-5 text-blue-500" />;
      case "project":
        return <Trophy className="h-5 w-5 text-amber-500" />;
      case "review":
        return <Target className="h-5 w-5 text-green-500" />;
      default:
        return <CheckCircle2 className="h-5 w-5" />;
    }
  };

  if (!isClient) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-6 w-6 mr-2" />
            Study Roadmap Generator
          </CardTitle>
          <CardDescription>
            Create a personalized learning path based on your schedule and goals
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-primary/20 mb-4 animate-spin"></div>
            <div>Loading roadmap generator...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <h1 className="text-3xl font-bold mb-6">Roadmap Generator</h1>
      </div>
      
      <Card className="w-full max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-6 w-6 mr-2" />
            Study Roadmap Generator
          </CardTitle>
          <CardDescription>
            Create a personalized learning path based on your schedule and goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Roadmap generation form */}
            <Card className="lg:col-span-2 border border-muted">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <BookOpen className="mr-2 h-5 w-5 text-primary" />
                  Generate Study Roadmap
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-muted/50 rounded-md flex items-center">
                  <BookOpen className="mr-2 h-5 w-5 text-primary" />
                  <span className="text-sm font-medium truncate">
                    {documents.length > 0 && selectedDocument ? 
                      documents.find(doc => doc.id === selectedDocument)?.filename || "Select a document" : 
                      "No documents available"
                    }
                  </span>
                </div>
                
                <div>
                  <Label>Select Document</Label>
                  <Select 
                    value={selectedDocument} 
                    onValueChange={setSelectedDocument}
                    disabled={isLoading || documents.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoading ? "Loading documents..." : "Choose a document"} />
                    </SelectTrigger>
                    <SelectContent>
                      {documents.length === 0 ? (
                        <SelectItem value="no-docs" disabled>
                          No documents available
                        </SelectItem>
                      ) : (
                        documents.map((doc) => (
                          <SelectItem key={doc.id} value={doc.id}>
                            {doc.filename || doc.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {documents.length === 0 && !isLoading && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Please upload documents in the Document Upload section first
                    </p>
                  )}
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Days available for studying</Label>
                    <span className="text-sm font-medium">{days[0]}</span>
                  </div>
                  <Slider
                    value={days}
                    min={1}
                    max={60}
                    step={1}
                    onValueChange={setDays}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>1</span>
                    <span>60</span>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Hours available per day</Label>
                    <span className="text-sm font-medium">{hoursPerDay[0]}</span>
                  </div>
                  <Slider
                    value={hoursPerDay}
                    min={1}
                    max={12}
                    step={1}
                    onValueChange={setHoursPerDay}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>1</span>
                    <span>12</span>
                  </div>
                </div>
                
                <div>
                  <Label className="mb-2 block">Additional preferences</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={isExamPrep}
                      onCheckedChange={setIsExamPrep}
                      id="exam-prep"
                    />
                    <Label htmlFor="exam-prep" className="cursor-pointer">Exam preparation</Label>
                  </div>
                </div>
                
                {isExamPrep && (
                  <div className="space-y-4 pl-5 border-l-2 border-primary/30 mt-2">
                    <div>
                      <Label className="mb-2 block">Exam date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {examDate ? format(examDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={examDate}
                            onSelect={setExamDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div>
                      <Label className="mb-2 block">Exam format</Label>
                      <Select value={examFormat} onValueChange={setExamFormat}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Multiple Choice">Multiple Choice</SelectItem>
                          <SelectItem value="Written">Written</SelectItem>
                          <SelectItem value="Practical">Practical</SelectItem>
                          <SelectItem value="Mixed">Mixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  onClick={generateRoadmap}
                  className="w-full"
                  size="lg"
                  disabled={isGenerating || !selectedDocument || documents.length === 0}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                  <Calendar className="mr-2 h-5 w-5" />
                  Generate Roadmap
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            {/* Roadmap visualization */}
            <Card className="lg:col-span-3 border border-muted">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <MapPin className="mr-2 h-5 w-5 text-primary" />
                  Your Study Roadmap
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : !roadmapGenerated ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                    <div className="relative w-24 h-24 mb-6">
                      <div className="absolute inset-0 rounded-full bg-primary/10"></div>
                      <MapPin className="h-24 w-24 text-primary/40" />
                    </div>
                    <p className="max-w-md">
                      Configure your study parameters and generate a personalized roadmap based on your schedule and learning goals
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-2">
                      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 p-2 mb-4 rounded-lg border border-muted flex justify-between items-center">
                        <div className="text-sm font-medium">
                          <Badge variant="outline" className="mr-2">
                            {roadmapSteps.length} learning days
                          </Badge>
                          <Badge variant="outline">
                            {roadmapSteps.filter(s => s.isMilestone).length} milestones
                          </Badge>
                        </div>
                        <div>
                          <Progress value={30} className="h-2 w-28" />
                        </div>
                      </div>
                      
                      <Tabs defaultValue="timeline" className="mb-4">
                        <TabsList className="mb-4">
                          <TabsTrigger value="timeline">Timeline</TabsTrigger>
                          <TabsTrigger value="topics">Topics</TabsTrigger>
                        </TabsList>
                        <TabsContent value="timeline">
                          {roadmapSteps.map((step, index) => (
                            <div
                              key={`step-${index}`}
                              className={cn(
                                "relative pl-6 pb-3 border-l-2",
                                index === roadmapSteps.length - 1 ? "border-primary/20" : "border-primary/40"
                              )}
                              onMouseEnter={() => setActiveStep(index)}
                              onMouseLeave={() => setActiveStep(null)}
                            >
                              <div 
                                className={cn(
                                  "absolute left-[-8px] top-0 w-4 h-4 rounded-full",
                                  step.isMilestone ? "bg-amber-500 ring-4 ring-amber-500/20" : "bg-primary",
                                )}
                              />
                              
                              <Card
                                className={cn(
                                  "transition-all",
                                  step.isMilestone 
                                    ? "bg-gradient-to-r from-amber-500/10 to-amber-700/5 border-amber-500/30" 
                                    : `bg-gradient-to-r ${topicColors[step.topic] || "from-primary/10 to-primary/5 border-primary/30"}`,
                                  activeStep === index ? "shadow-md" : "shadow-sm"
                                )}
                              >
                                <CardContent className="p-3">
                                  <div className="flex justify-between items-center mb-1">
                                    <div className="font-semibold flex items-center space-x-1">
                                      {step.isMilestone ? (
                                        <>
                                          <MilestoneIcon type={step.milestoneType || "quiz"} />
                                          <Badge className="px-2 ml-1">
                                            MILESTONE
                                          </Badge>
                                        </>
                                      ) : (
                                        <>
                                          <CalendarCheck className="h-4 w-4 mr-1 text-primary" />
                                          <span>Day {step.day}</span>
                                        </>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <div className="text-sm text-muted-foreground flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        <span>{step.hours} hrs</span>
                                      </div>
                                      <Badge variant="outline" className={cn(
                                        "text-xs", 
                                        difficultyBadges[step.difficulty].class
                                      )}>
                                        {difficultyBadges[step.difficulty].label}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  <div className="mb-1 flex items-center">
                                    {!step.isMilestone && (
                                      <div className="mr-1 text-muted-foreground">
                                        {topicIcons[step.topic] || <BookOpen className="h-4 w-4" />}
                                      </div>
                                    )}
                                    <div className="text-sm font-medium">{step.topic}</div>
                                  </div>
                                  
                                  <div className="flex justify-between items-center mt-2">
                                    <div className="flex items-center text-primary/90 font-semibold text-sm">
                                      <ArrowRight className="h-3 w-3 mr-1" /> 
                                      {step.subtopic}
                                    </div>
                                    {!step.isMilestone && (
                                      <div className="text-xs text-muted-foreground">
                                        {step.exercises} exercises
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Show extra details on hover or active */}
                                  {activeStep === index && (
                                    <>
                                      <Separator className="my-2" />
                                      <div className="text-xs text-muted-foreground">
                                        <p>{step.description}</p>
                                        {step.resources && (
                                          <div className="mt-2 flex gap-2">
                                            {step.resources.map((resource, idx) => (
                                              <Badge key={idx} variant="outline" className="text-[10px]">
                                                {resource.title}
                                              </Badge>
                                            ))}
                                          </div>
                                        )}
                                        {!step.isMilestone && step.progress !== undefined && (
                                          <div className="mt-2">
                                            <div className="flex justify-between text-[10px] mb-1">
                                              <span>Progress</span>
                                              <span>{Math.round(step.progress)}%</span>
                                            </div>
                                            <Progress value={step.progress} className="h-1" />
                                          </div>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </CardContent>
                              </Card>
                            </div>
                          ))}
                        </TabsContent>
                        <TabsContent value="topics">
                          <div className="space-y-4">
                            {Object.keys(topicColors).map(topic => (
                              <Card key={topic} className={`bg-gradient-to-r ${topicColors[topic]}`}>
                                <CardHeader className="py-3">
                                  <CardTitle className="text-base flex items-center">
                                    {topicIcons[topic]}
                                    <span className="ml-2">{topic}</span>
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="py-2">
                                  <p className="text-sm text-muted-foreground">
                                    {roadmapSteps.filter(s => s.topic === topic).length} learning days
                                  </p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
