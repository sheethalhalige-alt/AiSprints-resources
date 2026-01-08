'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  GraduationCap,
  User,
  ChevronDown,
  LogOut,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Trophy,
  History,
  BarChart3,
} from 'lucide-react';

interface Question {
  id: string;
  questionText: string;
  category: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  options: Array<{
    id: string;
    optionText: string;
    optionOrder: number;
  }>;
}

interface SubmitResult {
  isCorrect: boolean;
  score: number;
  correctOptionId: string;
  correctOptionText: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
}

export default function StudentQuizPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [noQuestions, setNoQuestions] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const fetchQuestion = useCallback(async () => {
    setLoading(true);
    setResult(null);
    setSelectedOption('');
    setNoQuestions(false);

    try {
      const response = await fetch('/api/quiz/random');
      const data = await response.json();

      if (data.success && data.question) {
        setQuestion(data.question);
        setStartTime(Date.now());
      } else if (data.noQuestions) {
        setNoQuestions(true);
        setQuestion(null);
      }
    } catch (error) {
      console.error('Failed to fetch question:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
    fetchQuestion();
  }, [fetchQuestion]);

  const handleSubmit = async () => {
    if (!selectedOption || !question) return;

    setSubmitting(true);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          selectedOptionId: selectedOption,
          timeTakenSeconds: timeTaken,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          isCorrect: data.isCorrect,
          score: data.score,
          correctOptionId: data.correctOptionId,
          correctOptionText: data.correctOptionText,
        });
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <GraduationCap className="h-5 w-5 text-blue-500" />
              </div>
              <h1 className="text-xl font-bold text-slate-100">QuizMaker</h1>
              <Badge variant="outline" className="border-blue-500/30 text-blue-400 ml-2">
                Student
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2">
                <Link href="/student/attempts">
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-100">
                    <History className="h-4 w-4 mr-2" />
                    History
                  </Button>
                </Link>
                <Link href="/student/statistics">
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-100">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Stats
                  </Button>
                </Link>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-slate-300 hover:text-slate-100 hover:bg-slate-700">
                    <User className="h-4 w-4 mr-2" />
                    {user?.name || <Skeleton className="h-4 w-20" />}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-slate-700">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-slate-100">{user?.name}</p>
                    <p className="text-xs text-slate-400">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  <DropdownMenuItem asChild className="md:hidden">
                    <Link href="/student/attempts" className="text-slate-200 focus:bg-slate-700 cursor-pointer">
                      <History className="h-4 w-4 mr-2" />
                      Attempt History
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="md:hidden">
                    <Link href="/student/statistics" className="text-slate-200 focus:bg-slate-700 cursor-pointer">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Statistics
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/student/leaderboard" className="text-slate-200 focus:bg-slate-700 cursor-pointer">
                      <Trophy className="h-4 w-4 mr-2" />
                      Leaderboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {loading ? (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full mb-6" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : noQuestions ? (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-700">
                <GraduationCap className="h-8 w-8 text-slate-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-100 mb-2">No Questions Available</h2>
              <p className="text-slate-400 mb-6">
                There are no quiz questions available at the moment. Please check back later!
              </p>
              <Button
                onClick={fetchQuestion}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : question ? (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-slate-100">Quiz Question</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getDifficultyColor(question.difficulty)}>
                    {question.difficulty}
                  </Badge>
                  <Badge variant="outline" className="border-slate-600 text-slate-300">
                    {question.points} pts
                  </Badge>
                </div>
              </div>
              {question.category && (
                <CardDescription className="text-slate-400">
                  Category: {question.category}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {/* Question Text */}
              <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
                <p className="text-lg text-slate-100">{question.questionText}</p>
              </div>

              {/* Options */}
              {!result ? (
                <>
                  <RadioGroup
                    value={selectedOption}
                    onValueChange={setSelectedOption}
                    className="space-y-3"
                  >
                    {question.options.map((option) => (
                      <div
                        key={option.id}
                        className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                          selectedOption === option.id
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30'
                        }`}
                        onClick={() => setSelectedOption(option.id)}
                      >
                        <RadioGroupItem
                          value={option.id}
                          id={option.id}
                          className="border-slate-500 text-blue-500"
                        />
                        <Label
                          htmlFor={option.id}
                          className="flex-1 cursor-pointer text-slate-200"
                        >
                          {option.optionText}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  <Button
                    onClick={handleSubmit}
                    disabled={!selectedOption || submitting}
                    className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {submitting ? 'Submitting...' : 'Submit Answer'}
                  </Button>
                </>
              ) : (
                <>
                  {/* Result */}
                  <div
                    className={`rounded-lg p-4 mb-6 flex items-center gap-3 ${
                      result.isCorrect
                        ? 'bg-green-500/10 border border-green-500/30'
                        : 'bg-red-500/10 border border-red-500/30'
                    }`}
                  >
                    {result.isCorrect ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-500" />
                    )}
                    <div>
                      <p
                        className={`font-semibold ${
                          result.isCorrect ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {result.isCorrect ? 'Correct!' : 'Incorrect'}
                      </p>
                      <p className="text-sm text-slate-400">
                        {result.isCorrect
                          ? `You earned ${result.score} points!`
                          : `The correct answer was: ${result.correctOptionText}`}
                      </p>
                    </div>
                  </div>

                  {/* Show options with correct answer highlighted */}
                  <div className="space-y-3 mb-6">
                    {question.options.map((option) => {
                      const isCorrect = option.id === result.correctOptionId;
                      const wasSelected = option.id === selectedOption;
                      let borderClass = 'border-slate-600';
                      let bgClass = '';

                      if (isCorrect) {
                        borderClass = 'border-green-500';
                        bgClass = 'bg-green-500/10';
                      } else if (wasSelected && !result.isCorrect) {
                        borderClass = 'border-red-500';
                        bgClass = 'bg-red-500/10';
                      }

                      return (
                        <div
                          key={option.id}
                          className={`flex items-center space-x-3 rounded-lg border p-4 ${borderClass} ${bgClass}`}
                        >
                          {isCorrect && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                          {wasSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-500" />}
                          {!isCorrect && !wasSelected && <div className="h-5 w-5" />}
                          <span className="text-slate-200">{option.optionText}</span>
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    onClick={fetchQuestion}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Next Question
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

