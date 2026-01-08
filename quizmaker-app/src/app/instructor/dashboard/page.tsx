'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BookOpen,
  Plus,
  Trophy,
  BarChart3,
  LogOut,
  User,
  ChevronDown,
  FileQuestion,
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface DashboardStats {
  totalQuestions: number;
  totalAttempts: number;
  categories: string[];
}

export default function InstructorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch user info
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      if (userData.success) {
        setUser(userData.user);
      }

      // Fetch questions to get stats
      const questionsRes = await fetch('/api/questions?limit=1');
      const questionsData = await questionsRes.json();
      
      // Fetch categories
      const categoriesRes = await fetch('/api/questions/categories');
      const categoriesData = await categoriesRes.json();

      setStats({
        totalQuestions: questionsData.total || 0,
        totalAttempts: 0, // Would need a separate endpoint for this
        categories: categoriesData.categories || [],
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <BookOpen className="h-5 w-5 text-emerald-500" />
              </div>
              <h1 className="text-xl font-bold text-slate-100">QuizMaker</h1>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 ml-2">
                Instructor
              </Badge>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-slate-300 hover:text-slate-100 hover:bg-slate-700">
                  <User className="h-4 w-4 mr-2" />
                  {loading ? <Skeleton className="h-4 w-24" /> : user?.name}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-slate-700">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-slate-100">{user?.name}</p>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
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
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-100 mb-2">
            Welcome back, {loading ? '...' : user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-slate-400">
            Manage your quiz questions and track student performance
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Questions</CardTitle>
              <FileQuestion className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-slate-100">{stats?.totalQuestions || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Categories</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-slate-100">{stats?.categories?.length || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Leaderboard</CardTitle>
              <Trophy className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <Link href="/api/quiz/leaderboard" target="_blank">
                <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                  View Rankings
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-500" />
                Create MCQ
              </CardTitle>
              <CardDescription className="text-slate-400">
                Add a new multiple choice question to your quiz bank
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/instructor/questions/new">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  New Question
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <FileQuestion className="h-5 w-5 text-blue-500" />
                Manage MCQs
              </CardTitle>
              <CardDescription className="text-slate-400">
                View, edit, or delete your existing questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/instructor/questions">
                <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700">
                  View All Questions
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Categories List */}
        {stats?.categories && stats.categories.length > 0 && (
          <Card className="border-slate-700 bg-slate-800/50 mt-6">
            <CardHeader>
              <CardTitle className="text-slate-100">Your Categories</CardTitle>
              <CardDescription className="text-slate-400">
                Categories you&apos;ve used in your questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {stats.categories.map((category) => (
                  <Badge 
                    key={category} 
                    variant="secondary"
                    className="bg-slate-700 text-slate-200 hover:bg-slate-600"
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
