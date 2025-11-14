export default function Head() {
  return (
    <>
      {/* Performance hints for external APIs used on landing/header */}
      <link rel="preconnect" href="https://api.github.com" crossOrigin="" />
      <link rel="dns-prefetch" href="https://api.github.com" />
    </>
  );
}


