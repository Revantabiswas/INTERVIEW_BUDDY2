// Test statistics and performance tracking component
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Calendar,
  Award,
  Clock,
  BookOpen,
  Users,
  Zap
} from "lucide-react";

export function TestStatistics() {
  const [timeframe, setTimeframe] = useState("week");

  // Sample statistics data
  const stats = {
    week: {
      testsAttempted: 8,
      avgScore: 78.5,
      avgPercentile: 82.3,
      totalTime: "6h 45m",
      improvement: 12.5,
      streak: 5
    },
    month: {
      testsAttempted: 32,
      avgScore: 76.2,
      avgPercentile: 79.8,
      totalTime: "28h 30m",
      improvement: 8.7,
      streak: 12
    },
    year: {
      testsAttempted: 156,
      avgScore: 74.8,
      avgPercentile: 77.5,
      totalTime: "142h 15m",
      improvement: 15.2,
      streak: 23
    }
  };

  const currentStats = stats[timeframe];

  const subjectPerformance = [
    { subject: "Physics", tests: 15, avgScore: 82, improvement: 8.5, color: "bg-blue-500" },
    { subject: "Mathematics", tests: 12, avgScore: 79, improvement: 12.3, color: "bg-green-500" },
    { subject: "Chemistry", tests: 10, avgScore: 75, improvement: -2.1, color: "bg-purple-500" },
    { subject: "Biology", tests: 8, avgScore: 88, improvement: 15.7, color: "bg-orange-500" }
  ];

  const achievements = [
    { title: "Test Streak", description: "5 consecutive days", icon: <Zap className="h-5 w-5" />, earned: true },
    { title: "High Scorer", description: "Score above 90%", icon: <Award className="h-5 w-5" />, earned: true },
    { title: "Speed Master", description: "Complete test in <30 min", icon: <Clock className="h-5 w-5" />, earned: false },
    { title: "Subject Expert", description: "80%+ in all subjects", icon: <BookOpen className="h-5 w-5" />, earned: false }
  ];

  const weeklyProgress = [
    { day: "Mon", tests: 2, score: 85 },
    { day: "Tue", tests: 1, score: 78 },
    { day: "Wed", tests: 0, score: 0 },
    { day: "Thu", tests: 2, score: 82 },
    { day: "Fri", tests: 1, score: 88 },
    { day: "Sat", tests: 1, score: 75 },
    { day: "Sun", tests: 1, score: 90 }
  ];

  return (
    <div className="space-y-6">
      {/* Timeframe Selector */}
      <div className="flex gap-2">
        {["week", "month", "year"].map((period) => (
          <Button
            key={period}
            variant={timeframe === period ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeframe(period)}
            className="capitalize"
          >
            {period}
          </Button>
        ))}
      </div>

      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Tests Attempted</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {currentStats.testsAttempted}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-full">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-blue-600 dark:text-blue-400 text-sm">
                This {timeframe}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Average Score</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {currentStats.avgScore.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-800 rounded-full">
                <Target className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <p className="text-green-600 dark:text-green-400 text-sm">
                +{currentStats.improvement.toFixed(1)}% improvement
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Avg Percentile</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                  {currentStats.avgPercentile.toFixed(1)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-800 rounded-full">
                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-300" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-purple-600 dark:text-purple-400 text-sm">
                Top {(100 - currentStats.avgPercentile).toFixed(1)}% performer
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Study Time</p>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                  {currentStats.totalTime}
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-800 rounded-full">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-300" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-orange-600 dark:text-orange-400 text-sm">
                {currentStats.streak} day streak
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Performance and Weekly Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Subject Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subjectPerformance.map((subject, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${subject.color}`}></div>
                      <span className="font-medium">{subject.subject}</span>
                      <Badge variant="outline" className="text-xs">
                        {subject.tests} tests
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{subject.avgScore}%</p>
                      <p className={`text-xs ${subject.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {subject.improvement >= 0 ? '+' : ''}{subject.improvement.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <Progress value={subject.avgScore} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weeklyProgress.map((day, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-10 text-sm font-medium">{day.day}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{day.tests} tests</span>
                      {day.score > 0 && (
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          ({day.score}% avg)
                        </span>
                      )}
                    </div>
                    <Progress value={day.tests * 20} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 transition-all ${
                  achievement.earned
                    ? 'border-gold bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-100'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    achievement.earned 
                      ? 'bg-yellow-100 dark:bg-yellow-800' 
                      : 'bg-slate-100 dark:bg-slate-700'
                  }`}>
                    {achievement.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{achievement.title}</h4>
                    <p className="text-xs opacity-80">{achievement.description}</p>
                  </div>
                </div>
                {achievement.earned && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700 dark:text-yellow-300">
                      Earned
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
