/**
 * One simple line drawing per exercise (audit 10-21): the key position, drawn in the app's own style.
 * Joints run head, shoulder, hip, knee, foot, knee, foot, elbow, hand, elbow, hand, in a 120×80 box.
 */
type P = [number, number];
type Pose = [P, P, P, P, P, P, P, P, P, P, P];
type Prop =
  | { k: 'bench'; x: number; y: number; w: number; h?: number }
  | { k: 'db'; x: number; y: number }
  | { k: 'bar'; x1: number; x2: number; y: number; posts?: boolean }
  | { k: 'pole'; x: number; y1: number; y2?: number }
  | { k: 'band'; from: P; to: P }
  | { k: 'pack'; x: number; y: number }
  | { k: 'plate'; x: number; y: number; h: number }
  | { k: 'seat'; x: number; y: number; back?: number };
type Figure = { pose: Pose; props?: Prop[]; arrow?: [P, P] };

const FLOOR = 74;
const squatLow: Pose = [[61, 24], [58, 31], [47, 50], [64, 51], [61, 74], [62, 54], [57, 74], [70, 37], [81, 37], [68, 39], [79, 39]];
const plankHigh: Pose = [[92, 47], [84, 52], [56, 59], [40, 64], [20, 72], [40, 65], [21, 73], [85, 63], [86, 73], [84, 63], [84, 73]];
const hang: Pose = [[60, 19], [60, 26], [60, 47], [61, 57], [60, 67], [59, 57], [58, 67], [56, 16], [54, 8], [64, 16], [66, 8]];

