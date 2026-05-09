"use client";

import { CheckIcon, XIcon } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export type StepStatus = "upcoming" | "active" | "completed" | "error";

export type StepsProps = {
  current?: number;
  direction?: "horizontal" | "vertical";
  statuses?: StepStatus[];
  className?: string;
  children: React.ReactNode;
};

export type StepItemProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  status?: StepStatus;
  className?: string;
};

function resolveStatus(
  index: number,
  current: number,
  statuses?: StepStatus[],
  override?: StepStatus,
): StepStatus {
  if (override) return override;
  if (statuses?.[index]) return statuses[index];
  if (index < current) return "completed";
  if (index === current) return "active";
  return "upcoming";
}

const CIRCLE_STYLE: Record<StepStatus, string> = {
  active:
    "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background",
  completed: "bg-primary text-primary-foreground",
  error:
    "bg-destructive text-white ring-2 ring-destructive ring-offset-2 ring-offset-background",
  upcoming: "bg-muted text-muted-foreground ring-1 ring-border",
};

function Circle({
  status,
  index,
  icon,
}: {
  status: StepStatus;
  index: number;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all",
        CIRCLE_STYLE[status],
      )}
      aria-current={status === "active" ? "step" : undefined}
    >
      {icon ??
        (status === "completed" ? (
          <CheckIcon className="size-4" />
        ) : status === "error" ? (
          <XIcon className="size-4" />
        ) : (
          <span>{index + 1}</span>
        ))}
    </div>
  );
}

export function Steps({
  current = 0,
  direction = "horizontal",
  statuses,
  className,
  children,
}: StepsProps): React.ReactElement {
  const items = React.Children.toArray(children).filter(React.isValidElement);
  const count = items.length;

  if (direction === "vertical") {
    return (
      <ol className={cn("flex w-full flex-col", className)} data-slot="steps">
        {items.map((child, i) => {
          const props = child.props as StepItemProps;
          const status = resolveStatus(i, current, statuses, props.status);
          const isLast = i === count - 1;
          return (
            <li
              key={i}
              className="flex gap-3"
              data-slot="step-item"
              data-status={status}
            >
              <div className="flex flex-col items-center">
                <Circle status={status} index={i} icon={props.icon} />
                {!isLast && (
                  <div
                    className={cn(
                      "mt-1.5 w-0.5 flex-1 rounded-full transition-colors",
                      i < current ? "bg-primary" : "bg-border",
                    )}
                    aria-hidden
                  />
                )}
              </div>
              <div className={cn("flex flex-col gap-0.5 pt-1", !isLast && "pb-4")}>
                <span
                  className={cn(
                    "text-sm font-medium leading-tight",
                    status === "upcoming"
                      ? "text-muted-foreground"
                      : "text-foreground",
                  )}
                >
                  {props.title}
                </span>
                {props.description && (
                  <span className="text-xs text-muted-foreground">
                    {props.description}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol className={cn("flex w-full", className)} data-slot="steps">
      {items.map((child, i) => {
        const props = child.props as StepItemProps;
        const status = resolveStatus(i, current, statuses, props.status);
        const isLast = i === count - 1;
        return (
          <li
            key={i}
            className={cn("flex min-w-0 items-start", isLast ? "shrink-0" : "flex-1")}
            data-slot="step-item"
            data-status={status}
          >
            <div className="flex shrink-0 flex-col items-center gap-2">
              <Circle status={status} index={i} icon={props.icon} />
              <div className="flex max-w-[120px] flex-col items-center gap-0.5 text-center">
                <span
                  className={cn(
                    "text-sm font-medium leading-tight",
                    status === "upcoming"
                      ? "text-muted-foreground"
                      : "text-foreground",
                  )}
                >
                  {props.title}
                </span>
                {props.description && (
                  <span className="text-xs leading-snug text-muted-foreground">
                    {props.description}
                  </span>
                )}
              </div>
            </div>
            {!isLast && (
              <div className="mt-4 flex flex-1 items-center px-3">
                <div
                  className={cn(
                    "h-0.5 w-full rounded-full transition-colors",
                    i < current ? "bg-primary" : "bg-border",
                  )}
                  aria-hidden
                />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function StepItem(_props: StepItemProps): React.ReactElement {
  return <></>;
}
