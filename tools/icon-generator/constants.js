// SEI Brand Palette and layout defaults for the icon renderer.

const BRAND = {
  REDS: ['#F01840', '#C01830', '#901226', '#600C1C', '#300810'],
  PURPLES: ['#D0C8C8', '#A0949E', '#705E74', '#402848', '#2A1C30'],
  CREAM: '#FFFFF8',
  BLACK: '#141018'
};

const LAYOUT = {
  canvasSize: 1024,
  cardScale: 0.9,
  cardCornerRadius: 200,
  cardShadow: null,
  backgroundGradient: {
    inner: '#3A2555',
    outer: '#140B24'
  },
  cardGradient: {
    top: '#4B2B75',
    bottom: '#331A4E'
  },
  gridColumns: 4,
  gridDotRadius: 6,
  gridDotStrokeWidth: 2,
  gridDotSpacing: 32,
  gridOffsetX: 0,
  gridTopOffset: 140,
  gridBottomOffset: 140,
  gridHorizontalInsetFactor: 0.7,
  barHeight: 81,
  barCornerRadiusRatio: 0.2,
  barMarginDots: 1.5,
  barOutline: {
    outerColor: '#5A1730',
    innerColor: '#FF9CAB',
    outerWidth: 1.5,
    innerWidth: 1
  },
  barShadow: {
    blur: 18,
    offsetY: 10,
    color: 'rgba(20, 0, 20, 0.7)'
  }
};

const BARS = [
  {
    width: 362,
    offsetX: -106.93333333333334,
    colorStops: [
      { offset: 0, color: '#FF9FAF' },
      { offset: 0.03, color: '#F83A4F' },
      { offset: 1, color: '#C01830' }
    ]
  },
  {
    width: 362,
    offsetX: -106.93333333333334,
    colorStops: [
      { offset: 0, color: '#FF9FAF' },
      { offset: 0.03, color: '#F83A4F' },
      { offset: 1, color: '#C01830' }
    ]
  },
  {
    width: 460,
    offsetX: 57.933333333333285,
    colorStops: [
      { offset: 0, color: '#FFFFFF' },
      { offset: 0.03, color: '#FFFFF8' },
      { offset: 1, color: '#E7DED2' }
    ],
    outlineOverride: {
      outerColor: '#D0C8C8',
      innerColor: '#FFFFF8'
    }
  },
  {
    width: 271.5,
    offsetX: -152.18333333333334,
    colorStops: [
      { offset: 0, color: '#FF9FAF' },
      { offset: 0.03, color: '#F83A4F' },
      { offset: 1, color: '#C01830' }
    ]
  },
  {
    width: 362,
    offsetX: 106.93333333333337,
    colorStops: [
      { offset: 0, color: '#FFFFFF' },
      { offset: 0.03, color: '#FFFFF8' },
      { offset: 1, color: '#E7DED2' }
    ],
    outlineOverride: {
      outerColor: '#D0C8C8',
      innerColor: '#FFFFF8'
    }
  }
];

module.exports = {
  BRAND,
  LAYOUT,
  BARS
};
