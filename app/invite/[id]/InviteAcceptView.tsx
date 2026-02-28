'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, AlertTriangle } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { syncOrgSeatCount } from './actions';

interface InviteAcceptViewProps {
  invitationId: string;
  organizationId: string;
  organizationName: string;
  role: string;
  email: string;
  currentEmail: string;
  isWrongAccount: boolean;
}

export function InviteAcceptView({
  invitationId,
  organizationId,
  organizationName,
  role,
  email,
  currentEmail,
  isWrongAccount,
}: InviteAcceptViewProps) {
  const t = useTranslations('invite');
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await authClient.organization.acceptInvitation({
        invitationId,
      });
      // Sync seat count since Better Auth's afterAddMember hook
      // doesn't fire on invitation acceptance
      await syncOrgSeatCount(organizationId);
      toast.success(t('acceptSuccess'));
      window.location.href = '/dashboard';
    } catch {
      toast.error(t('acceptError'));
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await authClient.organization.rejectInvitation({
        invitationId,
      });
      toast.success(t('rejectSuccess'));
      window.location.href = '/dashboard';
    } catch {
      toast.error(t('rejectError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccount = async () => {
    setLoading(true);
    try {
      await authClient.signOut({
        fetchOptions: { onSuccess: () => {} },
      });
      window.location.href = `/login?redirect=/invite/${invitationId}`;
    } catch {
      toast.error(t('signOutError'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Users className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>
            {t('description', { org: organizationName })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isWrongAccount && (
            <div className="p-4 rounded-lg border border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-950 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    {t('wrongAccount')}
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                    {t('wrongAccountDesc', { invited: email, current: currentEmail })}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSwitchAccount}
                disabled={loading}
              >
                {t('switchAccount')}
              </Button>
            </div>
          )}

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">{t('invitedAs')}</p>
            <Badge variant="outline" className="text-sm">
              {role}
            </Badge>
          </div>

          {!isWrongAccount && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleReject}
                disabled={loading}
              >
                {t('decline')}
              </Button>
              <Button
                className="flex-1"
                onClick={handleAccept}
                disabled={loading}
              >
                {loading ? t('accepting') : t('accept')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
