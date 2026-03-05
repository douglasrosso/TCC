/**
 * Shared constants and reusable UI primitives for the PixelGuard review UI.
 * Import these instead of duplicating color logic and badge components.
 */
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';

/* ================================================================
   Design tokens — single source of truth
   ================================================================ */
export const BORDER = 'hsl(240 3.7% 15.9%)';
export const CARD   = 'hsl(240 10% 3.9%)';
export const BG     = '#09090b';
export const FG     = '#fafafa';
export const MUTED  = '#a1a1aa';
export const SUBTLE = '#71717a';
export const DIM    = '#52525b';

/* ================================================================
   Status color map — used by badges, icons, banners
   ================================================================ */
export const STATUS_MAP = {
  approved: { label: 'Aprovado', color: '#22c55e', border: 'rgba(34,197,94,.4)',  bg: 'rgba(34,197,94,.1)' },
  rejected: { label: 'Rejeitado', color: '#ef4444', border: 'rgba(239,68,68,.4)',  bg: 'rgba(239,68,68,.1)' },
  pending:  { label: 'Pendente',  color: '#eab308', border: 'rgba(234,179,8,.4)',  bg: 'rgba(234,179,8,.1)' },
};

/**
 * Resolve diff-percentage severity to a color set.
 * Used by TechBadge and TechPercentageBadge.
 */
export function techColor(percentage, passed) {
  if (passed) return { color: '#22c55e', border: 'rgba(34,197,94,.4)',  bg: 'rgba(34,197,94,.1)' };
  if (percentage > 15) return { color: '#ef4444', border: 'rgba(239,68,68,.4)', bg: 'rgba(239,68,68,.1)' };
  if (percentage > 5)  return { color: '#eab308', border: 'rgba(234,179,8,.4)', bg: 'rgba(234,179,8,.1)' };
  return { color: '#f97316', border: 'rgba(249,115,22,.4)', bg: 'rgba(249,115,22,.1)' };
}

/* ================================================================
   Reusable components
   ================================================================ */

/**
 * Status icon circle (20×20) — used in diff list items.
 */
export function StatusIcon({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.pending;
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
  const s = STATUS_MAP[status] || STATUS_MAP.pending;
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
export function TechBadge({ label, percentage, passed, size = 'md' }) {
  const c = techColor(percentage, passed);
  const compact = size === 'sm';
  return (
    <Chip
      label={`${label} ${percentage.toFixed(1)}%`}
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
  return (
    <Box
      component="kbd"
      sx={{
        px: 0.5,
        py: 0.15,
        borderRadius: 0.5,
        bgcolor: 'rgba(255,255,255,.04)',
        border: '1px solid',
        borderColor: BORDER,
        fontFamily: 'monospace',
        fontSize: '0.58rem',
        color: DIM,
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
  return (
    <Tooltip title={tooltip}>
      <IconButton size="small" onClick={onClick} sx={{ color: SUBTLE, width: 22, height: 22, '&:hover': { bgcolor: 'rgba(255,255,255,.06)' } }}>
        <ChevronLeftRoundedIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Tooltip>
  );
}

/**
 * Section header label (uppercase, small caps tracking).
 */
export function PanelHeaderLabel({ children }) {
  return (
    <Box component="span" sx={{ fontSize: '0.72rem', fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {children}
    </Box>
  );
}
