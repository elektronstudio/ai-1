import { line, curveCatmullRomClosed } from "d3-shape";

export function draw(ctx, objects) {
  ctx.font = "20px Arial";
  objects.value.forEach((o, i) => {
    o.buffer.forEach((b, j) => {
      ctx.fillStyle = `hsl(${i * 30},100%,50%,1)`;
      ctx.beginPath();
      ctx.strokeStyle = "red";
      ctx.arc(b[0], b[1], 30 + j, 0, 2 * Math.PI);
      ctx.fill();
      ctx.closePath();
    });
    if (o.still) {
      ctx.lineWidth = 5;
      ctx.arc(...o.currentCenter, 50, 0, 2 * Math.PI);
      ctx.stroke();
    }
    ctx.lineWidth = 10;
    ctx.strokeStyle = "rgba(255,255,0,0.1)";
    const obj = objects.value
      .filter((oo) => oo.still)
      .map((oo) => oo.currentCenter);
    Array.from({ length: 2 })
      .map((_) => (Math.random() - 0.5) * 1)
      .forEach((a) =>
        line().curve(curveCatmullRomClosed.alpha(a)).context(ctx)(obj)
      );
    ctx.stroke();
    ctx.closePath();
  });
}