const FIGURES: Record<string, Figure> = {
  'goblet-squat': { pose: [[61, 24], [58, 31], [47, 50], [64, 51], [61, 74], [62, 54], [57, 74], [62, 44], [64, 36], [60, 45], [62, 37]], props: [{ k: 'db', x: 64, y: 34 }] },
  'bw-squat': { pose: squatLow },
  'assisted-squat': { pose: [[61, 24], [58, 31], [47, 50], [64, 51], [61, 74], [62, 54], [57, 74], [70, 38], [82, 40], [68, 41], [82, 43]], props: [{ k: 'pole', x: 84, y1: 22 }] },
  'split-squat': { pose: [[58, 15], [57, 22], [56, 44], [70, 52], [72, 74], [48, 62], [34, 72], [56, 33], [57, 44], [58, 33], [59, 44]], arrow: [[46, 34], [46, 46]] },
  'bg-split-squat': { pose: [[60, 15], [59, 22], [57, 44], [71, 52], [73, 74], [48, 61], [32, 58], [58, 33], [59, 44], [60, 33], [61, 44]], props: [{ k: 'bench', x: 18, y: 58, w: 18 }] },
  'shrimp-squat': { pose: [[62, 22], [60, 29], [52, 48], [66, 54], [64, 74], [44, 62], [34, 52], [68, 36], [80, 34], [50, 40], [38, 50]] },
  'leg-press': { pose: [[24, 40], [30, 45], [42, 62], [58, 48], [74, 48], [57, 50], [73, 50], [36, 54], [44, 60], [37, 56], [45, 62]], props: [{ k: 'seat', x: 22, y: 64, back: 30 }, { k: 'plate', x: 76, y: 34, h: 26 }] },

  'bw-rdl': { pose: [[82, 37], [74, 40], [50, 46], [53, 60], [52, 74], [51, 60], [49, 74], [74, 51], [74, 61], [72, 51], [72, 61]], arrow: [[88, 52], [88, 38]] },
  'db-rdl': { pose: [[82, 37], [74, 40], [50, 46], [53, 60], [52, 74], [51, 60], [49, 74], [74, 51], [74, 61], [72, 51], [72, 61]], props: [{ k: 'db', x: 73, y: 63 }] },
  'sl-rdl': { pose: [[84, 39], [76, 42], [54, 46], [56, 60], [55, 74], [38, 45], [22, 44], [76, 53], [76, 63], [74, 53], [74, 63]] },
  'banded-nordic': { pose: [[78, 34], [72, 39], [54, 56], [40, 72], [22, 72], [40, 72], [22, 73], [80, 46], [88, 52], [79, 47], [87, 53]], props: [{ k: 'band', from: [72, 40], to: [104, 20] }, { k: 'pole', x: 104, y1: 10 }] },
  'nordic-curl': { pose: [[84, 44], [77, 48], [57, 60], [40, 72], [22, 72], [40, 72], [22, 73], [86, 58], [92, 66], [85, 59], [91, 67]], props: [{ k: 'bar', x1: 14, x2: 26, y: 70 }] },
  'hip-thrust': { pose: [[22, 48], [28, 52], [52, 50], [70, 50], [72, 74], [69, 52], [70, 74], [38, 54], [50, 50], [38, 56], [50, 52]], props: [{ k: 'bench', x: 12, y: 54, w: 20 }, { k: 'bar', x1: 46, x2: 58, y: 48 }], arrow: [[52, 64], [52, 54]] },
  'back-extension': { pose: [[86, 40], [78, 42], [56, 42], [42, 50], [26, 58], [42, 51], [26, 59], [80, 32], [84, 26], [78, 33], [82, 27]], props: [{ k: 'bench', x: 44, y: 44, w: 18, h: 30 }] },
  'reverse-hyper': { pose: [[86, 64], [78, 66], [54, 68], [40, 64], [24, 60], [40, 66], [24, 62], [90, 60], [100, 56], [90, 62], [100, 58]], arrow: [[24, 52], [30, 46]] },

  'wall-push-up': { pose: [[86, 22], [82, 28], [64, 48], [56, 61], [48, 74], [55, 62], [46, 74], [90, 32], [96, 30], [89, 34], [96, 33]], props: [{ k: 'pole', x: 98, y1: 6 }] },
  'incline-push-up': { pose: [[90, 40], [83, 45], [56, 57], [40, 64], [20, 72], [40, 65], [21, 73], [87, 52], [88, 58], [86, 53], [86, 59]], props: [{ k: 'bench', x: 80, y: 58, w: 22, h: 16 }] },
  'full-push-up': { pose: plankHigh },
  'diamond-push-up': { pose: [[92, 49], [84, 54], [56, 60], [40, 65], [20, 72], [40, 66], [21, 73], [82, 64], [84, 73], [80, 64], [82, 73]] },
  'pseudo-planche': { pose: [[96, 48], [88, 52], [60, 59], [42, 64], [20, 72], [42, 65], [21, 73], [84, 63], [78, 73], [82, 63], [76, 73]], arrow: [[96, 36], [106, 36]] },
  'db-bench': { pose: [[22, 52], [30, 55], [54, 56], [66, 62], [64, 74], [65, 63], [62, 74], [32, 44], [32, 34], [30, 45], [30, 35]], props: [{ k: 'bench', x: 16, y: 58, w: 44 }, { k: 'db', x: 32, y: 32 }] },
  'machine-chest-press': { pose: [[30, 22], [30, 30], [30, 54], [46, 56], [46, 74], [45, 57], [44, 74], [40, 32], [52, 32], [39, 34], [51, 34]], props: [{ k: 'seat', x: 22, y: 56, back: 28 }, { k: 'plate', x: 53, y: 26, h: 12 }] },
  'seated-db-press': { pose: [[50, 20], [50, 27], [50, 50], [66, 52], [66, 74], [65, 53], [64, 74], [42, 22], [42, 10], [58, 22], [58, 10]], props: [{ k: 'seat', x: 42, y: 52, back: 26 }, { k: 'db', x: 42, y: 8 }, { k: 'db', x: 58, y: 8 }] },

  'vertical-row': { pose: [[42, 22], [45, 29], [52, 51], [54, 62], [58, 74], [53, 63], [56, 74], [58, 30], [72, 28], [57, 32], [72, 31]], props: [{ k: 'pole', x: 74, y1: 6 }] },
  'incline-row': { pose: [[30, 32], [36, 37], [52, 55], [56, 64], [62, 74], [55, 65], [60, 74], [48, 30], [62, 24], [47, 32], [62, 27]], props: [{ k: 'bar', x1: 56, x2: 76, y: 24, posts: true }] },
  'horizontal-row': { pose: [[22, 58], [28, 60], [52, 64], [68, 66], [86, 72], [68, 67], [86, 73], [32, 50], [34, 40], [30, 51], [32, 41]], props: [{ k: 'bar', x1: 22, x2: 46, y: 40, posts: true }] },
  'wide-row': { pose: [[22, 58], [28, 60], [52, 64], [68, 66], [86, 72], [68, 67], [86, 73], [20, 50], [16, 40], [40, 50], [42, 40]], props: [{ k: 'bar', x1: 10, x2: 50, y: 40, posts: true }] },
  'archer-row': { pose: [[24, 56], [30, 58], [54, 64], [70, 66], [88, 72], [70, 67], [88, 73], [34, 48], [32, 40], [42, 56], [54, 42]], props: [{ k: 'bar', x1: 22, x2: 60, y: 40, posts: true }] },
  'backpack-row': { pose: [[82, 37], [74, 40], [50, 46], [53, 60], [52, 74], [51, 60], [49, 74], [70, 48], [72, 56], [68, 48], [70, 56]], props: [{ k: 'pack', x: 66, y: 56 }], arrow: [[84, 60], [84, 50]] },
  'band-row': { pose: [[50, 16], [50, 23], [50, 46], [52, 60], [52, 74], [49, 60], [48, 74], [42, 32], [56, 32], [41, 34], [55, 34]], props: [{ k: 'band', from: [56, 32], to: [96, 32] }, { k: 'pole', x: 98, y1: 12 }], arrow: [[74, 22], [62, 22]] },
  '1-arm-db-row': { pose: [[82, 36], [74, 39], [52, 44], [52, 60], [50, 74], [56, 58], [58, 74], [78, 50], [80, 58], [62, 44], [56, 38]], props: [{ k: 'bench', x: 76, y: 58, w: 24, h: 16 }, { k: 'db', x: 62, y: 46 }] },
  'seated-cable-row': { pose: [[36, 30], [38, 37], [36, 60], [56, 58], [70, 66], [55, 60], [69, 68], [48, 44], [62, 44], [47, 46], [61, 46]], props: [{ k: 'band', from: [62, 45], to: [100, 62] }, { k: 'plate', x: 100, y: 46, h: 28 }, { k: 'seat', x: 26, y: 62 }] },
  'lat-pulldown': { pose: [[50, 24], [50, 31], [50, 54], [66, 54], [66, 74], [65, 55], [64, 74], [40, 26], [36, 14], [60, 26], [64, 14]], props: [{ k: 'bar', x1: 30, x2: 70, y: 14 }, { k: 'band', from: [50, 14], to: [50, 2] }, { k: 'seat', x: 42, y: 56 }] },
  'scapular-pull': { pose: hang, props: [{ k: 'bar', x1: 40, x2: 80, y: 8, posts: true }], arrow: [[74, 30], [74, 22]] },
  'arch-hang': { pose: [[58, 18], [59, 25], [62, 46], [66, 56], [68, 66], [65, 56], [67, 66], [55, 15], [54, 8], [63, 15], [66, 8]], props: [{ k: 'bar', x1: 40, x2: 80, y: 8, posts: true }] },
  'pull-up-negative': { pose: [[60, 12], [60, 19], [60, 41], [61, 53], [60, 64], [59, 53], [58, 64], [50, 16], [54, 8], [70, 16], [66, 8]], props: [{ k: 'bar', x1: 40, x2: 80, y: 8, posts: true }], arrow: [[84, 22], [84, 36]] },
  'pull-up': { pose: [[60, 12], [60, 19], [60, 41], [61, 53], [60, 64], [59, 53], [58, 64], [50, 16], [54, 8], [70, 16], [66, 8]], props: [{ k: 'bar', x1: 40, x2: 80, y: 8, posts: true }], arrow: [[84, 36], [84, 22]] },

  'support-hold': { pose: [[60, 16], [60, 23], [60, 45], [62, 57], [60, 66], [58, 57], [57, 66], [50, 32], [48, 42], [70, 32], [72, 42]], props: [{ k: 'bar', x1: 38, x2: 52, y: 42, posts: true }, { k: 'bar', x1: 68, x2: 82, y: 42, posts: true }] },
  'dip-negative': { pose: [[60, 24], [60, 31], [60, 53], [64, 63], [60, 70], [62, 63], [57, 70], [46, 40], [48, 42], [74, 40], [72, 42]], props: [{ k: 'bar', x1: 38, x2: 52, y: 42, posts: true }, { k: 'bar', x1: 68, x2: 82, y: 42, posts: true }], arrow: [[90, 24], [90, 38]] },
  'dip': { pose: [[60, 24], [60, 31], [60, 53], [64, 63], [60, 70], [62, 63], [57, 70], [46, 40], [48, 42], [74, 40], [72, 42]], props: [{ k: 'bar', x1: 38, x2: 52, y: 42, posts: true }, { k: 'bar', x1: 68, x2: 82, y: 42, posts: true }], arrow: [[90, 38], [90, 24]] },

  'plank': { pose: [[92, 55], [84, 60], [56, 63], [40, 66], [20, 72], [40, 67], [21, 73], [84, 72], [96, 73], [83, 72], [95, 73]] },
  'long-lever-plank': { pose: [[96, 54], [88, 59], [58, 63], [42, 66], [20, 72], [42, 67], [21, 73], [96, 72], [106, 73], [95, 72], [105, 73]] },
  'side-plank': { pose: [[90, 47], [82, 52], [56, 62], [40, 67], [20, 73], [40, 66], [20, 71], [82, 72], [92, 73], [74, 42], [72, 32]] },
  'star-side-plank': { pose: [[90, 47], [82, 52], [56, 62], [40, 67], [20, 73], [42, 50], [28, 40], [82, 72], [92, 73], [80, 38], [80, 26]] },
  // Spec 15 soft days: three gentle stretches done lying in bed (the bed is drawn as a long low bench).
  'bed-reach': { pose: [[22, 57], [30, 61], [58, 63], [80, 63], [102, 63], [80, 64], [102, 64], [18, 60], [6, 58], [18, 61], [6, 60]], props: [{ k: 'bench', x: 4, y: 66, w: 112, h: 8 }], arrow: [[60, 50], [96, 50]] },
  'knee-hug': { pose: [[22, 57], [30, 61], [58, 63], [48, 44], [64, 46], [50, 45], [66, 47], [40, 54], [48, 46], [42, 55], [50, 47]], props: [{ k: 'bench', x: 4, y: 66, w: 112, h: 8 }] },
  'bed-twist': { pose: [[22, 57], [30, 61], [58, 63], [70, 50], [84, 62], [72, 52], [86, 63], [36, 66], [44, 66], [24, 64], [16, 66]], props: [{ k: 'bench', x: 4, y: 66, w: 112, h: 8 }], arrow: [[74, 40], [90, 50]] },
  'pallof-press': { pose: [[50, 16], [50, 23], [50, 46], [54, 60], [56, 74], [47, 60], [45, 74], [56, 32], [68, 32], [55, 34], [67, 34]], props: [{ k: 'band', from: [68, 33], to: [100, 33] }, { k: 'pole', x: 102, y1: 12 }], arrow: [[56, 22], [68, 22]] },
};

