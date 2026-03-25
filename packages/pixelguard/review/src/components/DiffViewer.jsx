import { useState, useRef, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Slider from '@mui/material/Slider';
import Tooltip from '@mui/material/Tooltip';
import Modal from '@mui/material/Modal';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import ZoomInRoundedIcon from '@mui/icons-material/ZoomInRounded';
import ZoomOutRoundedIcon from '@mui/icons-material/ZoomOutRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import FullscreenRoundedIcon from '@mui/icons-material/FullscreenRounded';
import FullscreenExitRoundedIcon from '@mui/icons-material/FullscreenExitRounded';
import ViewColumnRoundedIcon from '@mui/icons-material/ViewColumnRounded';
import LayersRoundedIcon from '@mui/icons-material/LayersRounded';
import ViewCarouselRoundedIcon from '@mui/icons-material/ViewCarouselRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { BORDER, CARD, FG, MUTED, DIM, TechBadge, StatusBadge, KbdHint } from './shared.jsx';

/* ---------- Fullscreen Viewer ---------- */
function FullscreenViewer({ open, onClose, src, label }) {
  const [fsZoom, setFsZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (open) {
      setFsZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [open, src]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setFsZoom((z) => Math.min(5, z + 0.25));
      if (e.key === '-') setFsZoom((z) => Math.max(0.25, z - 0.25));
      if (e.key === '0') { setFsZoom(1); setPan({ x: 0, y: 0 }); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setFsZoom((z) => {
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      return Math.max(0.25, Math.min(5, z + delta));
    });
  }, []);

  const handlePointerDown = useCallback((e) => {
    if (e.button !== 0) return;
    isPanning.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
  }, []);

  const handlePointerUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} sx={{ zIndex: 1400 }}>
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          bgcolor: 'rgba(0,0,0,.92)',
          display: 'flex',
          flexDirection: 'column',
          outline: 'none',
        }}
      >
        {/* Toolbar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1,
            bgcolor: 'rgba(0,0,0,.6)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid rgba(255,255,255,.1)',
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          <Typography sx={{ color: '#fafafa', fontSize: '0.85rem', fontWeight: 500 }}>
            {label}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Diminuir zoom (-)">
              <IconButton
                size="small"
                onClick={() => setFsZoom((z) => Math.max(0.25, z - 0.25))}
                sx={{ color: '#fafafa', '&:hover': { bgcolor: 'rgba(255,255,255,.1)' } }}
              >
                <ZoomOutRoundedIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
            <Typography sx={{ fontFamily: 'monospace', color: '#a1a1aa', fontSize: '0.8rem', minWidth: 50, textAlign: 'center' }}>
              {Math.round(fsZoom * 100)}%
            </Typography>
            <Tooltip title="Aumentar zoom (+)">
              <IconButton
                size="small"
                onClick={() => setFsZoom((z) => Math.min(5, z + 0.25))}
                sx={{ color: '#fafafa', '&:hover': { bgcolor: 'rgba(255,255,255,.1)' } }}
              >
                <ZoomInRoundedIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Resetar (0)">
              <IconButton
                size="small"
                onClick={() => { setFsZoom(1); setPan({ x: 0, y: 0 }); }}
                sx={{ color: '#fafafa', '&:hover': { bgcolor: 'rgba(255,255,255,.1)' } }}
              >
                <RestartAltRoundedIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
            <Box sx={{ width: '1px', height: 20, bgcolor: 'rgba(255,255,255,.15)', mx: 0.5 }} />
            <Tooltip title="Fechar (Esc)">
              <IconButton
                size="small"
                onClick={onClose}
                sx={{ color: '#fafafa', '&:hover': { bgcolor: 'rgba(255,255,255,.1)' } }}
              >
                <CloseRoundedIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Image area */}
        <Box
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          sx={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: fsZoom > 1 ? 'grab' : 'zoom-in',
            '&:active': { cursor: fsZoom > 1 ? 'grabbing' : 'zoom-in' },
          }}
        >
          <Box
            component="img"
            src={src}
            alt={label}
            draggable={false}
            sx={{
              maxWidth: fsZoom <= 1 ? '90vw' : 'none',
              maxHeight: fsZoom <= 1 ? '85vh' : 'none',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${fsZoom})`,
              transformOrigin: 'center center',
              transition: isPanning.current ? 'none' : 'transform 0.15s ease',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        </Box>
      </Box>
    </Modal>
  );
}

/* ---------- Fullscreen Viewer ---------- */
function FullscreenViewer({ open, onClose, src, label }) {
  const [fsZoom, setFsZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (open) {
      setFsZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [open, src]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setFsZoom((z) => Math.min(5, z + 0.25));
      if (e.key === '-') setFsZoom((z) => Math.max(0.25, z - 0.25));
      if (e.key === '0') { setFsZoom(1); setPan({ x: 0, y: 0 }); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setFsZoom((z) => {
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      return Math.max(0.25, Math.min(5, z + delta));
    });
  }, []);

  const handlePointerDown = useCallback((e) => {
    if (e.button !== 0) return;
    isPanning.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
  }, []);

  const handlePointerUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} sx={{ zIndex: 1400 }}>
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          bgcolor: 'rgba(0,0,0,.92)',
          display: 'flex',
          flexDirection: 'column',
          outline: 'none',
        }}
      >
        {/* Toolbar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1,
            bgcolor: 'rgba(0,0,0,.6)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid rgba(255,255,255,.1)',
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          <Typography sx={{ color: '#fafafa', fontSize: '0.85rem', fontWeight: 500 }}>
            {label}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Diminuir zoom (-)">
              <IconButton
                size="small"
                onClick={() => setFsZoom((z) => Math.max(0.25, z - 0.25))}
                sx={{ color: '#fafafa', '&:hover': { bgcolor: 'rgba(255,255,255,.1)' } }}
              >
                <ZoomOutRoundedIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
            <Typography sx={{ fontFamily: 'monospace', color: '#a1a1aa', fontSize: '0.8rem', minWidth: 50, textAlign: 'center' }}>
              {Math.round(fsZoom * 100)}%
            </Typography>
            <Tooltip title="Aumentar zoom (+)">
              <IconButton
                size="small"
                onClick={() => setFsZoom((z) => Math.min(5, z + 0.25))}
                sx={{ color: '#fafafa', '&:hover': { bgcolor: 'rgba(255,255,255,.1)' } }}
              >
                <ZoomInRoundedIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Resetar (0)">
              <IconButton
                size="small"
                onClick={() => { setFsZoom(1); setPan({ x: 0, y: 0 }); }}
                sx={{ color: '#fafafa', '&:hover': { bgcolor: 'rgba(255,255,255,.1)' } }}
              >
                <RestartAltRoundedIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
            <Box sx={{ width: '1px', height: 20, bgcolor: 'rgba(255,255,255,.15)', mx: 0.5 }} />
            <Tooltip title="Fechar (Esc)">
              <IconButton
                size="small"
                onClick={onClose}
                sx={{ color: '#fafafa', '&:hover': { bgcolor: 'rgba(255,255,255,.1)' } }}
              >
                <CloseRoundedIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Image area */}
        <Box
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          sx={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: fsZoom > 1 ? 'grab' : 'zoom-in',
            '&:active': { cursor: fsZoom > 1 ? 'grabbing' : 'zoom-in' },
          }}
        >
          <Box
            component="img"
            src={src}
            alt={label}
            draggable={false}
            sx={{
              maxWidth: fsZoom <= 1 ? '90vw' : 'none',
              maxHeight: fsZoom <= 1 ? '85vh' : 'none',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${fsZoom})`,
              transformOrigin: 'center center',
              transition: isPanning.current ? 'none' : 'transform 0.15s ease',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        </Box>
      </Box>
    </Modal>
  );
}

