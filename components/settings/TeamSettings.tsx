'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Users, Plus, Copy, Trash2, Crown, Shield, User, CreditCard } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { useTranslations } from 'next-intl';
import type { OrgRole } from '@/types';

interface OrgMember {
  id: string;
  userId: string;
  role: string;
  user: { name: string; email: string; image?: string | null };
  createdAt: Date;
}

interface OrgInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date | null;
}

interface OrganizationData {
  id: string;
  name: string;
  slug: string;
  members?: OrgMember[];
  invitations?: OrgInvitation[];
}

interface TeamSettingsProps {
  userId: string;
}

const roleIcons: Record<string, React.ReactNode> = {
  owner: <Crown className="h-3 w-3" />,
  admin: <Shield className="h-3 w-3" />,
  member: <User className="h-3 w-3" />,
};

export function TeamSettings({ userId }: TeamSettingsProps) {
  const t = useTranslations('team');
  const [orgs, setOrgs] = useState<OrganizationData[]>([]);
  const [activeOrg, setActiveOrg] = useState<OrganizationData | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);

  // Create org form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgRole>('member');
  const [inviteLink, setInviteLink] = useState('');

  // Remove member confirm dialog
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    setLoading(true);
    try {
      const result = await authClient.organization.list();
      const orgList = (result.data ?? []) as OrganizationData[];
      setOrgs(orgList);
      if (orgList.length > 0 && !activeOrg) {
        await selectOrg(orgList[0].id);
      }
    } catch {
      // No orgs yet
    } finally {
      setLoading(false);
    }
  };

  const selectOrg = async (orgId: string) => {
    try {
      await authClient.organization.setActive({ organizationId: orgId });
      const result = await authClient.organization.getFullOrganization({
        fetchOptions: { cache: 'no-store' },
      });
      if (result.data) {
        setActiveOrg(result.data as unknown as OrganizationData);
      }
    } catch {
      toast.error('Failed to load organization');
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    const slug = newOrgSlug.trim() || newOrgName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');

    startTransition(async () => {
      try {
        const result = await authClient.organization.create({
          name: newOrgName.trim(),
          slug,
        });
        if (result.data) {
          toast.success(t('createSuccess'));
          setNewOrgName('');
          setNewOrgSlug('');
          setShowCreateForm(false);
          await loadOrganizations();
          await selectOrg(result.data.id);
        } else {
          toast.error(t('createError'));
        }
      } catch {
        toast.error(t('createError'));
      }
    });
  };

  const handleInvite = async () => {
    if (!activeOrg || !inviteEmail.trim()) return;

    startTransition(async () => {
      try {
        const result = await authClient.organization.inviteMember({
          email: inviteEmail.trim(),
          role: inviteRole,
          organizationId: activeOrg.id,
        });
        if (result.data) {
          const link = `${window.location.origin}/invite/${result.data.id}`;
          setInviteLink(link);
          setInviteEmail('');
          toast.success(t('inviteSuccess'));
          await selectOrg(activeOrg.id);
        } else {
          toast.error(t('inviteError'));
        }
      } catch {
        toast.error(t('inviteError'));
      }
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success(t('linkCopied'));
    } catch {
      toast.error(t('linkCopyError'));
    }
  };

  const handleRemoveMemberClick = (memberId: string) => {
    setRemoveMemberId(memberId);
  };

  const handleConfirmRemoveMember = async () => {
    if (!activeOrg || !removeMemberId) return;
    setRemoveMemberId(null);

    startTransition(async () => {
      try {
        await authClient.organization.removeMember({
          memberIdOrEmail: removeMemberId,
          organizationId: activeOrg.id,
        });
        toast.success(t('memberRemoved'));
        await selectOrg(activeOrg.id);
      } catch {
        toast.error(t('removeMemberError'));
      }
    });
  };

  const handleUpdateRole = async (memberId: string, newRole: OrgRole) => {
    if (!activeOrg) return;

    startTransition(async () => {
      try {
        await authClient.organization.updateMemberRole({
          memberId,
          role: newRole,
          organizationId: activeOrg.id,
        });
        toast.success(t('roleUpdated'));
        await selectOrg(activeOrg.id);
      } catch {
        toast.error(t('roleUpdateError'));
      }
    });
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!activeOrg) return;

    startTransition(async () => {
      try {
        await authClient.organization.cancelInvitation({
          invitationId,
        });
        toast.success(t('invitationCanceled'));
        await selectOrg(activeOrg.id);
      } catch {
        toast.error(t('invitationCancelError'));
      }
    });
  };

  const handleTeamCheckout = async () => {
    if (!activeOrg) return;

    startTransition(async () => {
      try {
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: 'team', organizationId: activeOrg.id }),
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          toast.error(data.error || t('checkoutError'));
        }
      } catch {
        toast.error(t('checkoutError'));
      }
    });
  };

  const handleManageOrgBilling = async () => {
    if (!activeOrg) return;

    startTransition(async () => {
      try {
        const res = await fetch('/api/stripe/portal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ organizationId: activeOrg.id }),
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          toast.error(t('billingError'));
        }
      } catch {
        toast.error(t('billingError'));
      }
    });
  };

  // Find current user's role in active org
  const currentMember = activeOrg?.members?.find((m) => m.userId === userId);
  const isOwnerOrAdmin = currentMember?.role === 'owner' || currentMember?.role === 'admin';

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>{t('title')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>{t('title')}</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('createTeam')}
          </Button>
        </div>
        <CardDescription>{t('desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create Team Form */}
        {showCreateForm && (
          <form onSubmit={handleCreateOrg} className="space-y-3 p-4 border rounded-lg">
            <div className="grid gap-2">
              <Label>{t('teamName')}</Label>
              <Input
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder={t('teamNamePlaceholder')}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('teamSlug')}</Label>
              <Input
                value={newOrgSlug}
                onChange={(e) => setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder={t('teamSlugPlaceholder')}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isPending}>
                {t('create')}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateForm(false)}>
                {t('cancel')}
              </Button>
            </div>
          </form>
        )}

        {/* Org Selector (if multiple) */}
        {orgs.length > 1 && (
          <div className="flex items-center gap-2">
            <Label>{t('selectTeam')}</Label>
            <Select
              value={activeOrg?.id ?? ''}
              onValueChange={(id) => selectOrg(id)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {orgs.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {orgs.length === 0 && !showCreateForm && (
          <p className="text-sm text-muted-foreground">{t('noTeams')}</p>
        )}

        {/* Active Org Details */}
        {activeOrg && (
          <>
            <Separator />

            {/* Members */}
            <div>
              <h4 className="font-medium mb-3">{t('members')}</h4>
              <div className="space-y-2">
                {activeOrg.members?.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium text-sm">{m.user.name}</div>
                        <div className="text-xs text-muted-foreground">{m.user.email}</div>
                      </div>
                      <Badge variant="outline" className="gap-1">
                        {roleIcons[m.role]}
                        {t(`role.${m.role}`)}
                      </Badge>
                    </div>
                    {isOwnerOrAdmin && m.userId !== userId && (
                      <div className="flex items-center gap-2">
                        <Select
                          value={m.role}
                          onValueChange={(role) => handleUpdateRole(m.id, role as OrgRole)}
                          disabled={isPending}
                        >
                          <SelectTrigger className="w-[110px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">{t('role.admin')}</SelectItem>
                            <SelectItem value="member">{t('role.member')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => handleRemoveMemberClick(m.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Invitations */}
            {activeOrg.invitations && activeOrg.invitations.filter((i) => i.status === 'pending').length > 0 && (
              <div>
                <h4 className="font-medium mb-3">{t('pendingInvitations')}</h4>
                <div className="space-y-2">
                  {activeOrg.invitations
                    .filter((i) => i.status === 'pending')
                    .map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <span className="text-sm">{inv.email}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {t(`role.${inv.role}`)}
                          </Badge>
                        </div>
                        {isOwnerOrAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
                            onClick={() => handleCancelInvitation(inv.id)}
                            disabled={isPending}
                          >
                            {t('cancelInvitation')}
                          </Button>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Invite Member */}
            {isOwnerOrAdmin && (
              <div>
                <h4 className="font-medium mb-3">{t('inviteMember')}</h4>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder={t('inviteEmailPlaceholder')}
                    className="flex-1"
                  />
                  <Select
                    value={inviteRole}
                    onValueChange={(v) => setInviteRole(v as OrgRole)}
                  >
                    <SelectTrigger className="w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">{t('role.admin')}</SelectItem>
                      <SelectItem value="member">{t('role.member')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleInvite} disabled={isPending || !inviteEmail.trim()}>
                    {t('invite')}
                  </Button>
                </div>
                {inviteLink && (
                  <div className="mt-3 flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <code className="text-xs flex-1 overflow-hidden text-ellipsis">
                      {inviteLink}
                    </code>
                    <Button variant="outline" size="sm" onClick={handleCopyLink}>
                      <Copy className="h-3 w-3 mr-1" />
                      {t('copyLink')}
                    </Button>
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Team Billing */}
            {isOwnerOrAdmin && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  {t('billing')}
                </h4>
                <div className="flex gap-2">
                  <Button onClick={handleTeamCheckout} variant="default" disabled={isPending}>
                    {t('subscribeTeam')}
                  </Button>
                  <Button onClick={handleManageOrgBilling} variant="outline" disabled={isPending}>
                    {t('manageBilling')}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        <Dialog open={removeMemberId !== null} onOpenChange={(open) => { if (!open) setRemoveMemberId(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('removeMember')}</DialogTitle>
              <DialogDescription>
                {t('removeMemberConfirm')}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRemoveMemberId(null)}>
                {t('cancel')}
              </Button>
              <Button variant="destructive" onClick={handleConfirmRemoveMember}>
                {t('removeMember')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
