#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const { BRAND, LAYOUT, BARS } = require('./constants');

function parseArgs() {
  const args = process.argv.slice(2);
  const configIndex = args.indexOf('--config');
  const configPath = configIndex !== -1 ? args[configIndex + 1] : null;
  const outputIndex = args.indexOf('--output');
  const outputPath = outputIndex !== -1 ? args[outputIndex + 1] : null;
  return { configPath, outputPath };
}

function loadConfig(configPath) {
  if (!configPath) return {};
  const absolute = path.isAbsolute(configPath) ? configPath : path.join(process.cwd(), configPath);
  if (!fs.existsSync(absolute)) {
    console.warn(`⚠️ Config file "${absolute}" not found. Using defaults.`);
    return {};
  }

  try {
    const raw = fs.readFileSync(absolute, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Failed to parse config ${absolute}:`, error);
    return {};
  }
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawCard(ctx, config) {
  const {
    canvasSize,
    cardScale,
    artScale,
    cardCornerRadius,
    cardGradient,
    cardShadow,
    fullBleed
  } = config;

  // Optional full-bleed background fill (no shadow, full canvas)
  if (fullBleed) {
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvasSize);
    bgGradient.addColorStop(0, cardGradient.top);
    bgGradient.addColorStop(1, cardGradient.bottom);
    ctx.save();
    drawRoundedRect(ctx, 0, 0, canvasSize, canvasSize, 0);
    ctx.fillStyle = bgGradient;
    ctx.fill();
    ctx.restore();
  }

  // Render the card at the art scale (keeps dot/bar positions unchanged)
  const scale = fullBleed ? artScale : cardScale;
  const size = canvasSize * scale;
  const inset = (canvasSize - size) / 2;
  const x = inset;
  const y = inset;

  const gradient = ctx.createLinearGradient(0, y, 0, y + size);
  gradient.addColorStop(0, cardGradient.top);
  gradient.addColorStop(1, cardGradient.bottom);

  ctx.save();
  if (cardShadow && !fullBleed) {
    ctx.shadowColor = cardShadow.color || 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = cardShadow.blur ?? 40;
    ctx.shadowOffsetX = cardShadow.offsetX ?? 0;
    ctx.shadowOffsetY = cardShadow.offsetY ?? 30;
  }
  drawRoundedRect(ctx, x, y, size, size, cardCornerRadius);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore();
}

function drawGrid(ctx, config) {
  const {
    canvasSize,
    artScale,
    cardCornerRadius,
    gridHorizontalInsetFactor,
    gridColumns,
    gridDotRadius,
    gridDotStrokeWidth,
    gridDotSpacing,
    gridTopOffset,
    gridBottomOffset,
    gridOffsetX
  } = config;
  const size = canvasSize * artScale;
  const inset = (canvasSize - size) / 2;
  const cardLeft = inset;
  const cardTop = inset;

  const usableHeight = size - gridTopOffset - gridBottomOffset;
  const dotCount = Math.floor(usableHeight / gridDotSpacing);

  ctx.fillStyle = BRAND.CREAM;
  ctx.strokeStyle = BRAND.PURPLES[4];
  ctx.lineWidth = gridDotStrokeWidth;
  const horizontalInset = cardCornerRadius * gridHorizontalInsetFactor;
  const leftEdge = cardLeft + horizontalInset + gridOffsetX;
  const rightEdge = cardLeft + size - horizontalInset + gridOffsetX;
  const spacing = gridColumns > 1 ? (rightEdge - leftEdge) / (gridColumns - 1) : 0;
  for (let col = 0; col < gridColumns; col++) {
    const x = leftEdge + spacing * col;
    for (let i = 0; i <= dotCount; i++) {
      const y = cardTop + gridTopOffset + i * gridDotSpacing;
      ctx.beginPath();
      ctx.arc(x, y, gridDotRadius, 0, Math.PI * 2);
      ctx.fill();
      if (gridDotStrokeWidth > 0) {
        ctx.stroke();
      }
    }
  }
}

function drawBars(ctx, config, bars) {
  const {
    canvasSize,
    artScale,
    barHeight: desiredBarHeight,
    barCornerRadiusRatio,
    barMarginDots,
    gridTopOffset,
    gridBottomOffset,
    gridDotSpacing,
    barShadow,
    barOutline
  } = config;
  const size = canvasSize * artScale;
  const inset = (canvasSize - size) / 2;
  const cardLeft = inset;
  const cardTop = inset;
  const gridTop = cardTop + gridTopOffset;
  const gridBottom = cardTop + size - gridBottomOffset;
  const barAreaTop = gridTop + gridDotSpacing * barMarginDots;
  const barAreaBottom = gridBottom - gridDotSpacing * barMarginDots;
  const availableHeight = barAreaBottom - barAreaTop;
  const count = bars.length;

  let barHeight = desiredBarHeight;
  let gap = count > 1 ? (availableHeight - barHeight * count) / (count - 1) : 0;
  if (gap < 0) {
    barHeight = availableHeight / count;
    gap = 0;
  }

  bars.forEach((bar, index) => {
    const y = barAreaTop + index * (barHeight + gap);
    const width = bar.width;
    const x = cardLeft + size / 2 - width / 2 + bar.offsetX;

    const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
    const colorStops = bar.colorStops || [
      { offset: 0, color: bar.colorGradient ? bar.colorGradient[0] : '#FFFFFF' },
      { offset: 1, color: bar.colorGradient ? bar.colorGradient[1] : '#000000' }
    ];
    colorStops.forEach((stop) => {
      gradient.addColorStop(stop.offset, stop.color);
    });

    ctx.save();
    ctx.shadowColor = barShadow.color;
    ctx.shadowBlur = barShadow.blur;
    ctx.shadowOffsetY = barShadow.offsetY;

    const cornerRadius = Math.min(barHeight * barCornerRadiusRatio, barHeight / 2);
    drawRoundedRect(ctx, x, y, width, barHeight, cornerRadius);
    ctx.fillStyle = gradient;
    ctx.fill();
    const outline = bar.outlineOverride
      ? { ...barOutline, ...bar.outlineOverride }
      : barOutline;

    if (outline) {
      if (outline.outerColor && outline.outerWidth > 0) {
        ctx.lineWidth = outline.outerWidth;
        ctx.strokeStyle = outline.outerColor;
        ctx.stroke();
      }
      if (outline.innerColor && outline.innerWidth > 0) {
        ctx.save();
        drawRoundedRect(
          ctx,
          x + outline.innerWidth,
          y + outline.innerWidth,
          width - outline.innerWidth * 2,
          barHeight - outline.innerWidth * 2,
          Math.max(0, cornerRadius - outline.innerWidth)
        );
        ctx.lineWidth = outline.innerWidth;
        ctx.strokeStyle = outline.innerColor;
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.restore();
  });
}

function mergeConfig(defaults, overrides) {
  const result = JSON.parse(JSON.stringify(defaults));
  Object.keys(overrides).forEach((key) => {
    if (overrides[key] && typeof overrides[key] === 'object' && !Array.isArray(overrides[key])) {
      result[key] = mergeConfig(defaults[key] || {}, overrides[key]);
    } else {
      result[key] = overrides[key];
    }
  });
  return result;
}

function ensureOutputDir(outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function main() {
  const { configPath, outputPath } = parseArgs();
  const overrides = loadConfig(configPath);
  const merged = mergeConfig(LAYOUT, overrides.layout || {});

  // Preserve original layout for art while allowing full-bleed background
  const config = {
    ...merged,
    artScale: merged.artScale || merged.cardScale || LAYOUT.cardScale,
    fullBleed: Boolean(merged.fullBleed)
  };

  const bars = overrides.bars || BARS;
  const size = config.canvasSize;

  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  drawCard(ctx, config);
  drawGrid(ctx, config);
  drawBars(ctx, config, bars);

  const defaultOutput = path.join(__dirname, 'output', 'icon.png');
  const resolvedOutput = outputPath
    ? path.isAbsolute(outputPath)
      ? outputPath
      : path.join(__dirname, outputPath)
    : defaultOutput;
  ensureOutputDir(resolvedOutput);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(resolvedOutput, buffer);
  console.log(`✅ Icon generated at ${resolvedOutput}`);
}

main();