/* ---------- Screenshot component ---------- */
function ScreenshotImage({ src, label, zoom }) {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <>
      <Box
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: BORDER,
          overflow: 'hidden',
          transformOrigin: 'top left',
          transform: `scale(${zoom / 100})`,
          position: 'relative',
          '&:hover .fullscreen-btn': { opacity: 1 },
        }}
      >
        {/* Browser chrome bar */}
        <Box sx={{ px: 1.5, py: 0.75, display: 'flex', alignItems: 'center', gap: 0.75, bgcolor: 'rgba(255,255,255,.04)' }}>
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#ef4444aa' }} />
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#eab308aa' }} />
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#22c55eaa' }} />
          </Box>
          <Box sx={{ flex: 1, height: 14, borderRadius: 1, bgcolor: 'rgba(255,255,255,.04)', mx: 4 }} />
          {/* Fullscreen button */}
          <Tooltip title="Tela cheia" arrow>
            <IconButton
              className="fullscreen-btn"
              size="small"
              onClick={() => setFullscreen(true)}
              sx={{
                color: '#a1a1aa',
                opacity: 0,
                transition: 'opacity 0.2s',
                width: 22,
                height: 22,
                '&:hover': { bgcolor: 'rgba(255,255,255,.1)', color: '#fafafa' },
              }}
            >
              <FullscreenRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
        {/* Image */}
        <Box
          component="img"
          src={src}
          alt={label}
          onClick={() => setFullscreen(true)}
          sx={{ display: 'block', width: '100%', height: 'auto', bgcolor: '#09090b', cursor: 'zoom-in' }}
          onError={(e) => {
            e.target.style.minHeight = '200px';
            e.target.alt = `Imagem não encontrada: ${label}`;
          }}
        />
      </Box>
      <FullscreenViewer
        open={fullscreen}
        onClose={() => setFullscreen(false)}
        src={src}
        label={label}
      />
    </>
  );
}

