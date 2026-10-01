export function FoodOrbit({ className = "" }: { className?: string }) {
  return (
    <div className={`food-orbit ${className}`} aria-hidden="true">
      <svg className="orbit-leaf" viewBox="0 0 120 120" fill="none">
        <path d="M17 91C4 43 33 14 100 17c6 56-18 100-68 87" fill="currentColor" />
        <path d="m22 102 58-59" stroke="#426B31" strokeWidth="4" strokeLinecap="round" />
        <path
          d="M48 48c2-6 7-6 9 0m17 0c2-6 7-6 9 0m-30 13c7 9 15 9 22 0"
          stroke="#426B31"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <svg className="orbit-peach" viewBox="0 0 120 120" fill="none">
        <path d="M12 94a48 48 0 0 1 96 0H79a19 19 0 0 0-38 0Z" fill="currentColor" />
        <path
          d="M42 43c2 5 7 5 9 0m17 0c2 5 7 5 9 0m-27 14c6 5 12 5 18 0"
          stroke="#8F573D"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span className="orbit-dot" />
      <span className="orbit-spark">✳</span>
    </div>
  );
}
