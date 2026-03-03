import { useState, useMemo, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import useMediaQuery from '@mui/material/useMediaQuery';
import ReviewHeader from './components/review/ReviewHeader';
import TestRunPanel from './components/review/TestRunPanel';
import DiffListPanel, { getDeviceLabel } from './components/review/DiffListPanel';
import DiffViewer from './components/review/DiffViewer';
import ReviewEmptyState from './components/review/ReviewEmptyState';

const API_BASE = '';
const DRAWER_WIDTH = 340;

export default function ReviewPage() {
  const [testRuns, setTestRuns] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState('');
  const [selectedDiffId, setSelectedDiffId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewportFilter, setViewportFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ciMeta, setCiMeta] = useState(null);

  /* ---- Responsive breakpoints ---- */
  const isCompact = useMediaQuery('(max-width:1199px)'); // TestRunPanel → Drawer
  const isMobile = useMediaQuery('(max-width:899px)');   // DiffListPanel → Drawer too
  const [runsOpen, setRunsOpen] = useState(false);
  const [diffsOpen, setDiffsOpen] = useState(false);

  /* ================================================================
     Data fetching
     ================================================================ */
  const fetchData = useCallback(async () => {
    try {
      const [statusRes, resultsRes, metaRes] = await Promise.all([
        fetch(`${API_BASE}/api/status`),
        fetch(`${API_BASE}/api/results`),
        fetch(`${API_BASE}/api/meta`),
      ]);
      const status = await statusRes.json();
      const results = await resultsRes.json();
      const meta = await metaRes.json().catch(() => null);
      if (meta) setCiMeta(meta);

      const run = {
        id: 'run-current',
        branch: meta?.branch || 'current',
        commit: meta?.commitShort || (results?.timestamp ? results.timestamp.slice(0, 7) : 'local'),
        author: meta?.actor || status[0]?.reviewedBy || 'local',
        timestamp: results?.timestamp || new Date().toISOString(),
        totalTests: (results?.comparisons?.length || 0) * 3,
        passed: 0,
        failed: 0,
        pending: 0,
        diffs: [],
      };

      if (results?.comparisons) {
        const techLabels = { pixel: 'Pixel', ssim: 'SSIM', region: 'Região' };

        for (const comp of results.comparisons) {
          const reviewInfo = status.find((s) => s.imageName === comp.imageName);
          const reviewStatus = reviewInfo?.reviewStatus || 'pending';

          const techniques = [];
          for (const tech of ['pixel', 'ssim', 'region']) {
            const r = comp.results[tech];
            let diffPercentage;
            if (tech === 'ssim') {
              diffPercentage = parseFloat(((1 - r.score) * 100).toFixed(2));
            } else if (tech === 'region') {
              diffPercentage = r.totalRegions
                ? parseFloat(((r.failedRegions / r.totalRegions) * 100).toFixed(2))
                : 0;
            } else {
              diffPercentage = parseFloat((r.diffPercent || 0).toFixed(2));
            }
            techniques.push({
              technique: tech,
              label: techLabels[tech],
              diffPercentage,
              passed: r.passed,
              diffUrl: `${API_BASE}/img/diff/${tech}/${comp.imageName}.png`,
            });
            if (r.passed) run.passed++;
            else run.failed++;
          }

          run.diffs.push({
            id: comp.imageName,
            name: comp.imageName,
            imageName: comp.imageName,
            status: reviewStatus,
            viewport: comp.imageName.includes('mobile')
              ? '360×640'
              : comp.imageName.includes('tablet')
                ? '768×1024'
                : '1366×768',
            baselineUrl: `${API_BASE}/img/baseline/${comp.imageName}.png`,
            currentUrl: `${API_BASE}/img/current/${comp.imageName}.png`,
            techniques,
          });

          if (reviewStatus === 'pending') run.pending++;
        }
      }

      setTestRuns([run]);
      if (!selectedRunId) setSelectedRunId(run.id);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedRunId]);

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ================================================================
     Derived state
     ================================================================ */
  const selectedRun = useMemo(
    () => testRuns.find((r) => r.id === selectedRunId),
    [testRuns, selectedRunId],
  );

  const filteredDiffs = useMemo(() => {
    if (!selectedRun) return [];
    return selectedRun.diffs.filter((d) => {
      const matchesSearch =
        search === '' ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.techniques.some((t) => t.label.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
      const device = getDeviceLabel(d.viewport);
      const matchesViewport =
        viewportFilter === 'all' || device.toLowerCase() === viewportFilter;
      return matchesSearch && matchesStatus && matchesViewport;
    });
  }, [selectedRun, search, statusFilter, viewportFilter]);

  const selectedDiff = useMemo(
    () => filteredDiffs.find((d) => d.id === selectedDiffId),
    [filteredDiffs, selectedDiffId],
  );

  const currentDiffIndex = useMemo(
    () => filteredDiffs.findIndex((d) => d.id === selectedDiffId),
    [filteredDiffs, selectedDiffId],
  );

  const allDiffs = useMemo(() => testRuns.flatMap((r) => r.diffs), [testRuns]);
  const totalPending = allDiffs.filter((d) => d.status === 'pending').length;
  const totalApproved = allDiffs.filter((d) => d.status === 'approved').length;
  const totalRejected = allDiffs.filter((d) => d.status === 'rejected').length;

  /* ================================================================
     Notify GitHub when all reviews are complete
     ================================================================ */
  const updateGitHubStatus = useCallback(
    async (newPending, newApproved, newRejected) => {
      if (!ciMeta || !ciMeta.repository || ciMeta.commitSha === 'local') return;

      // Only update when no more pending items
      if (newPending > 0) return;

      const allApproved = newRejected === 0;
      try {
        await fetch(`${API_BASE}/api/github/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            state: allApproved ? 'success' : 'failure',
            description: allApproved
              ? `Review visual aprovado — ${newApproved} tela(s)`
              : `Review visual rejeitado — ${newRejected} tela(s) rejeitada(s)`,
          }),
        });
      } catch {
        // silently fail — user still sees local status
      }
    },
    [ciMeta],
  );

  /* ================================================================
     Review actions
     ================================================================ */
  const reviewAction = useCallback(
    async (imageName, action, comment = '') => {
      await fetch(`${API_BASE}/api/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, file: imageName, comment }),
      });
      await fetchData();
    },
    [fetchData],
  );

  // After fetchData completes, check if we should update GitHub
  useEffect(() => {
    if (!loading && allDiffs.length > 0) {
      updateGitHubStatus(totalPending, totalApproved, totalRejected);
    }
  }, [totalPending, totalApproved, totalRejected]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApprove = useCallback(
    (diffId) => {
      const diff = allDiffs.find((d) => d.id === diffId);
      if (diff) {
        reviewAction(diff.imageName, 'approve');
        const next = filteredDiffs.find(
          (d, i) => i > currentDiffIndex && d.status === 'pending',
        );
        if (next) setSelectedDiffId(next.id);
      }
    },
    [allDiffs, reviewAction, filteredDiffs, currentDiffIndex],
  );

  const handleReject = useCallback(
    (diffId) => {
      const diff = allDiffs.find((d) => d.id === diffId);
      if (diff) {
        reviewAction(diff.imageName, 'reject');
        const next = filteredDiffs.find(
          (d, i) => i > currentDiffIndex && d.status === 'pending',
        );
        if (next) setSelectedDiffId(next.id);
      }
    },
    [allDiffs, reviewAction, filteredDiffs, currentDiffIndex],
  );

  const handleApproveAll = useCallback(async () => {
    await fetch(`${API_BASE}/api/review/all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve-all', comment: '' }),
    });
    await fetchData();
  }, [fetchData]);

  const handleRejectAll = useCallback(async () => {
    await fetch(`${API_BASE}/api/review/all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject-all', comment: '' }),
    });
    await fetchData();
  }, [fetchData]);

  const handleReset = useCallback(async () => {
    await fetch(`${API_BASE}/api/review/reset`, { method: 'POST' });
    await fetchData();
  }, [fetchData]);

  const handleNext = useCallback(() => {
    if (currentDiffIndex < filteredDiffs.length - 1) {
      setSelectedDiffId(filteredDiffs[currentDiffIndex + 1].id);
    }
  }, [currentDiffIndex, filteredDiffs]);

  const handlePrevious = useCallback(() => {
    if (currentDiffIndex > 0) {
      setSelectedDiffId(filteredDiffs[currentDiffIndex - 1].id);
    }
  }, [currentDiffIndex, filteredDiffs]);

  const handleSelectRun = useCallback((id) => {
    setSelectedRunId(id);
    setSelectedDiffId('');
    setSearch('');
    setStatusFilter('all');
    setViewportFilter('all');
  }, []);

  /* ================================================================
     Drawer-aware selection handlers
     ================================================================ */
  const handleSelectRunDrawer = useCallback(
    (id) => {
      handleSelectRun(id);
      setRunsOpen(false);
    },
    [handleSelectRun],
  );

  const handleSelectDiffDrawer = useCallback((id) => {
    setSelectedDiffId(id);
    setDiffsOpen(false);
  }, []);

  /* ================================================================
     Keyboard shortcuts: ← → A R
     ================================================================ */
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
      if (
        (e.key === 'a' || e.key === 'A') &&
        !e.ctrlKey &&
        !e.metaKey &&
        selectedDiff
      ) {
        e.preventDefault();
        handleApprove(selectedDiff.id);
      }
      if (
        (e.key === 'r' || e.key === 'R') &&
        !e.ctrlKey &&
        !e.metaKey &&
        selectedDiff
      ) {
        e.preventDefault();
        handleReject(selectedDiff.id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handlePrevious, handleNext, handleApprove, handleReject, selectedDiff]);

  /* ================================================================
     Loading / Error states
     ================================================================ */
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          bgcolor: '#09090b',
          color: '#fafafa',
        }}
      >
        Carregando...
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          bgcolor: '#09090b',
          color: '#fca5a5',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Box sx={{ fontSize: '1.2rem', fontWeight: 600 }}>Erro ao conectar à API</Box>
        <Box sx={{ fontSize: '0.85rem' }}>{error}</Box>
        <Box sx={{ fontSize: '0.8rem', color: '#71717a' }}>
          Execute: npm run review:ui (porta 3060)
        </Box>
      </Box>
    );
  }

  /* ================================================================
     Shared props for DiffListPanel (used in both inline and drawer)
     ================================================================ */
  const diffListProps = {
    diffs: filteredDiffs,
    selectedDiffId,
    search,
    onSearchChange: setSearch,
    statusFilter,
    onStatusFilterChange: setStatusFilter,
    viewportFilter,
    onViewportFilterChange: setViewportFilter,
    onApproveAll: handleApproveAll,
    onRejectAll: handleRejectAll,
  };

  /* ================================================================
     Render
     ================================================================ */
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        bgcolor: '#09090b',
        color: '#fafafa',
      }}
    >
      <ReviewHeader
        totalPending={totalPending}
        totalApproved={totalApproved}
        totalRejected={totalRejected}
        onReset={handleReset}
        onToggleRuns={() => setRunsOpen(true)}
        onToggleDiffs={() => setDiffsOpen(true)}
        showRunsToggle={isCompact}
        showDiffsToggle={isMobile}
        commitSha={ciMeta?.commitShort}
        branch={ciMeta?.branch}
        prNumber={ciMeta?.prNumber}
        repoUrl={
          ciMeta?.repository
            ? `https://github.com/${ciMeta.repository}`
            : undefined
        }
      />

      {/* ---- Drawers (compact / mobile) ---- */}
      <Drawer
        anchor="left"
        open={runsOpen}
        onClose={() => setRunsOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: 'hsl(240 10% 3.9%)',
            width: DRAWER_WIDTH,
            borderRight: '1px solid hsl(240 3.7% 15.9%)',
          },
        }}
      >
        <TestRunPanel
          testRuns={testRuns}
          selectedRunId={selectedRunId}
          onSelectRun={handleSelectRunDrawer}
        />
      </Drawer>

      <Drawer
        anchor="left"
        open={diffsOpen}
        onClose={() => setDiffsOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#09090b',
            width: DRAWER_WIDTH,
            borderRight: '1px solid hsl(240 3.7% 15.9%)',
          },
        }}
      >
        <DiffListPanel {...diffListProps} onSelectDiff={handleSelectDiffDrawer} />
      </Drawer>

      {/* ---- Main 3-column layout ---- */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Test Runs sidebar — desktop (≥1200px) */}
        {!isCompact && (
          <Box sx={{ width: 300, flexShrink: 0 }}>
            <TestRunPanel
              testRuns={testRuns}
              selectedRunId={selectedRunId}
              onSelectRun={handleSelectRun}
            />
          </Box>
        )}

        {/* Diff list sidebar — tablet+ (≥900px) */}
        {!isMobile && (
          <Box sx={{ width: { xs: 280, xl: 300 }, flexShrink: 0 }}>
            <DiffListPanel {...diffListProps} onSelectDiff={setSelectedDiffId} />
          </Box>
        )}

        {/* Main — Diff viewer or empty state */}
        <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {selectedDiff ? (
            <DiffViewer
              diff={selectedDiff}
              onApprove={handleApprove}
              onReject={handleReject}
              onNext={handleNext}
              onPrevious={handlePrevious}
              hasNext={currentDiffIndex < filteredDiffs.length - 1}
              hasPrevious={currentDiffIndex > 0}
              currentIndex={currentDiffIndex}
              totalCount={filteredDiffs.length}
            />
          ) : (
            <ReviewEmptyState
              onOpenDiffs={isMobile ? () => setDiffsOpen(true) : undefined}
              onOpenRuns={isCompact ? () => setRunsOpen(true) : undefined}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}
