// components/ui/TidelineLogo.tsx

interface TidelineLogoProps {
  size?: 'sm' | 'md' | 'lg'
  theme?: 'light' | 'dark'
}

export function TidelineLogo({ size = 'md', theme = 'dark' }: TidelineLogoProps) {
  const dims = { sm: 28, md: 36, lg: 48 }
  const fontSizes = { sm: 14, md: 18, lg: 24 }
  const d = dims[size]
  const fs = fontSizes[size]
  const wordmarkColor = theme === 'dark' ? '#FFFFFF' : '#0A1628'
  const subColor = theme === 'dark' ? 'rgba(255,255,255,0.30)' : '#9AA0A6'
  const radius = Math.round(d * 0.22)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {/* Mark: teal square with white T */}
      <svg
        width={d}
        height={d}
        viewBox="0 0 72 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <rect width="72" height="72" rx={radius * 2} fill="#1D9E75" />
        <rect x="10" y="14" width="52" height="10" rx="5" fill="white" />
        <rect x="31" y="14" width="10" height="46" rx="5" fill="white" />
      </svg>

      {/* Wordmark */}
      <div>
        <div
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: fs,
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: wordmarkColor,
            lineHeight: 1,
          }}
        >
          Tideline
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: subColor,
            marginTop: 2,
          }}
        >
          Ocean Intelligence
        </div>
      </div>
    </div>
  )
}
