interface KaleidoriumWordmarkProps {
  size?: "desktop" | "mobile"
  className?: string
}

export function KaleidoriumWordmark({ size = "desktop", className = "" }: KaleidoriumWordmarkProps) {
  return (
    <span
      className={`kaleidorium-wordmark kaleidorium-wordmark--${size}${className ? ` ${className}` : ""}`}
      aria-hidden="true"
    >
      <img
        src="/logos/logo-large-64x64.svg?v=14"
        alt=""
        className="kaleidorium-wordmark-icon"
      />
      <span className="kaleidorium-wordmark-text">kaleidorium</span>
    </span>
  )
}
