const { isValidPath } = require('../../scripts/build');

describe('Path Validation', () => {
    describe('isValidPath', () => {
        
        describe('Valid Unix/Mac paths', () => {
            test('should accept absolute Unix path', () => {
                expect(isValidPath('/home/user/file.json')).toBe(true);
            });

            test('should accept absolute Mac path', () => {
                expect(isValidPath('/Users/user/Documents/file.json')).toBe(true);
            });

            test('should accept relative path with dot-slash', () => {
                expect(isValidPath('./config/project.json')).toBe(true);
            });

            test('should accept relative path without dot-slash', () => {
                expect(isValidPath('config/project.json')).toBe(true);
            });

            test('should accept filename only', () => {
                expect(isValidPath('file.json')).toBe(true);
            });

            test('should accept relative parent path', () => {
                expect(isValidPath('../parent/file.json')).toBe(true);
            });
        });

        describe('Valid Windows paths', () => {
            test('should accept Windows absolute path with backslashes', () => {
                expect(isValidPath('C:\\Users\\test\\file.json')).toBe(true);
            });

            test('should accept Windows absolute path with forward slashes', () => {
                expect(isValidPath('C:/Users/test/file.json')).toBe(true);
            });

            test('should accept Windows drive root with backslash', () => {
                expect(isValidPath('C:\\')).toBe(true);
            });

            test('should accept Windows drive root with forward slash', () => {
                expect(isValidPath('C:/')).toBe(true);
            });

            test('should accept Windows network path (UNC)', () => {
                expect(isValidPath('\\\\server\\share\\file.json')).toBe(true);
            });
        });

        describe('Invalid paths (Windows drive letter bug)', () => {
            test('should reject drive letter C: only', () => {
                expect(isValidPath('C:')).toBe(false);
            });

            test('should reject drive letter D: only', () => {
                expect(isValidPath('D:')).toBe(false);
            });

            test('should reject drive letter with lowercase', () => {
                expect(isValidPath('c:')).toBe(false);
            });

            test('should reject any single drive letter format', () => {
                expect(isValidPath('Z:')).toBe(false);
            });
        });

        describe('Invalid paths (empty/null/undefined)', () => {
            test('should reject empty string', () => {
                expect(isValidPath('')).toBe(false);
            });

            test('should reject null', () => {
                expect(isValidPath(null)).toBe(false);
            });

            test('should reject undefined', () => {
                expect(isValidPath(undefined)).toBe(false);
            });

            test('should reject whitespace only', () => {
                expect(isValidPath('   ')).toBe(false);
            });

            test('should reject tab characters', () => {
                expect(isValidPath('\t\t')).toBe(false);
            });

            test('should reject newline characters', () => {
                expect(isValidPath('\n')).toBe(false);
            });

            test('should reject single dot', () => {
                expect(isValidPath('.')).toBe(false);
            });
        });

        describe('Invalid input types', () => {
            test('should reject number', () => {
                expect(isValidPath(123)).toBe(false);
            });

            test('should reject boolean', () => {
                expect(isValidPath(true)).toBe(false);
            });

            test('should reject object', () => {
                expect(isValidPath({})).toBe(false);
            });

            test('should reject array', () => {
                expect(isValidPath([])).toBe(false);
            });
        });

        describe('Edge cases with whitespace', () => {
            test('should accept path with leading whitespace after trim', () => {
                // The function trims internally, so this should work
                expect(isValidPath('  /home/user/file.json')).toBe(true);
            });

            test('should accept path with trailing whitespace after trim', () => {
                expect(isValidPath('/home/user/file.json  ')).toBe(true);
            });

            test('should accept Windows path with spaces in directory name', () => {
                expect(isValidPath('C:/Program Files/test/file.json')).toBe(true);
            });
        });
    });
});
