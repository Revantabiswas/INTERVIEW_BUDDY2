// Enhanced analytics and performance tracking component
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  Brain,
  Award,
  Calendar,
  Zap
} from "lucide-react";

export function AdvancedAnalytics({ testResults, historicalData = [] }) {
  // Calculate performance trends
  const calculateTrend = (current, previous) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Sample historical data for demonstration
  const sampleHistoricalData = [
    { date: "2024-01-15", score: 75, percentile: 82, subject: "Physics" },
    { date: "2024-01-20", score: 78, percentile: 85, subject: "Physics" },
    { date: "2024-01-25", score: 82, percentile: 87, subject: "Physics" },
    { date: "2024-01-30", score: 80, percentile: 86, subject: "Mathematics" },
    { date: "2024-02-05", score: 85, percentile: 90, subject: "Chemistry" }
  ];

  const data = historicalData.length > 0 ? historicalData : sampleHistoricalData;
  const previousTest = data[data.length - 2];
  const scoreTrend = calculateTrend(testResults.score, previousTest?.score);
  const percentileTrend = calculateTrend(testResults.percentile, previousTest?.percentile);

  // Performance insights
  const generateInsights = () => {
    const insights = [];
    
    if (testResults.accuracy > 85) {
      insights.push({
        type: "strength",
        title: "Excellent Accuracy",
        description: "Your accuracy is above 85%, showing strong conceptual understanding.",
        icon: <Target className="h-5 w-5 text-green-600" />
      });
    }

    if (testResults.unattempted > 3) {
      insights.push({
        type: "improvement",
        title: "Time Management",
        description: "Consider practicing more to improve your solving speed.",
        icon: <Clock className="h-5 w-5 text-yellow-600" />
      });
    }

    if (scoreTrend > 5) {
      insights.push({
        type: "positive",
        title: "Improving Performance",
        description: "Your scores are showing a positive upward trend.",
        icon: <TrendingUp className="h-5 w-5 text-green-600" />
      });
    }

    return insights;
  };

  const insights = generateInsights();

  // Difficulty analysis
  const difficultyAnalysis = [
    { level: "Easy", attempted: 8, correct: 7, percentage: 87.5 },
    { level: "Medium", attempted: 15, correct: 11, percentage: 73.3 },
    { level: "Hard", attempted: 7, correct: 4, percentage: 57.1 }
  ];

  // Time analysis
  const timeAnalysis = [
    { range: "0-2 min", questions: 12, accuracy: 92 },
    { range: "2-4 min", questions: 10, accuracy: 85 },
    { range: "4-6 min", questions: 5, accuracy: 70 },
    { range: "6+ min", questions: 3, accuracy: 60 }
  ];

  return (
    <div className="space-y-6">
      {/* Performance Trends */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Score Trend</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {scoreTrend > 0 ? '+' : ''}{scoreTrend.toFixed(1)}%
                </p>
              </div>
              <div className={`p-3 rounded-full ${scoreTrend >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                {scoreTrend >= 0 ? 
                  <TrendingUp className="h-6 w-6 text-green-600" /> : 
                  <TrendingDown className="h-6 w-6 text-red-600" />
                }
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Percentile Trend</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {percentileTrend > 0 ? '+' : ''}{percentileTrend.toFixed(1)}%
                </p>
              </div>
              <div className={`p-3 rounded-full ${percentileTrend >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                {percentileTrend >= 0 ? 
                  <TrendingUp className="h-6 w-6 text-green-600" /> : 
                  <TrendingDown className="h-6 w-6 text-red-600" />
                }
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Tests Taken</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{data.length}</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="difficulty" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="difficulty">Difficulty Analysis</TabsTrigger>
          <TabsTrigger value="time">Time Analysis</TabsTrigger>
          <TabsTrigger value="insights">Smart Insights</TabsTrigger>
          <TabsTrigger value="goals">Performance Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="difficulty">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance by Difficulty Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {difficultyAnalysis.map((item, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant={
                          item.level === 'Easy' ? 'secondary' : 
                          item.level === 'Medium' ? 'default' : 'destructive'
                        }>
                          {item.level}
                        </Badge>
                        <span className="font-medium">{item.attempted} questions</span>
                      </div>
                      <span className="font-bold text-lg">{item.percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={item.percentage} className="h-3" />
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {item.correct} correct out of {item.attempted} attempted
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Time Allocation Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {timeAnalysis.map((item, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{item.range}</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">
                          ({item.questions} questions)
                        </span>
                      </div>
                      <span className="font-bold text-lg">{item.accuracy}%</span>
                    </div>
                    <Progress value={item.accuracy} className="h-3" />
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                  Time Management Tip
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Your accuracy decreases with longer solving times. Practice quick problem identification 
                  and time-bound solving to improve overall performance.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Powered Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <div key={index} className={`p-4 rounded-lg border-l-4 ${
                    insight.type === 'strength' ? 'bg-green-50 border-green-500 dark:bg-green-900/20' :
                    insight.type === 'improvement' ? 'bg-yellow-50 border-yellow-500 dark:bg-yellow-900/20' :
                    'bg-blue-50 border-blue-500 dark:bg-blue-900/20'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-800">
                        {insight.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">{insight.title}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Performance Goals & Targets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      Score Target
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current: {testResults.score}</span>
                        <span>Target: 95</span>
                      </div>
                      <Progress value={(testResults.score / 95) * 100} className="h-2" />
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {95 - testResults.score} points to reach target
                      </p>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-purple-600" />
                      Percentile Goal
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current: {testResults.percentile}%</span>
                        <span>Target: 95%</span>
                      </div>
                      <Progress value={testResults.percentile} className="h-2" />
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {(95 - testResults.percentile).toFixed(1)}% to reach top 5%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2 text-green-900 dark:text-green-100">
                    Next Milestone: Top 10% Percentile
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    You're currently at {testResults.percentile}% percentile. To reach the top 10% (90th percentile), 
                    focus on improving accuracy in medium-difficulty questions and reduce time per question.
                  </p>
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress to 90th percentile</span>
                      <span>{Math.min(100, (testResults.percentile / 90) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={Math.min(100, (testResults.percentile / 90) * 100)} className="h-2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
