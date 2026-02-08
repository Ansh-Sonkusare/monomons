import { useMotionValue, useMotionTemplate, motion } from "motion/react";
import { useState, useEffect } from "react";
import { cn } from "../lib/utils";

export const EvervaultCard = ({
  text,
  image,
  className,
  children,
}: {
  text?: string;
  image?: string;
  className?: string;
  children?: React.ReactNode;
}) => {
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  const [randomString, setRandomString] = useState("");

  useEffect(() => {
    let str = generateRandomString(1500);
    setRandomString(str);
  }, []);

  function onMouseMove({ currentTarget, clientX, clientY }: any) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);

    const str = generateRandomString(1500);
    setRandomString(str);
  }

  return (
    <div
      className={cn(
        "bg-transparent flex items-center justify-center w-full h-full relative border border-white/30 rounded-none",
        className
      )}
    >
      <div
        onMouseMove={onMouseMove}
        className="group/card rounded-none w-full relative overflow-hidden bg-transparent flex flex-col h-full"
      >
        <CardPattern
          mouseX={mouseX}
          mouseY={mouseY}
          randomString={randomString}
        />
        <div className="relative z-10 flex-1 flex items-center justify-center w-full p-2">
          <div className="relative h-32 w-32 rounded-full flex items-center justify-center text-white font-bold text-4xl">
            <div className="absolute w-full h-full bg-white/[0.8] dark:bg-black/[0.8] blur-sm rounded-full" />
            {image ? (
              <img
                src={image}
                alt={text || "icon"}
                className="w-36 h-36 object-contain z-20 relative drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
              />
            ) : (
              <span className="dark:text-white text-black z-20">{text}</span>
            )}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

export function CardPattern({ mouseX, mouseY, randomString }: any) {
  let maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, white, transparent)`;
  let style = { maskImage, WebkitMaskImage: maskImage };

  // Random gradient colors
  const gradients = [
    'from-purple-500 to-pink-600',
    'from-cyan-500 to-blue-600',
    'from-green-500 to-emerald-600',
    'from-orange-500 to-red-600',
    'from-indigo-500 to-purple-600',
    'from-yellow-500 to-orange-600',
  ];
  
  const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      <div className="absolute inset-0 rounded-none  [mask-image:linear-gradient(white,transparent)] group-hover/card:opacity-50"></div>
      <motion.div
        className={`absolute inset-0 rounded-none bg-gradient-to-r ${randomGradient} opacity-0  group-hover/card:opacity-100 backdrop-blur-xl transition duration-500`}
        style={style}
      />
      <motion.div
        className="absolute inset-0 rounded-none opacity-0 mix-blend-overlay  group-hover/card:opacity-100"
        style={style}
      >
        <p className="absolute inset-x-0 text-[6px] h-full break-words whitespace-pre-wrap text-white font-mono font-bold transition duration-500 leading-tight">
          {randomString}
        </p>
      </motion.div>
    </div>
  );
}

const characters =
  "MONOMONS_PROJECT_SECURE_SYSTEM_ACCESS_GRANTED_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
export const generateRandomString = (length: number) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const Icon = ({ className, ...rest }: any) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={className}
      {...rest}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  );
};