/* ---------- Side-by-side view ---------- */
function SideBySideView({ diff, zoom, diffUrl, techniqueLabel }) {
  const panels = [
    { label: 'Baseline', src: diff.baselineUrl },
    { label: 'Atual', src: diff.currentUrl },
    { label: `Diff ${techniqueLabel}`, src: diffUrl },
  ];

  return (
    <Box sx={{ display: 'flex', gap: 2, height: '100%', flexDirection: { xs: 'column', lg: 'row' } }}>
      {panels.map(({ label, src }) => (
        <Box key={label} sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 0.5 }}>
            <Typography sx={{ fontWeight: 500, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.65rem' }}>
              {label}
            </Typography>
            <Box sx={{ flex: 1, height: '1px', bgcolor: BORDER }} />
          </Box>
          <Box sx={{ overflow: 'auto', flex: 1 }}>
            <ScreenshotImage src={src} label={label} zoom={zoom} />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

/* ---------- Overlay view ---------- */
function OverlayView({ diff, zoom, opacity, diffUrl }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Box sx={{ position: 'relative' }}>
        <ScreenshotImage src={diff.baselineUrl} label="Baseline" zoom={zoom} />
        <Box sx={{ position: 'absolute', inset: 0, opacity: opacity / 100 }}>
          <ScreenshotImage src={diffUrl || diff.currentUrl} label="Diff" zoom={zoom} />
        </Box>
      </Box>
    </Box>
  );
}

/* ---------- Slider view ---------- */
function SliderView({ diff, zoom, sliderPosition, sliderRef, onMouseDown, onMouseUp, onMouseMove }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Box
        ref={sliderRef}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseUp}
        sx={{ position: 'relative', cursor: 'col-resize', userSelect: 'none' }}
      >
        {/* Bottom layer — Baseline (always full size, fully visible) */}
        <ScreenshotImage src={diff.baselineUrl} label="Baseline" zoom={zoom} />

        {/* Top layer — Atual, revealed via clip-path (image stays full size) */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          }}
        >
          <ScreenshotImage src={diff.currentUrl} label="Atual" zoom={zoom} />
        </Box>

        {/* Slider handle line */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: '2px',
            bgcolor: '#3b82f6',
            left: `${sliderPosition}%`,
            transform: 'translateX(-50%)',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              width: 36,
              height: 36,
              borderRadius: '50%',
              bgcolor: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 3,
              pointerEvents: 'auto',
            }}
          >
            <ChevronLeftRoundedIcon sx={{ fontSize: 16, color: '#fff', mr: -0.5 }} />
            <ChevronRightRoundedIcon sx={{ fontSize: 16, color: '#fff', ml: -0.5 }} />
          </Box>
        </Box>

        {/* Labels */}
        <Chip label="Atual" size="small" sx={{ position: 'absolute', top: 12, left: 12, zIndex: 20, fontSize: '0.65rem', bgcolor: 'rgba(9,9,11,.85)', color: FG, backdropFilter: 'blur(4px)', height: 22, pointerEvents: 'none' }} />
        <Chip label="Baseline" size="small" sx={{ position: 'absolute', top: 12, right: 12, zIndex: 20, fontSize: '0.65rem', bgcolor: 'rgba(9,9,11,.85)', color: FG, backdropFilter: 'blur(4px)', height: 22, pointerEvents: 'none' }} />
      </Box>
    </Box>
  );
}

