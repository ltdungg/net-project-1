'use client';
import { useState } from 'react';
import { AiCopilot } from './ai-copilot';
import { DashboardBuilder } from './dashboard-builder';
import { AiProviderStatus } from '@/components/ai/provider-status';

export function AiWorkspace({ canBuild }: { canBuild: boolean }) {
  const [tab, setTab] = useState<'chat' | 'dashboard'>('chat');
  return (
    <>
      <div className="mb-5">
        <AiProviderStatus admin />
      </div>
      <div
        className="mb-6 flex flex-wrap gap-2"
        aria-label="Chức năng trợ lý quản trị"
      >
        <button
          aria-pressed={tab === 'chat'}
          onClick={() => setTab('chat')}
          className={`rounded-full px-5 py-2.5 text-sm font-semibold ${tab === 'chat' ? 'bg-primary text-primary-foreground' : 'border border-border bg-card'}`}
        >
          Tư vấn vận hành
        </button>
        {canBuild && (
          <button
            aria-pressed={tab === 'dashboard'}
            onClick={() => setTab('dashboard')}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold ${tab === 'dashboard' ? 'bg-primary text-primary-foreground' : 'border border-border bg-card'}`}
          >
            Tạo dashboard
          </button>
        )}
      </div>
      <div hidden={tab !== 'chat'}>
        <AiCopilot />
      </div>
      {canBuild && tab === 'dashboard' && <DashboardBuilder />}
    </>
  );
}
