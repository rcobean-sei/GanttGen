const { getPaletteByName, PALETTE_PRESETS } = require('../../scripts/build');

describe('Palette Functions', () => {
    describe('getPaletteByName', () => {
        test('should return correct palette for valid name', () => {
            const palette = getPaletteByName('reds');
            expect(palette).toBeDefined();
            expect(Array.isArray(palette)).toBe(true);
            expect(palette.length).toBeGreaterThan(0);
        });

        test('should return alternating palette for "alternating"', () => {
            const palette = getPaletteByName('alternating');
            expect(palette).toEqual(PALETTE_PRESETS.alternating);
        });

        test('should return purples_a palette for "purples_a"', () => {
            const palette = getPaletteByName('purples_a');
            expect(palette).toEqual(PALETTE_PRESETS.purples_a);
        });

        test('should return purples_b palette for "purples_b"', () => {
            const palette = getPaletteByName('purples_b');
            expect(palette).toEqual(PALETTE_PRESETS.purples_b);
        });

        test('should return purples_c palette for "purples_c"', () => {
            const palette = getPaletteByName('purples_c');
            expect(palette).toEqual(PALETTE_PRESETS.purples_c);
        });

        test('should return reds_b palette for "reds_b"', () => {
            const palette = getPaletteByName('reds_b');
            expect(palette).toEqual(PALETTE_PRESETS.reds_b);
        });

        test('should return alternating_b palette for "alternating_b"', () => {
            const palette = getPaletteByName('alternating_b');
            expect(palette).toEqual(PALETTE_PRESETS.alternating_b);
        });

        test('should handle case insensitive names', () => {
            const palette1 = getPaletteByName('REDS');
            const palette2 = getPaletteByName('reds');
            expect(palette1).toEqual(palette2);
        });

        test('should return null for null/undefined input', () => {
            expect(getPaletteByName(null)).toBeNull();
            expect(getPaletteByName(undefined)).toBeNull();
        });

        test('should return alternating for unknown palette name', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            const palette = getPaletteByName('unknown_palette');
            expect(palette).toEqual(PALETTE_PRESETS.alternating);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        test('should trim whitespace from palette name', () => {
            const palette = getPaletteByName('  reds  ');
            expect(palette).toEqual(PALETTE_PRESETS.reds);
        });
    });

    describe('PALETTE_PRESETS structure', () => {
        test('should have all expected palette presets', () => {
            expect(PALETTE_PRESETS).toHaveProperty('reds');
            expect(PALETTE_PRESETS).toHaveProperty('reds_a');
            expect(PALETTE_PRESETS).toHaveProperty('reds_b');
            expect(PALETTE_PRESETS).toHaveProperty('purples_a');
            expect(PALETTE_PRESETS).toHaveProperty('purples_b');
            expect(PALETTE_PRESETS).toHaveProperty('purples_c');
            expect(PALETTE_PRESETS).toHaveProperty('alternating');
            expect(PALETTE_PRESETS).toHaveProperty('alternating_b');
        });

        test('should have arrays of hex color codes', () => {
            Object.values(PALETTE_PRESETS).forEach(palette => {
                expect(Array.isArray(palette)).toBe(true);
                palette.forEach(color => {
                    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
                });
            });
        });

        test('should have non-empty color arrays', () => {
            Object.values(PALETTE_PRESETS).forEach(palette => {
                expect(palette.length).toBeGreaterThan(0);
            });
        });
    });
});

