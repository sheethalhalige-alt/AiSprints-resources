import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to QuizMaker
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Create engaging quizzes and test your knowledge with our intuitive platform
          </p>
          
          <div className="flex gap-4 justify-center mb-16">
            <Link href="/login">
              <Button size="lg" className="text-lg px-8 py-6">
                Log In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Sign Up
              </Button>
            </Link>
          </div>

          {/* <div className="grid md:grid-cols-2 gap-8 mt-16">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="text-4xl mb-4">👨‍🏫</div>
              <h3 className="text-2xl font-semibold mb-3">For Instructors</h3>
              <ul className="text-left space-y-2 text-gray-600">
                <li>• Create multiple-choice questions</li>
                <li>• Organize by category and difficulty</li>
                <li>• Track student performance</li>
                <li>• View detailed analytics</li>
              </ul>
            </div> */}

            {/* <div className="bg-white rounded-lg shadow-md p-8">
              <div className="text-4xl mb-4">👨‍🎓</div>
              <h3 className="text-2xl font-semibold mb-3">For Students</h3>
              <ul className="text-left space-y-2 text-gray-600">
                <li>• Take quizzes anytime</li>
                <li>• Instant feedback on answers</li>
                <li>• Track your progress</li>
                <li>• Review past attempts</li>
              </ul>
            </div>
          </div> */}

          {/* <div className="mt-16 bg-blue-100 rounded-lg p-8">
            <h3 className="text-2xl font-semibold mb-4">Features</h3>
            <div className="grid md:grid-cols-3 gap-6 text-gray-700">
              <div>
                <div className="text-3xl mb-2">⚡</div>
                <h4 className="font-semibold mb-1">Fast & Easy</h4>
                <p className="text-sm">Quick question creation and quiz taking</p>
              </div>
              <div>
                <div className="text-3xl mb-2">📊</div>
                <h4 className="font-semibold mb-1">Analytics</h4>
                <p className="text-sm">Detailed insights into performance</p>
              </div>
              <div>
                <div className="text-3xl mb-2">🎯</div>
                <h4 className="font-semibold mb-1">Organized</h4>
                <p className="text-sm">Categories and difficulty levels</p>
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
