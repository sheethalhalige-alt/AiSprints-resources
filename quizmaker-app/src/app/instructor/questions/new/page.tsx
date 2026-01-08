'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookOpen, ArrowLeft, Plus, Trash2, Check } from 'lucide-react';

interface OptionInput {
  optionText: string;
  isCorrect: boolean;
}

export default function NewQuestionPage() {
  const router = useRouter();
  const [questionText, setQuestionText] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [points, setPoints] = useState(1);
  const [options, setOptions] = useState<OptionInput[]>([
    { optionText: '', isCorrect: true },
    { optionText: '', isCorrect: false },
    { optionText: '', isCorrect: false },
    { optionText: '', isCorrect: false },
  ]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOptionChange = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index].optionText = text;
    setOptions(newOptions);
  };

  const handleCorrectChange = (index: string) => {
    const newOptions = options.map((opt, i) => ({
      ...opt,
      isCorrect: i === parseInt(index),
    }));
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, { optionText: '', isCorrect: false }]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 4) {
      const newOptions = options.filter((_, i) => i !== index);
      // If removed option was correct, make first option correct
      if (options[index].isCorrect && newOptions.length > 0) {
        newOptions[0].isCorrect = true;
      }
      setOptions(newOptions);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/questions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText,
          category: category || undefined,
          difficulty,
          points,
          options,
        }),
      });

      const data = await response.json() as { message?: string };

      if (!response.ok) {
        setError(data.message || 'Failed to create question');
        setLoading(false);
        return;
      }

      router.push('/instructor/questions');
    } catch {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const correctIndex = options.findIndex((opt) => opt.isCorrect).toString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <nav className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
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
            <h1 className="text-xl font-bold text-slate-100">Create Question</h1>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-6 rounded-md bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Question Text */}
          <Card className="border-slate-700 bg-slate-800/50 mb-6">
            <CardHeader>
              <CardTitle className="text-slate-100">Question</CardTitle>
              <CardDescription className="text-slate-400">
                Enter the question text (10-1000 characters)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder=""
                required
                minLength={10}
                maxLength={1000}
                rows={4}
                className="border-slate-600 bg-slate-700/50 text-slate-100 placeholder:text-slate-500 focus-visible:ring-emerald-500"
              />
              <p className="text-xs text-slate-500 mt-2">
                {questionText.length}/1000 characters
              </p>
            </CardContent>
          </Card>

          {/* Options */}
          <Card className="border-slate-700 bg-slate-800/50 mb-6">
            <CardHeader>
              <CardTitle className="text-slate-100">Answer Options</CardTitle>
              <CardDescription className="text-slate-400">
                Add 4-6 options and select the correct answer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={correctIndex} onValueChange={handleCorrectChange}>
                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <RadioGroupItem
                        value={index.toString()}
                        id={`option-${index}`}
                        className="border-slate-500 text-emerald-500"
                      />
                      <Input
                        value={option.optionText}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        required
                        maxLength={500}
                        className="flex-1 border-slate-600 bg-slate-700/50 text-slate-100 placeholder:text-slate-500 focus-visible:ring-emerald-500"
                      />
                      {option.isCorrect && (
                        <Check className="h-5 w-5 text-emerald-500" />
                      )}
                      {options.length > 4 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(index)}
                          className="text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </RadioGroup>
              
              {options.length < 6 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addOption}
                  className="mt-4 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              )}
              
              <p className="text-xs text-slate-500 mt-3">
                Select the radio button next to the correct answer
              </p>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="border-slate-700 bg-slate-800/50 mb-6">
            <CardHeader>
              <CardTitle className="text-slate-100">Settings</CardTitle>
              <CardDescription className="text-slate-400">
                Configure difficulty, category, and points
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-200">Difficulty</Label>
                  <Select value={difficulty} onValueChange={(v: 'easy' | 'medium' | 'hard') => setDifficulty(v)}>
                    <SelectTrigger className="border-slate-600 bg-slate-700/50 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="easy" className="text-slate-100">Easy</SelectItem>
                      <SelectItem value="medium" className="text-slate-100">Medium</SelectItem>
                      <SelectItem value="hard" className="text-slate-100">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">Category (Optional)</Label>
                  <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder=""
                    className="border-slate-600 bg-slate-700/50 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">Points</Label>
                  <Input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    className="border-slate-600 bg-slate-700/50 text-slate-100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Link href="/instructor/questions" className="flex-1">
              <Button
                type="button"
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? 'Creating...' : 'Create Question'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

