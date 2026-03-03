import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import ListRoundedIcon from '@mui/icons-material/ListRounded';
import { useNavigate } from 'react-router-dom';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';

export default function ReviewHeader({
  totalPending,
  totalApproved,
  totalRejected,
  onReset,
  onToggleRuns,
  onToggleDiffs,
  showRunsToggle,
  showDiffsToggle,
  commitSha,
  branch,
  prNumber,
  repoUrl,
}) {
  const navigate = useNavigate();

  return (
    <Box
      component="header"
      sx={{
        borderBottom: '1px solid',
        borderColor: 'hsl(240 3.7% 15.9%)',
        bgcolor: 'hsl(240 10% 3.9%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 1.5, sm: 3 },
        py: 1.5,
        gap: 1,
        minHeight: 56,
        flexShrink: 0,
      }}
    >
      {/* Left — logo + drawer toggles */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title="Voltar ao Dashboard">
          <IconButton
            size="small"
            onClick={() => navigate('/')}
            sx={{ color: '#a1a1aa', '&:hover': { bgcolor: 'rgba(255,255,255,.06)' } }}
          >
            <ArrowBackRoundedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>

        {/* Drawer toggle — Test Runs */}
        {showRunsToggle && (
          <Tooltip title="Test Runs">
            <IconButton
              size="small"
              onClick={onToggleRuns}
              sx={{ color: '#a1a1aa', '&:hover': { bgcolor: 'rgba(255,255,255,.06)' } }}
            >
              <MenuRoundedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        )}

        {/* Drawer toggle — Diff List */}
        {showDiffsToggle && (
          <Tooltip title="Lista de Diffs">
            <IconButton
              size="small"
              onClick={onToggleDiffs}
              sx={{ color: '#a1a1aa', '&:hover': { bgcolor: 'rgba(255,255,255,.06)' } }}
            >
              <ListRoundedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <VisibilityRoundedIcon sx={{ fontSize: 22, color: '#3b82f6' }} />
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: { xs: '0.95rem', sm: '1.05rem' },
              color: '#fafafa',
              letterSpacing: '-0.01em',
            }}
          >
            PixelGuard
          </Typography>
        </Box>

        <Typography
          variant="body2"
          sx={{ color: '#71717a', ml: 0.5, display: { xs: 'none', md: 'block' } }}
        >
          Teste de Regressão Visual
        </Typography>
      </Box>

      {/* Right — status badges + reset */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Chip
            label={`${totalPending} pendentes`}
            size="small"
            variant="outlined"
            sx={{
              height: 24,
              fontSize: '0.72rem',
              fontWeight: 500,
              borderColor: 'rgba(234,179,8,.4)',
              bgcolor: 'rgba(234,179,8,.1)',
              color: '#eab308',
              '& .MuiChip-label': { px: 1 },
            }}
          />
          <Chip
            label={`${totalApproved} aprovados`}
            size="small"
            variant="outlined"
            sx={{
              height: 24,
              fontSize: '0.72rem',
              fontWeight: 500,
              borderColor: 'rgba(34,197,94,.4)',
              bgcolor: 'rgba(34,197,94,.1)',
              color: '#22c55e',
              '& .MuiChip-label': { px: 1 },
              display: { xs: 'none', sm: 'flex' },
            }}
          />
          <Chip
            label={`${totalRejected} rejeitados`}
            size="small"
            variant="outlined"
            sx={{
              height: 24,
              fontSize: '0.72rem',
              fontWeight: 500,
              borderColor: 'rgba(239,68,68,.4)',
              bgcolor: 'rgba(239,68,68,.1)',
              color: '#ef4444',
              '& .MuiChip-label': { px: 1 },
              display: { xs: 'none', sm: 'flex' },
            }}
          />
        </Box>

        <Box
          sx={{
            display: { xs: 'none', lg: 'flex' },
            alignItems: 'center',
            gap: 0.75,
            color: '#71717a',
            fontSize: '0.72rem',
            fontFamily: 'monospace',
          }}
        >
          <AccountTreeRoundedIcon sx={{ fontSize: 14 }} />
          {branch && (
            <Chip
              label={branch}
              size="small"
              variant="outlined"
              sx={{
                height: 20,
                fontSize: '0.68rem',
                fontWeight: 500,
                fontFamily: 'monospace',
                borderColor: 'rgba(139,92,246,.4)',
                bgcolor: 'rgba(139,92,246,.08)',
                color: '#a78bfa',
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
          )}
          {commitSha && (
            <Chip
              label={commitSha}
              size="small"
              variant="outlined"
              component={repoUrl ? 'a' : 'span'}
              href={repoUrl ? `${repoUrl}/commit/${commitSha}` : undefined}
              target="_blank"
              rel="noopener noreferrer"
              clickable={!!repoUrl}
              sx={{
                height: 20,
                fontSize: '0.68rem',
                fontWeight: 500,
                fontFamily: 'monospace',
                borderColor: 'rgba(59,130,246,.4)',
                bgcolor: 'rgba(59,130,246,.08)',
                color: '#60a5fa',
                '& .MuiChip-label': { px: 0.75 },
                textDecoration: 'none',
              }}
            />
          )}
          {prNumber && (
            <Chip
              label={`PR #${prNumber}`}
              size="small"
              variant="outlined"
              component={repoUrl ? 'a' : 'span'}
              href={repoUrl ? `${repoUrl}/pull/${prNumber}` : undefined}
              target="_blank"
              rel="noopener noreferrer"
              clickable={!!repoUrl}
              sx={{
                height: 20,
                fontSize: '0.68rem',
                fontWeight: 500,
                fontFamily: 'monospace',
                borderColor: 'rgba(34,197,94,.4)',
                bgcolor: 'rgba(34,197,94,.08)',
                color: '#4ade80',
                '& .MuiChip-label': { px: 0.75 },
                textDecoration: 'none',
              }}
            />
          )}
          {!branch && !commitSha && <span>Execução local</span>}
        </Box>

        <Tooltip title="Resetar todas as revisões">
          <IconButton
            size="small"
            onClick={onReset}
            sx={{
              color: '#71717a',
              '&:hover': { bgcolor: 'rgba(239,68,68,.1)', color: '#ef4444' },
            }}
          >
            <RestartAltRoundedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