function PropShape({ prop }: { prop: Prop }) {
  switch (prop.k) {
    case 'bench': return <rect x={prop.x} y={prop.y} width={prop.w} height={prop.h ?? FLOOR - prop.y} rx="2" className="fig-prop" />;
    case 'db': return <g className="fig-iron"><rect x={prop.x - 6} y={prop.y - 2} width="12" height="4" rx="1" /><rect x={prop.x - 8} y={prop.y - 4} width="3" height="8" rx="1" /><rect x={prop.x + 5} y={prop.y - 4} width="3" height="8" rx="1" /></g>;
    case 'bar': return <g className="fig-prop-line"><line x1={prop.x1} y1={prop.y} x2={prop.x2} y2={prop.y} />{prop.posts && <><line x1={prop.x1} y1={prop.y} x2={prop.x1} y2={FLOOR} /><line x1={prop.x2} y1={prop.y} x2={prop.x2} y2={FLOOR} /></>}</g>;
    case 'pole': return <line className="fig-prop-line" x1={prop.x} y1={prop.y1} x2={prop.x} y2={prop.y2 ?? FLOOR} />;
    case 'band': return <line className="fig-band" x1={prop.from[0]} y1={prop.from[1]} x2={prop.to[0]} y2={prop.to[1]} />;
    case 'pack': return <rect x={prop.x} y={prop.y} width="10" height="12" rx="3" className="fig-iron" />;
    case 'plate': return <rect x={prop.x} y={prop.y} width="5" height={prop.h} rx="1.5" className="fig-iron" />;
    case 'seat': return <g className="fig-prop-line"><line x1={prop.x} y1={prop.y} x2={prop.x + 18} y2={prop.y} /><line x1={prop.x + 9} y1={prop.y} x2={prop.x + 9} y2={FLOOR} />{prop.back && <line x1={prop.x} y1={prop.y} x2={prop.x + 4} y2={prop.y - prop.back} />}</g>;
  }
}

