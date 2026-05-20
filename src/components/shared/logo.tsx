function logo() {
  return (
    <svg
      width="512"
      height="512"
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="bgGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#003B1F" />
          <stop offset="100%" stop-color="#006B3C" />
        </linearGradient>

        <linearGradient id="globeGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#A7F36B" />
          <stop offset="100%" stop-color="#4CAF50" />
        </linearGradient>

        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" flood-opacity="0.25" />
        </filter>
      </defs>

      <rect x="16" y="16" width="480" height="480" rx="60" fill="url(#bgGradient)" />

      <circle
        cx="256"
        cy="200"
        r="140"
        fill="none"
        stroke="url(#globeGradient)"
        stroke-width="3"
        opacity="0.7"
      />

      <ellipse
        cx="256"
        cy="200"
        rx="120"
        ry="45"
        stroke="#7DFF8A"
        stroke-width="2"
        opacity="0.35"
        fill="none"
      />
      <ellipse
        cx="256"
        cy="200"
        rx="120"
        ry="90"
        stroke="#7DFF8A"
        stroke-width="2"
        opacity="0.25"
        fill="none"
      />

      <ellipse
        cx="256"
        cy="200"
        rx="45"
        ry="140"
        stroke="#7DFF8A"
        stroke-width="2"
        opacity="0.25"
        fill="none"
      />
      <ellipse
        cx="256"
        cy="200"
        rx="90"
        ry="140"
        stroke="#7DFF8A"
        stroke-width="2"
        opacity="0.2"
        fill="none"
      />

      <g filter="url(#shadow)">
        <path
          d="M170 120C170 109 179 100 190 100H300L360 160V320C360 331 351 340 340 340H190C179 340 170 331 170 320V120Z"
          fill="white"
        />

        <path d="M300 100L360 160H315C306 160 300 154 300 145V100Z" fill="#B8E986" />

        <rect x="205" y="165" width="100" height="10" rx="5" fill="#0A6B39" />
        <rect x="205" y="205" width="120" height="10" rx="5" fill="#0A6B39" />
        <rect x="205" y="245" width="80" height="10" rx="5" fill="#0A6B39" />
      </g>

      <g filter="url(#shadow)">
        <circle cx="330" cy="310" r="55" fill="white" stroke="#0A8F47" stroke-width="10" />
        <rect
          x="365"
          y="345"
          width="20"
          height="70"
          rx="10"
          transform="rotate(-45 365 345)"
          fill="#0A8F47"
        />

        <path d="M305 325H355" stroke="#065F36" stroke-width="5" stroke-linecap="round" />
        <path d="M312 320C312 300 322 288 330 282C338 288 348 300 348 320" fill="#0A8F47" />

        <rect x="317" y="320" width="6" height="18" fill="#065F36" />
        <rect x="327" y="320" width="6" height="18" fill="#065F36" />
        <rect x="337" y="320" width="6" height="18" fill="#065F36" />

        <path d="M328 276H332V286H328Z" fill="#065F36" />
      </g>

      <text
        x="256"
        y="445"
        text-anchor="middle"
        fill="white"
        font-size="46"
        font-family="Arial, Helvetica, sans-serif"
        font-weight="700"
      >
        Wepository
      </text>

      <text
        x="256"
        y="475"
        text-anchor="middle"
        fill="#9BE15D"
        font-size="14"
        font-family="Arial, Helvetica, sans-serif"
        letter-spacing="4"
      >
        TRUTH. TRANSPARENT. TOGETHER.
      </text>
    </svg>
  );
}

export default logo;
