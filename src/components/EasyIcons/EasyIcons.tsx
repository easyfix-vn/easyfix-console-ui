import * as React from "react";
import { createLucideIcon } from "lucide-react";

export type EasyfixLogoIconProps = React.SVGAttributes<SVGSVGElement> & {
  size?: number | string;
};

/** @deprecated Use EasyfixLogoIcon instead */
export type EasyFixLogoIconProps = EasyfixLogoIconProps;

let logoIdSeed = 0;

/**
 * Easyfix 品牌图标（多色 + 渐变），来源：easyfix_icon_c_2025.svg
 * 使用内联 SVG 而非 createLucideIcon，因为 lucide 仅支持单色描边图标。
 */
export const EasyfixLogoIcon = React.forwardRef<
  SVGSVGElement,
  EasyfixLogoIconProps
>(function EasyfixLogoIcon(
  { size = 24, width, height, className, ...props },
  ref,
) {
  const uid = React.useId();
  // useId 在 SSR 之外保证稳定唯一，但为兼容某些场景再叠一份递增计数避免 :: 字符问题
  const idBase = React.useMemo(() => {
    logoIdSeed += 1;
    return `easyfix-logo-${uid.replace(/[:]/g, "")}-${logoIdSeed}`;
  }, [uid]);
  const clipA = `${idBase}-clip-a`;
  const clipB = `${idBase}-clip-b`;
  const grad = `${idBase}-grad`;
  const w = width ?? size;
  const h = height ?? size;

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 155.7 155.7"
      width={w}
      height={h}
      className={className}
      aria-hidden={props["aria-label"] ? undefined : true}
      {...props}
    >
      <defs>
        <clipPath id={clipA}>
          <rect x="55.36" y="36.86" width="44.89" height="82.06" />
        </clipPath>
        <clipPath id={clipB}>
          <path d="M105.23,85.25l14.99-14.99c.06-.06.11-.12.16-.18h-39.78s5.68,6.76,5.68,6.76c.5.6.49,1.47-.02,2.06l-5.56,6.35h24.53Z" />
        </clipPath>
        <linearGradient
          id={grad}
          x1="77.83"
          y1="78.43"
          x2="110.28"
          y2="78.43"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.04" stopColor="#fff" />
          <stop offset="0.8" stopColor="#f18a38" />
        </linearGradient>
      </defs>
      <g>
        <g>
          <rect width="155.7" height="155.7" rx="47.08" ry="47.08" fill="#f18a38" />
          <path
            d="M98.27,126.51h-40.85c-5.96,0-10.79-4.52-10.79-10.09V39.28c0-5.57,4.83-10.09,10.79-10.09h40.85c5.96,0,10.79,4.52,10.79,10.09v77.14c0,5.57-4.83,10.09-10.79,10.09Z"
            fill="#fff"
          />
        </g>
        <g>
          <rect
            x="55.3"
            y="38.93"
            width="45"
            height="77.86"
            rx="6.73"
            ry="6.73"
            fill="#f18a38"
          />
          <g clipPath={`url(#${clipA})`}>
            <g>
              <path
                d="M78.37,67.52s.09.02.13.06l8.56,10.19c.05.06.05.15,0,.21l-8.56,9.77s-.08.06-.12.06h-13.07c3.2,4.55,8.48,7.52,14.46,7.52,9.76,0,17.67-7.91,17.67-17.67,0-9.76-7.91-17.67-17.67-17.67-5.98,0-11.26,2.97-14.46,7.52h13.07Z"
                fill="#fff"
              />
              <g clipPath={`url(#${clipB})`}>
                <rect
                  x="77.83"
                  y="61.36"
                  width="32.45"
                  height="34.14"
                  fill={`url(#${grad})`}
                />
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
});

export const EasyConsoleIcon = createLucideIcon("EasyConsole", [
  ["rect", { x: "3", y: "4", width: "18", height: "16", rx: "3", key: "console-frame" }],
  ["path", { d: "m8 9 3 3-3 3", key: "console-prompt" }],
  ["path", { d: "M13 15h4", key: "console-line" }],
]);
