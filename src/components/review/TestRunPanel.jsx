import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import CommitRoundedIcon from '@mui/icons-material/CommitRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';

function getTimeAgo(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d atrás`;
  if (hours > 0) return `${hours}h atrás`;
  if (minutes > 0) return `${minutes}min atrás`;
  return 'agora';
}

function TestRunCard({ run, isSelected, onSelect }) {
  const pendingCount = run.diffs.filter((d) => d.status === 'pending').length;
  const reviewedCount = run.diffs.filter((d) => d.status !== 'pending').length;
  const progressValue = (reviewedCount / Math.max(run.diffs.length, 1)) * 100;

  return (
    <Box
      component="button"
      onClick={() => onSelect(run.id)}
      sx={{
        width: '100%',
        textAlign: 'left',
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: isSelected ? 'rgba(59,130,246,.5)' : 'hsl(240 3.7% 15.9%)',
        bgcolor: isSelected ? 'rgba(59,130,246,.05)' : 'hsl(240 10% 3.9%)',
        cursor: 'pointer',
        transition: 'all 0.15s',
        '&:hover': {
          borderColor: isSelected ? 'rgba(59,130,246,.5)' : 'hsl(240 3.7% 15.9%)',
          bgcolor: isSelected ? 'rgba(59,130,246,.05)' : 'rgba(255,255,255,.03)',
        },
        display: 'block',
        outline: 'none',
        fontFamily: 'inherit',
        color: 'inherit',
      }}
    >
      {/* Branch + pending badge */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5, mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <AccountTreeRoundedIcon sx={{ fontSize: 16, color: '#3b82f6', flexShrink: 0 }} />
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#fafafa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {run.branch}
          </Typography>
        </Box>
        {pendingCount > 0 && (
          <Chip
            label={`${pendingCount} pendente${pendingCount > 1 ? 's' : ''}`}
            size="small"
            variant="outlined"
            sx={{
              height: 20,
              fontSize: '0.68rem',
              fontWeight: 500,
              borderColor: 'rgba(234,179,8,.4)',
              bgcolor: 'rgba(234,179,8,.1)',
              color: '#eab308',
              flexShrink: 0,
              '& .MuiChip-label': { px: 0.75 },
            }}
          />
        )}
      </Box>

      {/* Meta info */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#a1a1aa' }}>
          <CommitRoundedIcon sx={{ fontSize: 12 }} />
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{run.commit}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#a1a1aa' }}>
          <PersonRoundedIcon sx={{ fontSize: 12 }} />
          <Typography sx={{ fontSize: '0.72rem' }}>{run.author}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#a1a1aa' }}>
          <AccessTimeRoundedIcon sx={{ fontSize: 12 }} />
          <Typography sx={{ fontSize: '0.72rem' }}>{getTimeAgo(run.timestamp)}</Typography>
        </Box>
      </Box>

      {/* Progress bar */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
          <Typography sx={{ fontSize: '0.72rem', color: '#a1a1aa' }}>
            {reviewedCount} de {run.diffs.length} telas revisadas
          </Typography>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#fafafa' }}>
            {Math.round(progressValue)}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progressValue}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: 'rgba(255,255,255,.08)',
            '& .MuiLinearProgress-bar': {
              bgcolor: progressValue === 100 ? '#22c55e' : '#3b82f6',
              borderRadius: 3,
            },
          }}
        />
      </Box>
    </Box>
  );
}

export default function TestRunPanel({ testRuns, selectedRunId, onSelectRun, onCollapse }) {
  return (
    <Box
      component="aside"
      sx={{
        width: '100%',
        height: '100%',
        borderRight: '1px solid',
        borderColor: 'hsl(240 3.7% 15.9%)',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'hsl(240 10% 3.9%)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'hsl(240 3.7% 15.9%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Test Runs
        </Typography>
        {onCollapse && (
          <Tooltip title="Recolher painel">
            <IconButton size="small" onClick={onCollapse} sx={{ color: '#71717a', width: 22, height: 22, '&:hover': { bgcolor: 'rgba(255,255,255,.06)' } }}>
              <ChevronLeftRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Run list */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {testRuns.map((run) => (
          <TestRunCard
            key={run.id}
            run={run}
            isSelected={run.id === selectedRunId}
            onSelect={onSelectRun}
          />
        ))}
      </Box>
    </Box>
  );
}
