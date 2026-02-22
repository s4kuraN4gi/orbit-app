'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>, isSignUp: boolean) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      if (isSignUp) {
        const { error: signUpError } = await authClient.signUp.email({
          email,
          password,
          name: email.split('@')[0],
        });
        if (signUpError) {
          setError(signUpError.message ?? 'Sign up failed');
          setLoading(false);
          return;
        }
      } else {
        const { error: signInError } = await authClient.signIn.email({
          email,
          password,
        });
        if (signInError) {
          setError(signInError.message ?? 'Sign in failed');
          setLoading(false);
          return;
        }
      }
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Welcome to Orbit</CardTitle>
          <CardDescription>Enter your credentials to access the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-2 text-sm text-red-600 bg-red-50 rounded">
              {error}
            </div>
          )}
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="m@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div className="flex flex-col gap-2 pt-4">
              <Button
                type="button"
                disabled={loading}
                onClick={(e) => {
                  const form = (e.target as HTMLElement).closest('form')!;
                  handleSubmit({ ...new Event('submit'), preventDefault: () => {}, currentTarget: form } as any, false);
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={(e) => {
                  const form = (e.target as HTMLElement).closest('form')!;
                  handleSubmit({ ...new Event('submit'), preventDefault: () => {}, currentTarget: form } as any, true);
                }}
              >
                {loading ? 'Signing up...' : 'Sign Up'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
