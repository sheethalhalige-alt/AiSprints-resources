'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  BookOpen,
  ArrowLeft,
  Target,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  BarChart3,
} from 'lucide-react';

interface QuestionStatistics {
  questionId: string;
  totalAttempts: number;
  correctAttempts: number;
  successRate: number;
  averageTimeSeconds: number | null;
  optionDistribution: Array<{
    optionId: string;
    optionText: string;
    isCorrect: boolean;
    selectionCount: number;
    selectionPercentage: number;
  }>;
}

export default function QuestionStatisticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [stats, setStats] = useState<QuestionStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStatistics();
  }, [id]);

  const fetchStatistics = async () => {
    try {
      const response = await fetch(`/api/questions/${id}/statistics`);
      const data = await response.json();

      if (data.success) {
        setStats(data.statistics);
      } else {
        setError(data.message || 'Failed to load statistics');
      }
    } catch {
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return 'N/A';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 70) return 'text-green-400';
    if (rate >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-6 w-48" />
            </div>
          </div>
        </nav>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Link href="/instructor/questions">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <BookOpen className="h-5 w-5 text-emerald-500" />
              </div>
              <h1 className="text-xl font-bold text-slate-100">Question Statistics</h1>
            </div>
          </div>
        </nav>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="py-12 text-center">
              <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-100 mb-2">Error</h2>
              <p className="text-slate-400 mb-6">{error}</p>
              <Link href="/instructor/questions">
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                  Back to Questions
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/instructor/questions">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <BarChart3 className="h-5 w-5 text-emerald-500" />
              </div>
              <h1 className="text-xl font-bold text-slate-100">Question Statistics</h1>
            </div>
            <Link href={`/instructor/questions/${id}`}>
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                Edit Question
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {stats && (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-slate-700 bg-slate-800/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <CardTitle className="text-xs font-medium text-slate-400">
                      Total Attempts
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-100">{stats.totalAttempts}</div>
                </CardContent>
              </Card>

              <Card className="border-slate-700 bg-slate-800/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <CardTitle className="text-xs font-medium text-slate-400">
                      Correct
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">{stats.correctAttempts}</div>
                </CardContent>
              </Card>

              <Card className="border-slate-700 bg-slate-800/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-amber-500" />
                    <CardTitle className="text-xs font-medium text-slate-400">
                      Success Rate
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getSuccessRateColor(stats.successRate)}`}>
                    {stats.successRate}%
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-700 bg-slate-800/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-500" />
                    <CardTitle className="text-xs font-medium text-slate-400">
                      Avg Time
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-400">
                    {formatTime(stats.averageTimeSeconds)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Option Distribution */}
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-slate-100">Answer Distribution</CardTitle>
                <CardDescription className="text-slate-400">
                  How students answered this question
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.optionDistribution.length === 0 || stats.totalAttempts === 0 ? (
                  <p className="text-slate-500 text-center py-4">
                    No data available yet. Students haven&apos;t attempted this question.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {stats.optionDistribution.map((option, index) => (
                      <div key={option.optionId}>
                        {index > 0 && <Separator className="bg-slate-700 my-4" />}
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {option.isCorrect ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-slate-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-200">{option.optionText}</span>
                                {option.isCorrect && (
                                  <Badge className="bg-green-500/10 text-green-400 border-green-500/30">
                                    Correct
                                  </Badge>
                                )}
                              </div>
                              <span className="text-slate-400">
                                {option.selectionCount} ({option.selectionPercentage}%)
                              </span>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  option.isCorrect ? 'bg-green-500' : 'bg-slate-500'
                                }`}
                                style={{ width: `${option.selectionPercentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Insights */}
            {stats.totalAttempts > 0 && (
              <Card className="border-slate-700 bg-slate-800/50 mt-6">
                <CardHeader>
                  <CardTitle className="text-slate-100">Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-slate-400">
                    {stats.successRate < 30 && (
                      <li className="flex items-start gap-2">
                        <span className="text-amber-400">⚠</span>
                        This question has a low success rate. Consider reviewing the question text or options for clarity.
                      </li>
                    )}
                    {stats.successRate > 90 && (
                      <li className="flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        This question has a very high success rate. It might be too easy for your students.
                      </li>
                    )}
                    {stats.optionDistribution.some(
                      (opt) => !opt.isCorrect && opt.selectionPercentage > 30
                    ) && (
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">ℹ</span>
                        Some incorrect options are selected frequently. They might be good distractors or potentially confusing.
                      </li>
                    )}
                    {stats.averageTimeSeconds && stats.averageTimeSeconds < 10 && (
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400">⏱</span>
                        Students answer this question very quickly (avg {stats.averageTimeSeconds}s).
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

