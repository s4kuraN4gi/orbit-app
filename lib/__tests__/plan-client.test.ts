import { describe, it, expect } from 'vitest';
import { getPlanLimits } from '../plan-client';

describe('getPlanLimits', () => {
  // [Sponsorware] Free tier now has same limits as pro during adoption phase
  it('returns free tier limits', () => {
    const limits = getPlanLimits('free');
    expect(limits.tier).toBe('free');
    expect(limits.maxProjects).toBe(Infinity);
    expect(limits.maxTasksPerProject).toBe(Infinity);
    expect(limits.maxContextHistory).toBe(Infinity);
    expect(limits.maxImportsPerMonth).toBe(Infinity);
    expect(limits.exportFormats).toEqual(['markdown', 'json', 'custom']);
    expect(limits.contextDiff).toBe(true);
  });

  it('returns pro tier limits', () => {
    const limits = getPlanLimits('pro');
    expect(limits.tier).toBe('pro');
    expect(limits.maxProjects).toBe(Infinity);
    expect(limits.maxTasksPerProject).toBe(Infinity);
    expect(limits.maxContextHistory).toBe(Infinity);
    expect(limits.maxImportsPerMonth).toBe(Infinity);
    expect(limits.exportFormats).toEqual(['markdown', 'json', 'custom']);
    expect(limits.contextDiff).toBe(true);
  });

  it('returns team tier limits', () => {
    const limits = getPlanLimits('team');
    expect(limits.tier).toBe('team');
    expect(limits.maxProjects).toBe(Infinity);
    expect(limits.contextDiff).toBe(true);
  });

  it('team and pro have identical limits except tier name', () => {
    const pro = getPlanLimits('pro');
    const team = getPlanLimits('team');
    expect(pro.maxProjects).toBe(team.maxProjects);
    expect(pro.maxTasksPerProject).toBe(team.maxTasksPerProject);
    expect(pro.exportFormats).toEqual(team.exportFormats);
  });

  // [Sponsorware] Free tier now matches pro during adoption phase
  it('free tier has same limits as pro during sponsorware phase', () => {
    const free = getPlanLimits('free');
    const pro = getPlanLimits('pro');
    expect(free.maxProjects).toBe(pro.maxProjects);
    expect(free.maxTasksPerProject).toBe(pro.maxTasksPerProject);
    expect(free.exportFormats).toEqual(pro.exportFormats);
  });
});
