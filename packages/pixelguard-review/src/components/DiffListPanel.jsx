import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import MonitorRoundedIcon from '@mui/icons-material/MonitorRounded';
import SmartphoneRoundedIcon from '@mui/icons-material/SmartphoneRounded';
import TabletRoundedIcon from '@mui/icons-material/TabletRounded';
import DevicesRoundedIcon from '@mui/icons-material/DevicesRounded';

import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';

/* ---- Shared dark-theme border color ---- */
const BORDER = 'hsl(240 3.7% 15.9%)';

function StatusIcon({ status }) {
  if (status === 'approved') {
    return (
      <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: 'rgba(34,197,94,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CheckRoundedIcon sx={{ fontSize: 12, color: '#22c55e' }} />
      </Box>
    );
  }
  if (status === 'rejected') {
    return (
      <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: 'rgba(239,68,68,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CloseRoundedIcon sx={{ fontSize: 12, color: '#ef4444' }} />
      </Box>
    );
  }
  return (
    <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: 'rgba(234,179,8,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <AccessTimeRoundedIcon sx={{ fontSize: 12, color: '#eab308' }} />
    </Box>
  );
}

function TechBadge({ label, percentage, passed }) {
  const color = passed ? '#22c55e' : percentage > 15 ? '#ef4444' : percentage > 5 ? '#eab308' : '#f97316';
  return (
    <Chip
      label={`${label} ${percentage.toFixed(1)}%`}
      size="small"
      variant="outlined"
      sx={{
        height: 16,
        fontSize: '0.55rem',
        fontWeight: 500,
        borderColor: BORDER,
        color,
        '& .MuiChip-label': { px: 0.5 },
      }}
    />
  );
}

function getDeviceLabel(viewport) {
  if (!viewport) return 'Desktop';
  if (viewport.startsWith('360') || viewport.startsWith('375') || viewport.startsWith('390'))
    return 'Mobile';
  if (viewport.startsWith('768') || viewport.startsWith('810') || viewport.startsWith('820'))
    return 'Tablet';
  return 'Desktop';
}

