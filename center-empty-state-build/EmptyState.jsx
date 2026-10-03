import {
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useIsPresent,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import { motionTokens } from "./motion-tokens";
import "./empty-state.css";

const styles = Object.freeze({
  root: "center-empty-state-root",
  icon: "center-empty-state-icon",
  glyph: "center-empty-state-glyph",
  frame: "center-empty-state-frame",
  copy: "center-empty-state-copy",
  line: "center-empty-state-line",
  titleRow: "center-empty-state-title-row",
  titleIcon: "center-empty-state-title-icon",
  action: "center-empty-state-action-slot",
});

const exitFast = {
  duration: motionTokens.duration.fast,
  ease: [...motionTokens.ease.standard],
};
const textIn = {
  opacity: 0,
  y: "0.3em",
  filter: `blur(${motionTokens.blur.soft}px)`,
};
const textOut = {
  opacity: 0,
  y: "-0.3em",
  filter: `blur(${motionTokens.blur.subtle}px)`,
  transition: exitFast,
};
const iconIn = {
  opacity: 0,
  scale: 0.6,
  filter: `blur(${motionTokens.blur.subtle}px)`,
};
const shown = {
  opacity: 1,
  y: "0em",
  scale: 1,
  filter: "blur(0px)",
};
const fadeOut = {
  opacity: 0,
  transition: { duration: motionTokens.duration.instant },
};

function Swap(props) {
  const present = useIsPresent();
  return (
    <motion.span
      {...props}
      aria-hidden={present ? props["aria-hidden"] : true}
    />
  );
}

function iconKey(icon) {
  if (!isValidElement(icon)) return "icon";
  const type = icon.type;
  return typeof type === "string"
    ? type
    : type.displayName ?? type.name ?? "icon";
}

function HeightFrame({ reduce, morphKey, children }) {
  const frame = useRef(null);
  const content = useRef(null);
  const height = useMotionValue("auto");
  const changedAt = useRef(0);

  useLayoutEffect(() => {
    changedAt.current = performance.now();
  }, [morphKey]);

  useEffect(() => {
    const node = content.current;
    if (!node || typeof ResizeObserver === "undefined") return undefined;

    let last;
    let controls;

    const settle = () => {
      height.jump("auto");
      if (frame.current) {
        Object.assign(frame.current.style, {
          overflow: "",
          height: "auto",
        });
      }
    };

    const observer = new ResizeObserver(([entry]) => {
      const next =
        entry.borderBoxSize?.[0]?.blockSize ??
        node.offsetHeight;
      const current = height.get();
      const from = typeof current === "number" ? current : last;
      last = next;
      controls?.stop();

      if (
        reduce ||
        from === undefined ||
        from === next ||
        performance.now() - changedAt.current > 120
      ) {
        settle();
        return;
      }

      if (frame.current) {
        Object.assign(frame.current.style, {
          overflow: "hidden",
          height: `${from}px`,
        });
      }

      controls = animate(height, [from, next], {
        ...motionTokens.spring.smooth,
        onComplete: settle,
      });
    });

    observer.observe(node);
    return () => {
      observer.disconnect();
      controls?.stop();
    };
  }, [height, reduce]);

  return (
    <motion.div ref={frame} className={styles.frame} style={{ height }}>
      <div ref={content} className={styles.copy}>
        {children}
      </div>
    </motion.div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  titleIcon,
  className,
  label,
}) {
  const reduce = useReducedMotion();
  const enter = reduce
    ? { duration: motionTokens.duration.instant }
    : {
        duration: motionTokens.duration.standard,
        ease: [...motionTokens.ease.enter],
      };
  const swap = {
    initial: reduce ? { opacity: 0 } : textIn,
    animate: shown,
    exit: reduce ? fadeOut : textOut,
    transition: enter,
  };

  return (
    <section
      className={[styles.root, className].filter(Boolean).join(" ")}
      aria-label={label}
    >
      <div className={styles.icon} aria-hidden="true">
        <AnimatePresence mode="popLayout" initial={false}>
          <Swap
            key={iconKey(icon)}
            className={styles.glyph}
            initial={reduce ? { opacity: 0 } : iconIn}
            animate={shown}
            exit={
              reduce
                ? fadeOut
                : { ...iconIn, transition: exitFast }
            }
            transition={
              reduce ? enter : motionTokens.spring.snappy
            }
          >
            {icon}
          </Swap>
        </AnimatePresence>
      </div>

      <HeightFrame
        reduce={reduce}
        morphKey={`${title}\n${description}`}
      >
        <h3>
          <span className={styles.titleRow}>
            {titleIcon && (
              <span className={styles.titleIcon} aria-hidden="true">
                {titleIcon}
              </span>
            )}
            <AnimatePresence mode="popLayout" initial={false}>
              <Swap key={title} className={styles.line} {...swap}>
                {title}
              </Swap>
            </AnimatePresence>
          </span>
        </h3>
        <p>
          <AnimatePresence mode="popLayout" initial={false}>
            <Swap
              key={description}
              className={styles.line}
              {...swap}
            >
              {description}
            </Swap>
          </AnimatePresence>
        </p>
      </HeightFrame>

      {action && <div className={styles.action}>{action}</div>}
    </section>
  );
}

export default EmptyState;