/* ========== Main DiffViewer ========== */
export default function DiffViewer({
  diff,
  onApprove,
  onReject,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  currentIndex,
  totalCount,
}) {
  const [viewMode, setViewMode] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [overlayOpacity, setOverlayOpacity] = useState(50);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [showImages, setShowImages] = useState(false);
  const availableTechniques = diff.techniques || [];
  const [selectedTechnique, setSelectedTechnique] = useState(availableTechniques[0]?.technique || 'pixel');
  const sliderRef = useRef(null);
  const isDragging = useRef(false);

  const activeTech = diff.techniques?.find((t) => t.technique === selectedTechnique) || diff.techniques?.[0];
  const diffUrl = activeTech?.diffUrl || '';
  const allPassed = availableTechniques.length > 0 && availableTechniques.every((t) => t.passed);
  const allZero = allPassed && availableTechniques.every((t) => t.diffPercentage === 0);

  // Reset showImages when switching to a different diff
  useEffect(() => { setShowImages(false); }, [diff.id]);

  const handleMouseDown = useCallback(() => { isDragging.current = true; }, []);
  const handleMouseUp = useCallback(() => { isDragging.current = false; }, []);
  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setSliderPosition(Math.max(0, Math.min(100, (x / rect.width) * 100)));
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* =============== Row 1: Navigation + Info + Actions =============== */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: { xs: 1, md: 2 },
          px: { xs: 1.5, sm: 2 },
          py: 1.25,
          borderBottom: '1px solid',
          borderColor: BORDER,
          bgcolor: CARD,
          flexWrap: 'wrap',
          flexShrink: 0,
        }}
      >
        {/* Left: navigation + diff info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
          {/* Navigation arrows */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
            <Tooltip title="Anterior (←)">
              <span>
                <IconButton
                  size="small"
                  onClick={onPrevious}
                  disabled={!hasPrevious}
                  sx={{
                    color: MUTED,
                    width: { xs: 30, sm: 34 },
                    height: { xs: 30, sm: 34 },
                    border: '1px solid',
                    borderColor: BORDER,
                    borderRadius: 1.5,
                    '&:hover': { bgcolor: 'rgba(255,255,255,.06)' },
                    '&.Mui-disabled': { color: '#333', borderColor: 'rgba(255,255,255,.04)' },
                  }}
                >
                  <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </span>
            </Tooltip>
            <Typography sx={{ fontFamily: 'monospace', color: '#71717a', minWidth: { xs: 36, sm: 48 }, textAlign: 'center', fontSize: { xs: '0.7rem', sm: '0.8rem' }, fontWeight: 500 }}>
              {currentIndex + 1} / {totalCount}
            </Typography>
            <Tooltip title="Próximo (→)">
              <span>
                <IconButton
                  size="small"
                  onClick={onNext}
                  disabled={!hasNext}
                  sx={{
                    color: MUTED,
                    width: { xs: 30, sm: 34 },
                    height: { xs: 30, sm: 34 },
                    border: '1px solid',
                    borderColor: BORDER,
                    borderRadius: 1.5,
                    '&:hover': { bgcolor: 'rgba(255,255,255,.06)' },
                    '&.Mui-disabled': { color: '#333', borderColor: 'rgba(255,255,255,.04)' },
                  }}
                >
                  <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          <Box sx={{ width: '1px', height: 28, bgcolor: BORDER, flexShrink: 0, display: { xs: 'none', sm: 'block' } }} />

          {/* Diff info */}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography noWrap sx={{ fontSize: '0.9rem', fontWeight: 600, color: FG, lineHeight: 1.3 }}>
              {diff.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25, flexWrap: 'wrap' }}>
              {diff.techniques?.map((t) => (
                <TechBadge key={t.technique} label={t.label} percentage={t.diffPercentage} passed={t.passed} />
              ))}
              <StatusBadge status={diff.status} />
            </Box>
          </Box>
        </Box>

        {/* Right: action buttons (hidden when all techniques passed — auto-approved) */}
        {!allPassed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexShrink: 0 }}>
            <Tooltip title="Rejeitar esta tela (R)" arrow>
              <Button
                variant="outlined"
                startIcon={<CloseRoundedIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                onClick={() => onReject(diff.id)}
                sx={{
                  fontSize: { xs: '0.72rem', sm: '0.82rem' },
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: 'rgba(239,68,68,.4)',
                  color: '#ef4444',
                  '&:hover': { bgcolor: 'rgba(239,68,68,.15)', borderColor: '#ef4444' },
                  height: { xs: 32, sm: 38 },
                  px: { xs: 1.25, sm: 2 },
                  borderRadius: 1.5,
                  minWidth: 0,
                  '& .MuiButton-startIcon': { mr: { xs: 0.25, sm: 0.5 } },
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Rejeitar</Box>
              </Button>
            </Tooltip>
            <Tooltip title="Aprovar esta tela (A)" arrow>
              <Button
                variant="contained"
                startIcon={<CheckRoundedIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                onClick={() => onApprove(diff.id)}
                sx={{
                  fontSize: { xs: '0.72rem', sm: '0.82rem' },
                  textTransform: 'none',
                  fontWeight: 600,
                  bgcolor: '#22c55e',
                  color: '#fff',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#16a34a', boxShadow: 'none' },
                  height: { xs: 32, sm: 38 },
                  px: { xs: 1.25, sm: 2.5 },
                  borderRadius: 1.5,
                  minWidth: 0,
                  '& .MuiButton-startIcon': { mr: { xs: 0.25, sm: 0.5 } },
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Aprovar</Box>
              </Button>
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* =============== Row 2: View Mode + Zoom + Controls =============== */}
      {(!allPassed || showImages) && <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          px: { xs: 1.5, sm: 2 },
          py: 0.75,
          borderBottom: '1px solid',
          borderColor: BORDER,
          bgcolor: 'rgba(255,255,255,.02)',
          flexWrap: 'wrap',
          flexShrink: 0,
        }}
      >
        {/* View mode tabs */}
        <Tabs
          value={viewMode}
          onChange={(_, v) => setViewMode(v)}
          sx={{
            minHeight: 34,
            bgcolor: 'rgba(255,255,255,.04)',
            borderRadius: 1.5,
            p: 0.35,
            '& .MuiTabs-indicator': { display: 'none' },
            '& .MuiTab-root': {
              minHeight: 28,
              minWidth: { xs: 38, sm: 'auto' },
              py: 0,
              px: { xs: 1, sm: 1.5 },
              fontSize: '0.72rem',
              textTransform: 'none',
              color: '#71717a',
              borderRadius: 1,
              '&.Mui-selected': { color: FG, bgcolor: 'rgba(255,255,255,.08)' },
            },
          }}
        >
          <Tab
            icon={<ViewColumnRoundedIcon sx={{ fontSize: 15 }} />}
            iconPosition="start"
            label={<Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, ml: 0.5 }}>Lado a Lado</Box>}
          />
          <Tab
            icon={<LayersRoundedIcon sx={{ fontSize: 15 }} />}
            iconPosition="start"
            label={<Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, ml: 0.5 }}>Sobreposição</Box>}
          />
          <Tab
            icon={<ViewCarouselRoundedIcon sx={{ fontSize: 15 }} />}
            iconPosition="start"
            label={<Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, ml: 0.5 }}>Slider</Box>}
          />
        </Tabs>

        {/* Right: controls cluster */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          {/* Technique selector */}
          <ToggleButtonGroup
                value={selectedTechnique}
                exclusive
                onChange={(_, v) => { if (v !== null) setSelectedTechnique(v); }}
                size="small"
                sx={{
                  height: 28,
                  '& .MuiToggleButton-root': {
                    fontSize: '0.68rem',
                    textTransform: 'none',
                    color: '#71717a',
                    borderColor: BORDER,
                    py: 0,
                    px: 1,
                    '&.Mui-selected': {
                      bgcolor: 'rgba(59,130,246,.12)',
                      color: '#60a5fa',
                      borderColor: 'rgba(59,130,246,.3)',
                      '&:hover': { bgcolor: 'rgba(59,130,246,.18)' },
                    },
                    '&:hover': { bgcolor: 'rgba(255,255,255,.04)' },
                  },
                }}
              >
                {availableTechniques.map((t) => (
                  <ToggleButton key={t.technique} value={t.technique}>{t.label}</ToggleButton>
                ))}
          </ToggleButtonGroup>
          <Box sx={{ width: '1px', height: 16, bgcolor: BORDER }} />

          {/* Overlay opacity (only in overlay mode) */}
          {viewMode === 1 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ color: '#71717a', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>Opacidade:</Typography>
              <Slider
                value={overlayOpacity}
                onChange={(_, v) => setOverlayOpacity(v)}
                min={0}
                max={100}
                size="small"
                sx={{ width: { xs: 80, sm: 120 }, color: '#3b82f6', '& .MuiSlider-thumb': { width: 14, height: 14 } }}
              />
              <Typography sx={{ fontFamily: 'monospace', color: '#71717a', width: 30, fontSize: '0.72rem' }}>
                {overlayOpacity}%
              </Typography>
            </Box>
          )}

          {viewMode === 1 && <Box sx={{ width: '1px', height: 16, bgcolor: BORDER }} />}

          {/* Zoom controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
            <Tooltip title="Diminuir zoom">
              <IconButton
                size="small"
                onClick={() => setZoom((z) => Math.max(25, z - 25))}
                sx={{ color: MUTED, width: 30, height: 30, '&:hover': { bgcolor: 'rgba(255,255,255,.06)' } }}
              >
                <ZoomOutRoundedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <Typography sx={{ fontFamily: 'monospace', color: '#71717a', width: 38, textAlign: 'center', fontSize: '0.75rem' }}>
              {zoom}%
            </Typography>
            <Tooltip title="Aumentar zoom">
              <IconButton
                size="small"
                onClick={() => setZoom((z) => Math.min(200, z + 25))}
                sx={{ color: MUTED, width: 30, height: 30, '&:hover': { bgcolor: 'rgba(255,255,255,.06)' } }}
              >
                <ZoomInRoundedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Resetar zoom">
              <IconButton
                size="small"
                onClick={() => setZoom(100)}
                sx={{ color: MUTED, width: 30, height: 30, '&:hover': { bgcolor: 'rgba(255,255,255,.06)' } }}
              >
                <RestartAltRoundedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Keyboard shortcut hints */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5, ml: 0.5 }}>
            <KbdHint>←</KbdHint>
            <KbdHint>→</KbdHint>
            {!allPassed && <KbdHint>A</KbdHint>}
            {!allPassed && <KbdHint>R</KbdHint>}
          </Box>
        </Box>
      </Box>}

      {/* =============== Image comparison area =============== */}
      <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#09090b', p: { xs: 1, sm: 2 } }}>
        {allPassed && !showImages ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 2.5,
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: 3,
                bgcolor: 'rgba(34,197,94,.08)',
                border: '1px solid rgba(34,197,94,.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircleOutlineRoundedIcon sx={{ fontSize: 36, color: '#22c55e' }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#fafafa', mb: 0.75 }}>
                {allZero ? 'Nenhuma diferença visual detectada' : 'Diferenças dentro do limiar aceitável'}
              </Typography>
              <Typography sx={{ fontSize: '0.82rem', color: '#71717a', maxWidth: 380, lineHeight: 1.6 }}>
                {allZero
                  ? 'A tela atual é idêntica ao baseline. Todas as técnicas de comparação retornaram 0% de diferença.'
                  : 'Foram detectadas pequenas diferenças, mas todas estão dentro dos limiares configurados. Nenhuma ação é necessária.'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
              {availableTechniques.map((t) => (
                <Chip
                  key={t.technique}
                  label={`${t.label} ${t.diffPercentage}%`}
                  size="small"
                  sx={{
                    fontSize: '0.72rem',
                    fontFamily: 'monospace',
                    bgcolor: 'rgba(34,197,94,.1)',
                    color: '#4ade80',
                    border: '1px solid rgba(34,197,94,.2)',
                    height: 26,
                  }}
                />
              ))}
            </Box>
            <Button
              variant="outlined"
              startIcon={<VisibilityRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={() => setShowImages(true)}
              sx={{
                mt: 2,
                fontSize: '0.78rem',
                textTransform: 'none',
                fontWeight: 500,
                borderColor: 'rgba(255,255,255,.15)',
                color: '#a1a1aa',
                '&:hover': { bgcolor: 'rgba(255,255,255,.06)', borderColor: 'rgba(255,255,255,.25)' },
                height: 36,
                px: 2.5,
                borderRadius: 1.5,
              }}
            >
              Ver imagens mesmo assim
            </Button>
            <Typography sx={{ fontSize: '0.72rem', color: DIM, mt: 1 }}>
              Aprovado automaticamente — use as setas para navegar.
            </Typography>
          </Box>
        ) : (
          <>
            {viewMode === 0 && <SideBySideView diff={diff} zoom={zoom} diffUrl={diffUrl} techniqueLabel={activeTech?.label || 'Pixel'} />}
            {viewMode === 1 && <OverlayView diff={diff} zoom={zoom} opacity={overlayOpacity} diffUrl={diffUrl} />}
            {viewMode === 2 && (
              <SliderView
                diff={diff}
                zoom={zoom}
                sliderPosition={sliderPosition}
                sliderRef={sliderRef}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
              />
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
