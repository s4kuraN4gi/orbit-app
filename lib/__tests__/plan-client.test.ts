import { describe, it, expect } from 'vitest';
import { getPlanLimits } from '../plan-client';

describe('getPlanLimits', () => {
  it('returns free tier limits', () => {
    const limits = getPlanLimits('free');
    expect(limits.tier).toBe('free');
    expect(limits.maxProjects).toBe(1);
    expect(limits.maxTasksPerProject).toBe(20);
    expect(limits.maxContextHistory).toBe(3);
    expect(limits.maxImportsPerMonth).toBe(1);
    expect(limits.exportFormats).toEqual(['markdown']);
    expect(limits.contextDiff).toBe(false);
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

  it('free tier is more restrictive than pro', () => {
    const free = getPlanLimits('free');
    const pro = getPlanLimits('pro');
    expect(free.maxProjects).toBeLessThan(pro.maxProjects);
    expect(free.maxTasksPerProject).toBeLessThan(pro.maxTasksPerProject);
    expect(free.exportFormats.length).toBeLessThan(pro.exportFormats.length);
  });
});