export const hasFigure = (id: string) => id in FIGURES;

export function ExerciseFigure({ id, name }: { id: string; name: string }) {
  const figure = FIGURES[id];
  if (!figure) return null;
  const [head, shoulder, hip, k1, f1, k2, f2, e1, w1, e2, w2] = figure.pose;
  const path = (...points: P[]) => points.map(([x, y], index) => `${index ? 'L' : 'M'}${x} ${y}`).join(' ');
  return <svg className="exercise-figure" viewBox="0 0 120 80" role="img" aria-label={`How to do ${name}`} data-exercise={id}>
    <line className="fig-floor" x1="4" y1={FLOOR + 1} x2="116" y2={FLOOR + 1} />
    {figure.props?.map((prop, index) => <PropShape key={index} prop={prop} />)}
    <g className="fig-body">
      <path className="fig-far" d={path(hip, k2, f2)} /><path className="fig-far" d={path(shoulder, e2, w2)} />
      <path d={path(shoulder, hip)} /><path d={path(hip, k1, f1)} /><path d={path(shoulder, e1, w1)} />
      <circle cx={head[0]} cy={head[1]} r="5" className="fig-head" />
    </g>
    {figure.arrow && <path className="fig-arrow" d={path(...figure.arrow)} markerEnd="url(#fig-arrowhead)" />}
    <defs><marker id="fig-arrowhead" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L6 3 L0 6 z" className="fig-arrowhead" /></marker></defs>
  </svg>;
}
