import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import useMediaQuery from '@mui/material/useMediaQuery';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded';
import ListRoundedIcon from '@mui/icons-material/ListRounded';
import ReviewHeader from './components/ReviewHeader.jsx';
import TestRunPanel from './components/TestRunPanel.jsx';
import DiffListPanel, { getDeviceLabel } from './components/DiffListPanel.jsx';
import DiffViewer from './components/DiffViewer.jsx';
import ReviewEmptyState from './components/ReviewEmptyState.jsx';

const DRAWER_WIDTH = 340;
const MIN_PANEL = 200;
const MAX_PANEL = 500;
const DEFAULT_RUNS_W = 280;
const DEFAULT_DIFFS_W = 300;

/**
 * Standalone Review UI for PixelGuard visual regression testing.
 *
 * @param {object}  props
 * @param {string}  [props.apiBase='']  Base URL for the review server API.
 * @param {function} [props.onBack]     Called when the user clicks the back button.
 */
export default function ReviewPage({ apiBase = '', onBack } = {}) {
  const API_BASE = apiBase;

  const [testRuns, setTestRuns] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState('');
  const [selectedDiffId, setSelectedDiffId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewportFilter, setViewportFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ciMeta, setCiMeta] = useState(null);
  const [reviewComplete, setReviewComplete] = useState(null); // null | 'approved' | 'rejected' | 'reset'
  const [bannerDismissed, setBannerDismissed] = useState(false);

  /* ---- Responsive breakpoints ---- */
  const isCompact = useMediaQuery('(max-width:1199px)');
  const isMobile = useMediaQuery('(max-width:899px)');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState(0);

  /* ---- Collapsible + Resizable panels ---- */
  const [runsCollapsed, setRunsCollapsed] = useState(false);
  const [diffsCollapsed, setDiffsCollapsed] = useState(false);
  const [runsWidth, setRunsWidth] = useState(DEFAULT_RUNS_W);
  const [diffsWidth, setDiffsWidth] = useState(DEFAULT_DIFFS_W);
  const dragging = useRef(null);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      if (dragging.current === 'runs') {
        setRunsWidth(() => Math.max(MIN_PANEL, Math.min(MAX_PANEL, clientX)));
      } else if (dragging.current === 'diffs') {
        const runsW = runsCollapsed || isCompact ? 0 : runsWidth;
        setDiffsWidth(() => Math.max(MIN_PANEL, Math.min(MAX_PANEL, clientX - runsW)));
      }
    };
    const onUp = () => { dragging.current = null; document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [isCompact, runsCollapsed, runsWidth]);

  const startDrag = useCallback((panel) => (e) => {
    e.preventDefault();
    dragging.current = panel;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  /* ================================================================
     Data fetching
     ================================================================ */
  const fetchData = useCallback(async () => {
    try {
      let status, results, meta;
      const isStatic = typeof window !== 'undefined' && window.__PIXELGUARD_STATIC__;

      if (isStatic) {
        const s = window.__PIXELGUARD_STATIC__;
        status = s.status || [];
        results = s.results || { comparisons: [], timestamp: new Date().toISOString() };
        meta = s.meta || null;
      } else {
        const [statusRes, resultsRes, metaRes] = await Promise.all([
          fetch(`${API_BASE}/api/status`),
          fetch(`${API_BASE}/api/results`),
          fetch(`${API_BASE}/api/meta`),
        ]);
        status = await statusRes.json();
        results = await resultsRes.json();
        meta = await metaRes.json().catch(() => null);
      }

      if (meta) setCiMeta(meta);
      const IMG_BASE = isStatic ? '.' : API_BASE;

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
              diffUrl: `${IMG_BASE}/img/diff/${tech}/${comp.imageName}.png`,
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
            baselineUrl: `${IMG_BASE}/img/baseline/${comp.imageName}.png`,
            currentUrl: `${IMG_BASE}/img/current/${comp.imageName}.png`,
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
  }, [selectedRunId, API_BASE]);

  useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ================================================================
     Derived state
     ================================================================ */
  const selectedRun = useMemo(() => testRuns.find((r) => r.id === selectedRunId), [testRuns, selectedRunId]);

  const filteredDiffs = useMemo(() => {
    if (!selectedRun) return [];
    return selectedRun.diffs.filter((d) => {
      const matchesSearch = search === '' || d.name.toLowerCase().includes(search.toLowerCase()) || d.techniques.some((t) => t.label.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
      const device = getDeviceLabel(d.viewport);
      const matchesViewport = viewportFilter === 'all' || device.toLowerCase() === viewportFilter;
      return matchesSearch && matchesStatus && matchesViewport;
    });
  }, [selectedRun, search, statusFilter, viewportFilter]);

  const selectedDiff = useMemo(() => filteredDiffs.find((d) => d.id === selectedDiffId), [filteredDiffs, selectedDiffId]);
  const currentDiffIndex = useMemo(() => filteredDiffs.findIndex((d) => d.id === selectedDiffId), [filteredDiffs, selectedDiffId]);

  const allDiffs = useMemo(() => testRuns.flatMap((r) => r.diffs), [testRuns]);
  const totalPending = allDiffs.filter((d) => d.status === 'pending').length;
  const totalApproved = allDiffs.filter((d) => d.status === 'approved').length;
  const totalRejected = allDiffs.filter((d) => d.status === 'rejected').length;

  /* ================================================================
     Notify GitHub when all reviews are complete
     ================================================================ */
  const isStatic = typeof window !== 'undefined' && !!window.__PIXELGUARD_STATIC__;

  const updateGitHubStatus = useCallback(
    async (newPending, newApproved, newRejected) => {
      if (newPending > 0) {
        setReviewComplete(null);
        setBannerDismissed(false);
        return;
      }
      const allApproved = newRejected === 0;

      if (isStatic) {
        setReviewComplete(allApproved ? 'approved' : 'rejected');
        setBannerDismissed(false);
        return;
      }

      if (!ciMeta || !ciMeta.repository || ciMeta.commitSha === 'local') return;
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
      } catch { /* silently fail */ }
    },
    [ciMeta, API_BASE, isStatic],
  );

  /* ================================================================
     Review actions
     ================================================================ */
  const reviewAction = useCallback(async (imageName, action, comment = '') => {
    if (isStatic) {
      setTestRuns(prev => prev.map(run => ({
        ...run,
        diffs: run.diffs.map(d =>
          d.imageName === imageName
            ? { ...d, status: action === 'approve' ? 'approved' : 'rejected' }
            : d
        ),
      })));
      return;
    }
    await fetch(`${API_BASE}/api/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, file: imageName, comment }),
    });
    await fetchData();
  }, [fetchData, API_BASE]);

  useEffect(() => {
    if (!loading && allDiffs.length > 0) {
      updateGitHubStatus(totalPending, totalApproved, totalRejected);
    }
  }, [totalPending, totalApproved, totalRejected]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApprove = useCallback((diffId) => {
    const diff = allDiffs.find((d) => d.id === diffId);
    if (diff) {
      reviewAction(diff.imageName, 'approve');
      const next = filteredDiffs.find((d, i) => i > currentDiffIndex && d.status === 'pending');
      if (next) setSelectedDiffId(next.id);
    }
  }, [allDiffs, reviewAction, filteredDiffs, currentDiffIndex]);

  const handleReject = useCallback((diffId) => {
    const diff = allDiffs.find((d) => d.id === diffId);
    if (diff) {
      reviewAction(diff.imageName, 'reject');
      const next = filteredDiffs.find((d, i) => i > currentDiffIndex && d.status === 'pending');
      if (next) setSelectedDiffId(next.id);
    }
  }, [allDiffs, reviewAction, filteredDiffs, currentDiffIndex]);

  const handleApproveAll = useCallback(async () => {
    if (isStatic) {
      setTestRuns(prev => prev.map(run => ({
        ...run,
        diffs: run.diffs.map(d => d.status === 'pending' ? { ...d, status: 'approved' } : d),
      })));
      return;
    }
    await fetch(`${API_BASE}/api/review/all`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve-all', comment: '' }) });
    await fetchData();
  }, [fetchData, API_BASE, isStatic]);

  const handleRejectAll = useCallback(async () => {
    if (isStatic) {
      setTestRuns(prev => prev.map(run => ({
        ...run,
        diffs: run.diffs.map(d => d.status === 'pending' ? { ...d, status: 'rejected' } : d),
      })));
      return;
    }
    await fetch(`${API_BASE}/api/review/all`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reject-all', comment: '' }) });
    await fetchData();
  }, [fetchData, API_BASE, isStatic]);

  const handleReset = useCallback(async () => {
    if (isStatic) {
      setTestRuns(prev => prev.map(run => ({
        ...run,
        diffs: run.diffs.map(d => ({ ...d, status: 'pending' })),
      })));
      setReviewComplete('reset');
      setBannerDismissed(false);
      return;
    }
    await fetch(`${API_BASE}/api/review/reset`, { method: 'POST' });
    await fetchData();
  }, [fetchData, API_BASE, isStatic]);

  const handleNext = useCallback(() => {
    if (currentDiffIndex < filteredDiffs.length - 1) setSelectedDiffId(filteredDiffs[currentDiffIndex + 1].id);
  }, [currentDiffIndex, filteredDiffs]);

  const handlePrevious = useCallback(() => {
    if (currentDiffIndex > 0) setSelectedDiffId(filteredDiffs[currentDiffIndex - 1].id);
  }, [currentDiffIndex, filteredDiffs]);

  const handleSelectRun = useCallback((id) => {
    setSelectedRunId(id);
    setSelectedDiffId('');
    setSearch('');
    setStatusFilter('all');
    setViewportFilter('all');
  }, []);

  const handleSelectRunDrawer = useCallback((id) => {
    handleSelectRun(id);
    setDrawerTab(1);
  }, [handleSelectRun]);

  const handleSelectDiffDrawer = useCallback((id) => {
    setSelectedDiffId(id);
    setDrawerOpen(false);
  }, []);

  /* ================================================================
     Keyboard shortcuts
     ================================================================ */
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); handlePrevious(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); handleNext(); }
      if ((e.key === 'a' || e.key === 'A') && !e.ctrlKey && !e.metaKey && selectedDiff) { e.preventDefault(); handleApprove(selectedDiff.id); }
      if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey && selectedDiff) { e.preventDefault(); handleReject(selectedDiff.id); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handlePrevious, handleNext, handleApprove, handleReject, selectedDiff]);

  /* ================================================================
     Loading / Error states
     ================================================================ */
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', bgcolor: '#09090b', color: '#fafafa' }}>
        Carregando...
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', bgcolor: '#09090b', color: '#fca5a5', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ fontSize: '1.2rem', fontWeight: 600 }}>Erro ao conectar à API</Box>
        <Box sx={{ fontSize: '0.85rem' }}>{error}</Box>
        <Box sx={{ fontSize: '0.8rem', color: '#71717a' }}>
          Execute: npx pixelguard-review (porta 3060)
        </Box>
      </Box>
    );
  }

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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#09090b', color: '#fafafa' }}>
      <ReviewHeader
        totalPending={totalPending}
        totalApproved={totalApproved}
        totalRejected={totalRejected}
        onReset={handleReset}
        onToggleMenu={() => setDrawerOpen(true)}
        showMenuToggle={isCompact}
        commitSha={ciMeta?.commitShort}
        branch={ciMeta?.branch}
        prNumber={ciMeta?.prNumber}
        repoUrl={ciMeta?.repository ? `https://github.com/${ciMeta.repository}` : undefined}
        onBack={onBack}
      />

      {/* Static mode: Action banner when review is complete */}
      {isStatic && reviewComplete && !bannerDismissed && (() => {
        const meta = window.__PIXELGUARD_STATIC__?.meta;
        const prUrl = meta?.repository && meta?.prNumber
          ? `https://github.com/${meta.repository}/pull/${meta.prNumber}`
          : null;
        const cmd = reviewComplete === 'approved' ? '/approve-visual'
          : reviewComplete === 'rejected' ? '/reject-visual'
          : '/reset-visual';
        const bgColor = reviewComplete === 'approved' ? 'rgba(34,197,94,.12)'
          : reviewComplete === 'rejected' ? 'rgba(239,68,68,.12)'
          : 'rgba(234,179,8,.12)';
        const borderColor = reviewComplete === 'approved' ? 'rgba(34,197,94,.5)'
          : reviewComplete === 'rejected' ? 'rgba(239,68,68,.5)'
          : 'rgba(234,179,8,.5)';
        const icon = reviewComplete === 'approved' ? '✅'
          : reviewComplete === 'rejected' ? '❌'
          : '🔄';
        const msg = reviewComplete === 'approved' ? 'Todas as telas foram aprovadas!'
          : reviewComplete === 'rejected' ? 'Telas rejeitadas!'
          : 'Review resetado para pendente!';

        const handleCopyAndOpen = async () => {
          try { await navigator.clipboard.writeText(cmd); } catch { /* ok */ }
          if (prUrl) window.open(prUrl, '_blank');
        };

        return (
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2,
            px: 2, py: 1.25, flexShrink: 0, flexWrap: 'wrap',
            bgcolor: bgColor, borderBottom: '1px solid', borderColor: borderColor,
          }}>
            <Box sx={{ fontSize: '0.88rem', fontWeight: 600 }}>
              {icon} {msg}
            </Box>
            {prUrl && (
              <Button
                variant="contained"
                onClick={handleCopyAndOpen}
                sx={{
                  fontSize: '0.78rem', textTransform: 'none', fontWeight: 600,
                  bgcolor: reviewComplete === 'approved' ? '#22c55e' : reviewComplete === 'rejected' ? '#ef4444' : '#eab308',
                  '&:hover': { bgcolor: reviewComplete === 'approved' ? '#16a34a' : reviewComplete === 'rejected' ? '#dc2626' : '#ca8a04' },
                  color: '#fff', boxShadow: 'none', height: 34, px: 2.5, borderRadius: 1.5,
                }}
              >
                Abrir PR e colar {cmd}
              </Button>
            )}
            <Button
              variant="text"
              onClick={() => setBannerDismissed(true)}
              sx={{ fontSize: '0.72rem', textTransform: 'none', color: '#71717a', minWidth: 0, px: 1 }}
            >
              Fechar
            </Button>
          </Box>
        );
      })()}

      {/* Unified Drawer (compact / mobile) */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: { bgcolor: '#09090b', width: DRAWER_WIDTH, borderRight: '1px solid hsl(240 3.7% 15.9%)', display: 'flex', flexDirection: 'column' },
        }}
      >
        <Tabs
          value={drawerTab}
          onChange={(_, v) => setDrawerTab(v)}
          variant="fullWidth"
          sx={{
            minHeight: 42, borderBottom: '1px solid hsl(240 3.7% 15.9%)',
            '& .MuiTab-root': { minHeight: 42, textTransform: 'none', fontSize: '0.8rem', fontWeight: 500, color: '#71717a', '&.Mui-selected': { color: '#fafafa' } },
            '& .MuiTabs-indicator': { bgcolor: '#3b82f6' },
          }}
        >
          <Tab icon={<FolderOpenRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Test Runs" />
          <Tab icon={<ListRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Telas" />
        </Tabs>
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {drawerTab === 0 ? (
            <TestRunPanel testRuns={testRuns} selectedRunId={selectedRunId} onSelectRun={handleSelectRunDrawer} />
          ) : (
            <DiffListPanel {...diffListProps} onSelectDiff={handleSelectDiffDrawer} />
          )}
        </Box>
      </Drawer>

      {/* Main layout */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Test Runs sidebar — desktop */}
        {!isCompact && (
          <>
            {runsCollapsed ? (
              <Tooltip title="Expandir Test Runs" placement="right">
                <Box
                  onClick={() => setRunsCollapsed(false)}
                  sx={{
                    width: 36, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 1.5, gap: 1,
                    borderRight: '1px solid', borderColor: 'hsl(240 3.7% 15.9%)', bgcolor: 'hsl(240 10% 3.9%)',
                    cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,.03)' }, transition: 'background-color .15s',
                  }}
                >
                  <ChevronRightRoundedIcon sx={{ fontSize: 16, color: '#71717a' }} />
                  <Box sx={{ writingMode: 'vertical-rl', textOrientation: 'mixed', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#52525b', userSelect: 'none' }}>
                    Test Runs
                  </Box>
                </Box>
              </Tooltip>
            ) : (
              <Box sx={{ width: runsWidth, flexShrink: 0, position: 'relative', display: 'flex' }}>
                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                  <TestRunPanel testRuns={testRuns} selectedRunId={selectedRunId} onSelectRun={handleSelectRun} onCollapse={() => setRunsCollapsed(true)} />
                </Box>
                <Box onMouseDown={startDrag('runs')} onTouchStart={startDrag('runs')} sx={{ width: 6, cursor: 'col-resize', flexShrink: 0, bgcolor: 'transparent', '&:hover': { bgcolor: 'rgba(59,130,246,.3)' }, transition: 'background-color .15s', zIndex: 5 }} />
              </Box>
            )}
          </>
        )}

        {/* Diff list sidebar — tablet+ */}
        {!isMobile && (
          <>
            {diffsCollapsed ? (
              <Tooltip title="Expandir Lista de Telas" placement="right">
                <Box
                  onClick={() => setDiffsCollapsed(false)}
                  sx={{
                    width: 36, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 1.5, gap: 1,
                    borderRight: '1px solid', borderColor: 'hsl(240 3.7% 15.9%)', bgcolor: 'rgba(9,9,11,.5)',
                    cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,.03)' }, transition: 'background-color .15s',
                  }}
                >
                  <ChevronRightRoundedIcon sx={{ fontSize: 16, color: '#71717a' }} />
                  <Box sx={{ writingMode: 'vertical-rl', textOrientation: 'mixed', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#52525b', userSelect: 'none' }}>
                    Telas
                  </Box>
                </Box>
              </Tooltip>
            ) : (
              <Box sx={{ width: diffsWidth, flexShrink: 0, position: 'relative', display: 'flex' }}>
                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                  <DiffListPanel {...diffListProps} onSelectDiff={setSelectedDiffId} onCollapse={() => setDiffsCollapsed(true)} />
                </Box>
                <Box onMouseDown={startDrag('diffs')} onTouchStart={startDrag('diffs')} sx={{ width: 6, cursor: 'col-resize', flexShrink: 0, bgcolor: 'transparent', '&:hover': { bgcolor: 'rgba(59,130,246,.3)' }, transition: 'background-color .15s', zIndex: 5 }} />
              </Box>
            )}
          </>
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
              onOpenDiffs={isMobile ? () => { setDrawerTab(1); setDrawerOpen(true); } : undefined}
              onOpenRuns={isCompact ? () => { setDrawerTab(0); setDrawerOpen(true); } : undefined}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}
