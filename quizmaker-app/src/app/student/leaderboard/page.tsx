'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  GraduationCap,
  ArrowLeft,
  Trophy,
  Medal,
  Award,
} from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  studentId: string;
  studentName: string;
  totalScore: number;
  totalAttempts: number;
  correctAttempts: number;
  successRate: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/quiz/leaderboard?limit=20');
      const data = await response.json();

      if (data.success) {
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-amber-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-slate-300" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-slate-400 font-mono text-sm">#{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-amber-500/10 border-amber-500/30';
      case 2:
        return 'bg-slate-400/10 border-slate-400/30';
      case 3:
        return 'bg-amber-700/10 border-amber-700/30';
      default:
        return '';
    }
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Trophy className="h-5 w-5 text-amber-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-100">Leaderboard</h1>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Top Students
            </CardTitle>
            <CardDescription className="text-slate-400">
              Rankings based on total quiz scores
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-transparent">
                  <TableHead className="text-slate-400 w-16">Rank</TableHead>
                  <TableHead className="text-slate-400">Student</TableHead>
                  <TableHead className="text-slate-400 text-right">Score</TableHead>
                  <TableHead className="text-slate-400 text-right hidden md:table-cell">Attempts</TableHead>
                  <TableHead className="text-slate-400 text-right hidden md:table-cell">Success</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i} className="border-slate-700">
                      <TableCell><Skeleton className="h-6 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : leaderboard.length === 0 ? (
                  <TableRow className="border-slate-700">
                    <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                      No rankings yet. Be the first to take a quiz!
                    </TableCell>
                  </TableRow>
                ) : (
                  leaderboard.map((entry) => (
                    <TableRow
                      key={entry.studentId}
                      className={`border-slate-700 hover:bg-slate-700/30 ${getRankStyle(entry.rank)}`}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center justify-center w-8 h-8">
                          {getRankIcon(entry.rank)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center">
                            <GraduationCap className="h-4 w-4 text-slate-400" />
                          </div>
                          <span className="text-slate-200 font-medium">{entry.studentName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            entry.rank <= 3
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-slate-700 text-slate-300 border-slate-600'
                          }
                        >
                          {entry.totalScore} pts
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right hidden md:table-cell text-slate-400">
                        {entry.totalAttempts}
                      </TableCell>
                      <TableCell className="text-right hidden md:table-cell">
                        <span
                          className={
                            entry.successRate >= 80
                              ? 'text-green-400'
                              : entry.successRate >= 60
                              ? 'text-amber-400'
                              : 'text-slate-400'
                          }
                        >
                          {entry.successRate}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

