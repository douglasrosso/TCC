/**
 * Shared constants and reusable UI primitives for the PixelGuard review UI.
 * Import these instead of duplicating color logic and badge components.
 */
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';

/* ================================================================
   Design tokens — derived per color-scheme mode
   ================================================================ */
export function getReviewColors(mode) {
  const dark = mode !== 'light';
  return {
    mode,
    BORDER: dark ? 'hsl(240 3.7% 15.9%)' : 'hsl(240 5.9% 80%)',
    CARD: dark ? 'hsl(240 10% 3.9%)' : '#ffffff',
    BG: dark ? '#09090b' : '#f4f4f5',
    FG: dark ? '#fafafa' : '#18181b',
    MUTED: dark ? '#a1a1aa' : '#52525b',
    SUBTLE: dark ? '#71717a' : '#71717a',
    DIM: dark ? '#52525b' : '#71717a',
    PANEL_BG: dark ? 'rgba(9,9,11,.5)' : 'rgba(244,244,245,.7)',
    IMG_BG: dark ? '#09090b' : '#e4e4e7',
    HOVER_WEAK: dark ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.03)',
    HOVER: dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)',
    SURFACE_1: dark ? 'rgba(255,255,255,.02)' : 'rgba(0,0,0,.02)',
    SURFACE_2: dark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.035)',
    SURFACE_3: dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)',
  };
}

/**
 * Resolve the current MUI color-scheme mode into the review-UI palette.
 * Use this hook instead of importing static color constants.
 */
export function useReviewColors() {
  const theme = useTheme();
  return getReviewColors(theme.palette.mode);
}

/* ================================================================
   Status color map — used by badges, icons, banners
   Text colors are darkened in light mode so they keep AA contrast
   against the pale tinted backgrounds (the dark-mode 500-shades read
   fine on near-black cards, but fail contrast on near-white ones).
   ================================================================ */
export function getStatusMap(mode) {
  const dark = mode !== 'light';
  return {
    approved: { label: 'Aprovado', color: dark ? '#22c55e' : '#15803d', border: dark ? 'rgba(34,197,94,.4)' : 'rgba(21,128,61,.5)', bg: dark ? 'rgba(34,197,94,.1)' : 'rgba(34,197,94,.14)' },
    rejected: { label: 'Rejeitado', color: dark ? '#ef4444' : '#b91c1c', border: dark ? 'rgba(239,68,68,.4)' : 'rgba(185,28,28,.5)', bg: dark ? 'rgba(239,68,68,.1)' : 'rgba(239,68,68,.14)' },
    pending:  { label: 'Pendente',  color: dark ? '#eab308' : '#92400e', border: dark ? 'rgba(234,179,8,.4)' : 'rgba(146,64,14,.5)', bg: dark ? 'rgba(234,179,8,.1)' : 'rgba(234,179,8,.16)' },
  };
}

export function useStatusMap() {
  const theme = useTheme();
  return getStatusMap(theme.palette.mode);
}

/**
 * Resolve diff-percentage severity to a color set.
 * Used by TechBadge and TechPercentageBadge.
 */
export function techColor(percentage, passed, mode = 'dark') {
  const dark = mode !== 'light';
  if (passed) return { color: dark ? '#22c55e' : '#15803d', border: dark ? 'rgba(34,197,94,.4)' : 'rgba(21,128,61,.5)', bg: dark ? 'rgba(34,197,94,.1)' : 'rgba(34,197,94,.14)' };
  if (percentage > 15) return { color: dark ? '#ef4444' : '#b91c1c', border: dark ? 'rgba(239,68,68,.4)' : 'rgba(185,28,28,.5)', bg: dark ? 'rgba(239,68,68,.1)' : 'rgba(239,68,68,.14)' };
  if (percentage > 5)  return { color: dark ? '#eab308' : '#92400e', border: dark ? 'rgba(234,179,8,.4)' : 'rgba(146,64,14,.5)', bg: dark ? 'rgba(234,179,8,.1)' : 'rgba(234,179,8,.16)' };
  return { color: dark ? '#f97316' : '#9a3412', border: dark ? 'rgba(249,115,22,.4)' : 'rgba(154,52,18,.5)', bg: dark ? 'rgba(249,115,22,.1)' : 'rgba(249,115,22,.16)' };
}

/**
 * Mode-aware accent colors for chips/badges that carry meaning via blue/purple/green text
 * (branch, commit, PR links; selected technique). Dark-mode 400-shades are bright enough
 * against near-black cards; light mode needs the 700-shade for AA text contrast on white.
 */
