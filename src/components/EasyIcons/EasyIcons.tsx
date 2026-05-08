import { createLucideIcon } from "lucide-react";

export const EasyFixLogoIcon = createLucideIcon("EasyFixLogo", [
  [
    "path",
    {
      d: "M5 7.5h8.5a5.5 5.5 0 0 1 0 11H5v-11Z",
      key: "easyfix-logo-body",
    },
  ],
  [
    "path",
    {
      d: "M8.5 11h5a2 2 0 0 1 0 4h-5",
      key: "easyfix-logo-inner",
    },
  ],
  [
    "path",
    {
      d: "M5 7.5 9 3.5h6",
      key: "easyfix-logo-top",
    },
  ],
  [
    "path",
    {
      d: "M5 18.5 9 22h6",
      key: "easyfix-logo-bottom",
    },
  ],
]);

export const EasyConsoleIcon = createLucideIcon("EasyConsole", [
  ["rect", { x: "3", y: "4", width: "18", height: "16", rx: "3", key: "console-frame" }],
  ["path", { d: "m8 9 3 3-3 3", key: "console-prompt" }],
  ["path", { d: "M13 15h4", key: "console-line" }],
]);
