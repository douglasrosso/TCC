import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded';
import ListRoundedIcon from '@mui/icons-material/ListRounded';
import { BORDER, DIM, MUTED, KbdHint } from './shared.jsx';

export default function ReviewEmptyState({ onOpenDiffs, onOpenRuns }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 2.5,
        p: 4,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: 3,
          bgcolor: 'rgba(255,255,255,.04)',
          border: '1px solid hsl(240 3.7% 15.9%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <VisibilityRoundedIcon sx={{ fontSize: 36, color: DIM }} />
      </Box>

      <Box>
        <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#fafafa', mb: 0.75 }}>
          Nenhuma tela selecionada
        </Typography>
        <Typography sx={{ fontSize: '0.82rem', color: '#71717a', maxWidth: 320, lineHeight: 1.6 }}>
          Selecione um test run e depois uma tela para começar a revisão.
        </Typography>
      </Box>

      {/* Mobile/compact: show buttons to open drawers */}
      {(onOpenRuns || onOpenDiffs) && (
        <Box sx={{ display: 'flex', gap: 1.5, mt: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
          {onOpenRuns && (
            <Button
              variant="outlined"
              startIcon={<FolderOpenRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={onOpenRuns}
              sx={{
                textTransform: 'none',
                fontSize: '0.82rem',
                borderColor: BORDER,
                color: MUTED,
                height: 40,
                px: 2.5,
                '&:hover': { bgcolor: 'rgba(255,255,255,.04)', borderColor: MUTED },
              }}
            >
              Test Runs
            </Button>
          )}
          {onOpenDiffs && (
            <Button
              variant="outlined"
              startIcon={<ListRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={onOpenDiffs}
              sx={{
                textTransform: 'none',
                fontSize: '0.82rem',
                borderColor: BORDER,
                color: MUTED,
                height: 40,
                px: 2.5,
                '&:hover': { bgcolor: 'rgba(255,255,255,.04)', borderColor: MUTED },
              }}
            >
              Lista de Telas
            </Button>
          )}
        </Box>
      )}

      {/* Keyboard shortcut guide */}
      <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
        {[
          { key: '←', label: 'Anterior' },
          { key: '→', label: 'Próximo' },
          { key: 'A', label: 'Aprovar' },
          { key: 'R', label: 'Rejeitar' },
        ].map(({ key, label }) => (
          <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <KbdHint>{key}</KbdHint>
            <Typography sx={{ fontSize: '0.72rem', color: DIM }}>{label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
