import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { BORDER, CARD, FG, MUTED, SUBTLE, STATUS_MAP } from './shared.jsx';

export default function ReviewHeader({
  totalPending,
  totalApproved,
  totalRejected,
  onReset,
  onToggleMenu,
  showMenuToggle,
  commitSha,
  branch,
  prNumber,
  repoUrl,
  onBack,
}) {
  return (
    <Box
      component="header"
      sx={{
        borderBottom: '1px solid',
        borderColor: BORDER,
        bgcolor: CARD,
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
        {onBack && (
          <Tooltip title="Voltar">
            <IconButton
              size="small"
              onClick={onBack}
              sx={{ color: MUTED, '&:hover': { bgcolor: 'rgba(255,255,255,.06)' } }}
            >
              <ArrowBackRoundedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        )}

        {showMenuToggle && (
          <Tooltip title="Painéis">
            <IconButton
              size="small"
              onClick={onToggleMenu}
              sx={{ color: MUTED, '&:hover': { bgcolor: 'rgba(255,255,255,.06)' } }}
            >
              <MenuRoundedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <VisibilityRoundedIcon sx={{ fontSize: 22, color: '#3b82f6' }} />
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: { xs: '0.95rem', sm: '1.05rem' },
              color: FG,
              letterSpacing: '-0.01em',
            }}
          >
            PixelGuard
          </Typography>
        </Box>

        <Typography
          variant="body2"
          sx={{ color: SUBTLE, ml: 0.5, display: { xs: 'none', md: 'block' } }}
        >
          Teste de Regressão Visual
        </Typography>
      </Box>

      {/* Right — status badges + reset */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
        <Chip
          label={`${totalPending}P / ${totalApproved}A / ${totalRejected}R`}
          size="small"
          variant="outlined"
          sx={{
            height: 24,
            fontSize: '0.68rem',
            fontWeight: 500,
            borderColor: totalPending > 0 ? STATUS_MAP.pending.border : STATUS_MAP.approved.border,
            bgcolor: totalPending > 0 ? STATUS_MAP.pending.bg : STATUS_MAP.approved.bg,
            color: totalPending > 0 ? STATUS_MAP.pending.color : STATUS_MAP.approved.color,
            '& .MuiChip-label': { px: 1 },
            display: { xs: 'flex', sm: 'none' },
          }}
        />
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.5 }}>
          <Chip
            label={`${totalPending} pendentes`}
            size="small"
            variant="outlined"
            sx={{
              height: 24, fontSize: '0.72rem', fontWeight: 500,
              borderColor: STATUS_MAP.pending.border, bgcolor: STATUS_MAP.pending.bg, color: STATUS_MAP.pending.color,
              '& .MuiChip-label': { px: 1 },
            }}
          />
          <Chip
            label={`${totalApproved} aprovados`}
            size="small"
            variant="outlined"
            sx={{
              height: 24, fontSize: '0.72rem', fontWeight: 500,
              borderColor: STATUS_MAP.approved.border, bgcolor: STATUS_MAP.approved.bg, color: STATUS_MAP.approved.color,
              '& .MuiChip-label': { px: 1 },
            }}
          />
          <Chip
            label={`${totalRejected} rejeitados`}
            size="small"
            variant="outlined"
            sx={{
              height: 24, fontSize: '0.72rem', fontWeight: 500,
              borderColor: STATUS_MAP.rejected.border, bgcolor: STATUS_MAP.rejected.bg, color: STATUS_MAP.rejected.color,
              '& .MuiChip-label': { px: 1 },
            }}
          />
        </Box>

        <Box
          sx={{
            display: { xs: 'none', lg: 'flex' },
            alignItems: 'center', gap: 0.75, color: SUBTLE,
            fontSize: '0.72rem', fontFamily: 'monospace',
          }}
        >
          <AccountTreeRoundedIcon sx={{ fontSize: 14 }} />
          {branch && (
            <Chip label={branch} size="small" variant="outlined"
              sx={{ height: 20, fontSize: '0.68rem', fontWeight: 500, fontFamily: 'monospace',
                borderColor: 'rgba(139,92,246,.4)', bgcolor: 'rgba(139,92,246,.08)', color: '#a78bfa',
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
          )}
          {commitSha && (
            <Chip label={commitSha} size="small" variant="outlined"
              component={repoUrl ? 'a' : 'span'}
              href={repoUrl ? `${repoUrl}/commit/${commitSha}` : undefined}
              target="_blank" rel="noopener noreferrer" clickable={!!repoUrl}
              sx={{ height: 20, fontSize: '0.68rem', fontWeight: 500, fontFamily: 'monospace',
                borderColor: 'rgba(59,130,246,.4)', bgcolor: 'rgba(59,130,246,.08)', color: '#60a5fa',
                '& .MuiChip-label': { px: 0.75 }, textDecoration: 'none',
              }}
            />
          )}
          {prNumber > 0 && (
            <Chip label={`PR #${prNumber}`} size="small" variant="outlined"
              component={repoUrl ? 'a' : 'span'}
              href={repoUrl ? `${repoUrl}/pull/${prNumber}` : undefined}
              target="_blank" rel="noopener noreferrer" clickable={!!repoUrl}
              sx={{ height: 20, fontSize: '0.68rem', fontWeight: 500, fontFamily: 'monospace',
                borderColor: 'rgba(34,197,94,.4)', bgcolor: 'rgba(34,197,94,.08)', color: '#4ade80',
                '& .MuiChip-label': { px: 0.75 }, textDecoration: 'none',
              }}
            />
          )}
          {!branch && !commitSha && <span>Execução local</span>}
        </Box>

        <Tooltip title="Resetar todas as revisões">
          <IconButton
            size="small"
            onClick={onReset}
            sx={{ color: SUBTLE, '&:hover': { bgcolor: 'rgba(239,68,68,.1)', color: '#ef4444' } }}
          >
            <RestartAltRoundedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
