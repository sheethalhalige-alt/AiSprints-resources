'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  GraduationCap,
  ArrowLeft,
  Trophy,
  Target,
  Flame,
  TrendingUp,
  BarChart3,
} from 'lucide-react';

interface Statistics {
  totalAttempts: number;
  correctAttempts: number;
  totalScore: number;
  averageScore: number;
  successRate: number;
  categoryBreakdown: Array<{
    category: string;
    attempts: number;
    correct: number;
    successRate: number;
  }>;
  difficultyBreakdown: Array<{
    difficulty: 'easy' | 'medium' | 'hard';
    attempts: number;
    correct: number;
    successRate: number;
  }>;
}

export default function StatisticsPage() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/quiz/statistics');
      const data = await response.json();

      if (data.success) {
        setStats(data.statistics);
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy':
        return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'hard':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-400';
    if (rate >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/student/quiz">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <GraduationCap className="h-5 w-5 text-blue-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-100">Your Statistics</h1>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-48 rounded-lg" />
          </div>
        ) : !stats ? (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="py-12 text-center">
              <BarChart3 className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-100 mb-2">No Statistics Yet</h2>
              <p className="text-slate-400 mb-6">
                Complete some quizzes to see your performance statistics!
              </p>
              <Link href="/student/quiz">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Take a Quiz
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-slate-700 bg-slate-800/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-500" />
                    <CardTitle className="text-sm font-medium text-slate-400">
                      Total Attempts
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-100">{stats.totalAttempts}</div>
                </CardContent>
              </Card>

              <Card className="border-slate-700 bg-slate-800/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-amber-500" />
                    <CardTitle className="text-sm font-medium text-slate-400">
                      Success Rate
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${getSuccessRateColor(stats.successRate)}`}>
                    {stats.successRate}%
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-700 bg-slate-800/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-emerald-500" />
                    <CardTitle className="text-sm font-medium text-slate-400">
                      Total Score
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-400">{stats.totalScore}</div>
                </CardContent>
              </Card>

              <Card className="border-slate-700 bg-slate-800/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    <CardTitle className="text-sm font-medium text-slate-400">
                      Avg Score
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-400">
                    {stats.averageScore.toFixed(1)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Difficulty Breakdown */}
            <Card className="border-slate-700 bg-slate-800/50 mb-6">
              <CardHeader>
                <CardTitle className="text-slate-100">Performance by Difficulty</CardTitle>
                <CardDescription className="text-slate-400">
                  See how you perform across different difficulty levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.difficultyBreakdown.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">No data available</p>
                ) : (
                  <div className="space-y-4">
                    {stats.difficultyBreakdown.map((item) => (
                      <div key={item.difficulty}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getDifficultyColor(item.difficulty)}>
                              {item.difficulty}
                            </Badge>
                            <span className="text-sm text-slate-400">
                              {item.correct}/{item.attempts} correct
                            </span>
                          </div>
                          <span className={`font-semibold ${getSuccessRateColor(item.successRate)}`}>
                            {item.successRate}%
                          </span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              item.successRate >= 80
                                ? 'bg-green-500'
                                : item.successRate >= 60
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${item.successRate}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            {stats.categoryBreakdown.length > 0 && (
              <Card className="border-slate-700 bg-slate-800/50">
                <CardHeader>
                  <CardTitle className="text-slate-100">Performance by Category</CardTitle>
                  <CardDescription className="text-slate-400">
                    Your performance across different topics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.categoryBreakdown.map((item, index) => (
                      <div key={item.category}>
                        {index > 0 && <Separator className="bg-slate-700 my-4" />}
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-slate-200">{item.category}</h4>
                            <p className="text-sm text-slate-400">
                              {item.correct} of {item.attempts} questions correct
                            </p>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${getSuccessRateColor(item.successRate)}`}>
                              {item.successRate}%
                            </div>
                            <p className="text-xs text-slate-500">success rate</p>
                          </div>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden mt-2">
                          <div
                            className={`h-full rounded-full transition-all ${
                              item.successRate >= 80
                                ? 'bg-green-500'
                                : item.successRate >= 60
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${item.successRate}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