function DiffListItem({ diff, isSelected, onSelect }) {
  const device = getDeviceLabel(diff.viewport);

  return (
    <Box
      component="button"
      onClick={() => onSelect(diff.id)}
      sx={{
        width: '100%',
        textAlign: 'left',
        px: 2,
        py: 1.5,
        borderBottom: '1px solid',
        borderLeft: '2px solid',
        borderColor: BORDER,
        borderLeftColor: isSelected ? '#3b82f6' : 'transparent',
        bgcolor: isSelected ? 'rgba(59,130,246,.05)' : 'transparent',
        cursor: 'pointer',
        transition: 'all 0.12s',
        '&:hover': { bgcolor: isSelected ? 'rgba(59,130,246,.05)' : 'rgba(255,255,255,.03)' },
        display: 'block',
        outline: 'none',
        fontFamily: 'inherit',
        color: 'inherit',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
        <Typography
          sx={{
            fontSize: '0.82rem',
            fontWeight: 500,
            color: '#fafafa',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {diff.name}
        </Typography>
        <StatusIcon status={diff.status} />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#a1a1aa', mb: 0.5 }}>
        {device === 'Mobile' ? (
          <SmartphoneRoundedIcon sx={{ fontSize: 12 }} />
        ) : device === 'Tablet' ? (
          <TabletRoundedIcon sx={{ fontSize: 12 }} />
        ) : (
          <MonitorRoundedIcon sx={{ fontSize: 12 }} />
        )}
        <Typography sx={{ fontSize: '0.7rem' }}>{device}</Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
        {diff.techniques.map((t) => (
          <TechBadge key={t.technique} label={t.label} percentage={t.diffPercentage} passed={t.passed} />
        ))}
      </Box>
    </Box>
  );
}

export default function DiffListPanel({
  diffs,
  selectedDiffId,
  onSelectDiff,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  viewportFilter,
  onViewportFilterChange,
  onApproveAll,
  onRejectAll,
  onCollapse,
}) {
  const pendingCount = diffs.filter((d) => d.status === 'pending').length;

  return (
    <Box
      component="aside"
      sx={{
        width: '100%',
        height: '100%',
        borderRight: '1px solid',
        borderColor: BORDER,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'rgba(9,9,11,.5)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: BORDER, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Telas ({diffs.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          {pendingCount > 0 && (
            <>
              <Tooltip title="Aprovar todas pendentes">
                <IconButton size="small" onClick={onApproveAll} sx={{ color: '#22c55e', width: 24, height: 24, '&:hover': { bgcolor: 'rgba(34,197,94,.1)' } }}>
                  <CheckRoundedIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Rejeitar todas pendentes">
                <IconButton size="small" onClick={onRejectAll} sx={{ color: '#ef4444', width: 24, height: 24, '&:hover': { bgcolor: 'rgba(239,68,68,.1)' } }}>
                  <CloseRoundedIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </>
          )}
          {onCollapse && (
            <Tooltip title="Recolher painel">
              <IconButton size="small" onClick={onCollapse} sx={{ color: '#71717a', width: 22, height: 22, '&:hover': { bgcolor: 'rgba(255,255,255,.06)' } }}>
                <ChevronLeftRoundedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Filter bar — search + status */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.25, borderBottom: '1px solid', borderColor: BORDER }}>
        <Box sx={{ position: 'relative', flex: 1 }}>
          <SearchRoundedIcon sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#a1a1aa', pointerEvents: 'none' }} />
          <TextField
            size="small"
            placeholder="Buscar telas..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              sx: {
                fontSize: '0.75rem',
                pl: 3.5,
                bgcolor: 'rgba(255,255,255,.04)',
                color: '#fafafa',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'hsl(240 3.7% 22%)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
                height: 32,
              },
            }}
            fullWidth
          />
        </Box>
        <Select
          size="small"
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          renderValue={(v) => (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <FilterListRoundedIcon sx={{ fontSize: 12 }} />
              <span>{v === 'all' ? 'Todos' : v === 'pending' ? 'Pendentes' : v === 'approved' ? 'Aprovados' : 'Rejeitados'}</span>
            </Box>
          )}
          sx={{
            fontSize: '0.72rem',
            color: '#a1a1aa',
            height: 32,
            minWidth: 110,
            bgcolor: 'rgba(255,255,255,.04)',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'hsl(240 3.7% 22%)' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
            '& .MuiSelect-icon': { color: '#71717a' },
          }}
        >
          <MenuItem value="all" sx={{ fontSize: '0.75rem' }}>Todos</MenuItem>
          <MenuItem value="pending" sx={{ fontSize: '0.75rem' }}>Pendentes</MenuItem>
          <MenuItem value="approved" sx={{ fontSize: '0.75rem' }}>Aprovados</MenuItem>
          <MenuItem value="rejected" sx={{ fontSize: '0.75rem' }}>Rejeitados</MenuItem>
        </Select>
      </Box>

      {/* Viewport / Device filter */}
      <Box sx={{ px: 2, py: 1.25, borderBottom: '1px solid', borderColor: BORDER }}>
        <ToggleButtonGroup
          value={viewportFilter}
          exclusive
          onChange={(_, v) => { if (v !== null) onViewportFilterChange(v); }}
          size="small"
          fullWidth
          sx={{
            height: 30,
            '& .MuiToggleButton-root': {
              fontSize: '0.65rem',
              textTransform: 'none',
              color: '#a1a1aa',
              borderColor: BORDER,
              py: 0,
              gap: 0.5,
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
          <ToggleButton value="all"><DevicesRoundedIcon sx={{ fontSize: 13 }} />Todos</ToggleButton>
          <ToggleButton value="desktop"><MonitorRoundedIcon sx={{ fontSize: 13 }} />Desktop</ToggleButton>
          <ToggleButton value="mobile"><SmartphoneRoundedIcon sx={{ fontSize: 13 }} />Mobile</ToggleButton>
          <ToggleButton value="tablet"><TabletRoundedIcon sx={{ fontSize: 13 }} />Tablet</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Diff list */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {diffs.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.75rem', color: '#71717a' }}>
              Nenhuma tela encontrada.
            </Typography>
          </Box>
        ) : (
          diffs.map((diff) => (
            <DiffListItem
              key={diff.id}
              diff={diff}
              isSelected={diff.id === selectedDiffId}
              onSelect={onSelectDiff}
            />
          ))
        )}
      </Box>
    </Box>
  );
}

export { getDeviceLabel };
