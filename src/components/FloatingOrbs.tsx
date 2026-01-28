const FloatingOrbs = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Primary orb */}
      <div
        className="absolute w-96 h-96 rounded-full animate-float"
        style={{
          background: "radial-gradient(circle, hsl(180 100% 50% / 0.15) 0%, transparent 70%)",
          top: "10%",
          left: "-10%",
          filter: "blur(40px)",
        }}
      />
      
      {/* Secondary orb */}
      <div
        className="absolute w-80 h-80 rounded-full animate-float"
        style={{
          background: "radial-gradient(circle, hsl(280 100% 65% / 0.12) 0%, transparent 70%)",
          top: "50%",
          right: "-5%",
          filter: "blur(60px)",
          animationDelay: "2s",
        }}
      />
      
      {/* Accent orb */}
      <div
        className="absolute w-64 h-64 rounded-full animate-float"
        style={{
          background: "radial-gradient(circle, hsl(150 100% 45% / 0.1) 0%, transparent 70%)",
          bottom: "10%",
          left: "20%",
          filter: "blur(50px)",
          animationDelay: "4s",
        }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(180 100% 50%) 1px, transparent 1px),
            linear-gradient(90deg, hsl(180 100% 50%) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />
    </div>
  );
};

export default FloatingOrbs;