export function getAccent(mode) {
  const dark = mode !== 'light';
  return {
    blueText: dark ? '#60a5fa' : '#1d4ed8',
    blueBorder: dark ? 'rgba(59,130,246,.4)' : 'rgba(29,78,216,.5)',
    blueBg: dark ? 'rgba(59,130,246,.08)' : 'rgba(59,130,246,.12)',
    blueSolid: dark ? '#3b82f6' : '#2563eb',
    purpleText: dark ? '#a78bfa' : '#6d28d9',
    purpleBorder: dark ? 'rgba(139,92,246,.4)' : 'rgba(109,40,217,.5)',
    purpleBg: dark ? 'rgba(139,92,246,.08)' : 'rgba(139,92,246,.12)',
    greenText: dark ? '#4ade80' : '#15803d',
    greenBorder: dark ? 'rgba(34,197,94,.4)' : 'rgba(21,128,61,.5)',
    greenBg: dark ? 'rgba(34,197,94,.08)' : 'rgba(34,197,94,.12)',
  };
}

export function useAccent() {
  const theme = useTheme();
  return getAccent(theme.palette.mode);
}

/* ================================================================
   Reusable components
   ================================================================ */

/**
 * Status icon circle (20×20) — used in diff list items.
 */
export function StatusIcon({ status }) {
  const statusMap = useStatusMap();
  const s = statusMap[status] || statusMap.pending;
  const Icon = status === 'approved' ? CheckRoundedIcon
    : status === 'rejected' ? CloseRoundedIcon
    : AccessTimeRoundedIcon;
  return (
    <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon sx={{ fontSize: 12, color: s.color }} />
    </Box>
  );
}

/**
 * Status chip badge — used in diff viewer header.
 * @param {'approved'|'rejected'|'pending'} status
 */
export function StatusBadge({ status }) {
  const statusMap = useStatusMap();
  const s = statusMap[status] || statusMap.pending;
  return (
    <Chip
      label={s.label}
      size="small"
      variant="outlined"
      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 500, borderColor: s.border, bgcolor: s.bg, color: s.color, '& .MuiChip-label': { px: 0.75 } }}
    />
  );
}

/**
 * Technique percentage badge — configurable size.
 * `size="sm"` → compact list style (h16, 0.55rem)
 * `size="md"` (default) → viewer header style (h20, 0.65rem)
 */
export function TechBadge({ label, percentage, passed, executionMs = null, size = 'md' }) {
  const { BORDER, mode } = useReviewColors();
  const c = techColor(percentage, passed, mode);
  const compact = size === 'sm';
  const timeStr = executionMs != null ? ` · ${executionMs}ms` : '';
  return (
    <Chip
      label={`${label} ${percentage.toFixed(1)}%${timeStr}`}
      size="small"
      variant="outlined"
      sx={{
        height: compact ? 16 : 20,
        fontSize: compact ? '0.55rem' : '0.65rem',
        fontWeight: 500,
        borderColor: compact ? BORDER : c.border,
        bgcolor: compact ? 'transparent' : c.bg,
        color: c.color,
        '& .MuiChip-label': { px: compact ? 0.5 : 0.75 },
      }}
    />
  );
}

/**
 * Keyboard shortcut hint badge.
 */
export function KbdHint({ children }) {
  const c = useReviewColors();
  return (
    <Box
      component="kbd"
      sx={{
        px: 0.5,
        py: 0.15,
        borderRadius: 0.5,
        bgcolor: c.SURFACE_2,
        border: '1px solid',
        borderColor: c.BORDER,
        fontFamily: 'monospace',
        fontSize: '0.58rem',
        color: c.DIM,
        minWidth: 18,
        textAlign: 'center',
        lineHeight: 1.6,
        display: 'inline-block',
      }}
    >
      {children}
    </Box>
  );
}

/**
 * Collapse panel button used in TestRunPanel and DiffListPanel headers.
 */
export function CollapseButton({ onClick, tooltip = 'Recolher painel' }) {
  const c = useReviewColors();
  return (
    <Tooltip title={tooltip}>
      <IconButton size="small" onClick={onClick} sx={{ color: c.SUBTLE, width: 22, height: 22, '&:hover': { bgcolor: c.HOVER } }}>
        <ChevronLeftRoundedIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Tooltip>
  );
}

/**
 * Section header label (uppercase, small caps tracking).
 */
export function PanelHeaderLabel({ children }) {
  const c = useReviewColors();
  return (
    <Box component="span" sx={{ fontSize: '0.72rem', fontWeight: 600, color: c.MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {children}
    </Box>
  );
}
