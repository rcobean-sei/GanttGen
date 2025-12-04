const { jsonToExcel } = require('../../scripts/json_to_excel');
const { loadJSONFixture, createTempFile, cleanupTempFiles } = require('../helpers/testHelpers');
const ExcelJS = require('exceljs');
const path = require('path');

describe('JSON to Excel Integration', () => {
    let tempFiles = [];

    afterEach(() => {
        cleanupTempFiles(tempFiles);
        tempFiles = [];
    });

    test('should convert JSON to Excel file', async () => {
        const validProject = loadJSONFixture('valid-project.json');
        const jsonPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        const excelPath = createTempFile('', '.xlsx');
        tempFiles.push(jsonPath, excelPath);

        await jsonToExcel(jsonPath, excelPath);

        expect(require('fs').existsSync(excelPath)).toBe(true);
        
        // Verify Excel file can be read
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(excelPath);
        
        expect(workbook.worksheets.length).toBeGreaterThan(0);
    });

    test('should create all required sheets', async () => {
        const validProject = loadJSONFixture('valid-project.json');
        const jsonPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        const excelPath = createTempFile('', '.xlsx');
        tempFiles.push(jsonPath, excelPath);

        await jsonToExcel(jsonPath, excelPath);

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(excelPath);
        
        const sheetNames = workbook.worksheets.map(ws => ws.name);
        expect(sheetNames).toContain('Instructions');
        expect(sheetNames).toContain('Palette');
        expect(sheetNames).toContain('Project');
        expect(sheetNames).toContain('Tasks');
        expect(sheetNames).toContain('Milestones');
        expect(sheetNames).toContain('PausePeriods');
    });

    test('should create Instructions sheet as first sheet', async () => {
        const validProject = loadJSONFixture('valid-project.json');
        const jsonPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        const excelPath = createTempFile('', '.xlsx');
        tempFiles.push(jsonPath, excelPath);

        await jsonToExcel(jsonPath, excelPath);

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(excelPath);
        
        expect(workbook.worksheets[0].name).toBe('Instructions');
    });

    test('should populate Palette sheet with colors', async () => {
        const validProject = loadJSONFixture('valid-project.json');
        const jsonPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        const excelPath = createTempFile('', '.xlsx');
        tempFiles.push(jsonPath, excelPath);

        await jsonToExcel(jsonPath, excelPath);

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(excelPath);
        
        const paletteSheet = workbook.getWorksheet('Palette');
        expect(paletteSheet).toBeDefined();
        
        // Check that colors are in the sheet
        const colors = [];
        paletteSheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                const color = row.getCell(1).value;
                if (color) colors.push(color);
            }
        });
        
        expect(colors.length).toBeGreaterThan(0);
        colors.forEach(color => {
            expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        });
    });

    test('should populate Project sheet with correct data', async () => {
        const validProject = loadJSONFixture('valid-project.json');
        const jsonPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        const excelPath = createTempFile('', '.xlsx');
        tempFiles.push(jsonPath, excelPath);

        await jsonToExcel(jsonPath, excelPath);

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(excelPath);
        
        const projectSheet = workbook.getWorksheet('Project');
        const dataRow = projectSheet.getRow(2);
        
        expect(dataRow.getCell(1).value).toBe('Test Project Timeline');
        expect(dataRow.getCell(2).value).toBe('2025-01-01');
        expect(dataRow.getCell(3).value).toBe('2025-03-31');
    });

    test('should populate Tasks sheet with task data', async () => {
        const validProject = loadJSONFixture('valid-project.json');
        const jsonPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        const excelPath = createTempFile('', '.xlsx');
        tempFiles.push(jsonPath, excelPath);

        await jsonToExcel(jsonPath, excelPath);

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(excelPath);
        
        const tasksSheet = workbook.getWorksheet('Tasks');
        const firstTaskRow = tasksSheet.getRow(2);
        
        expect(firstTaskRow.getCell(1).value).toBe('Phase 1: Discovery');
        expect(firstTaskRow.getCell(2).value).toBe('2025-01-06');
        expect(firstTaskRow.getCell(3).value).toBe('2025-01-24');
    });

    test('should populate Milestones sheet with milestone data', async () => {
        const validProject = loadJSONFixture('valid-project.json');
        const jsonPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        const excelPath = createTempFile('', '.xlsx');
        tempFiles.push(jsonPath, excelPath);

        await jsonToExcel(jsonPath, excelPath);

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(excelPath);
        
        const milestonesSheet = workbook.getWorksheet('Milestones');
        const firstMilestoneRow = milestonesSheet.getRow(2);
        
        expect(firstMilestoneRow.getCell(1).value).toBe('Project Kickoff');
        expect(firstMilestoneRow.getCell(2).value).toBe('2025-01-06');
    });

    test('should populate PausePeriods sheet', async () => {
        const validProject = loadJSONFixture('valid-project.json');
        const jsonPath = createTempFile(JSON.stringify(validProject, null, 2), '.json');
        const excelPath = createTempFile('', '.xlsx');
        tempFiles.push(jsonPath, excelPath);

        await jsonToExcel(jsonPath, excelPath);

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(excelPath);
        
        const pauseSheet = workbook.getWorksheet('PausePeriods');
        const firstPauseRow = pauseSheet.getRow(2);
        
        expect(firstPauseRow.getCell(1).value).toBe('2025-02-10');
        expect(firstPauseRow.getCell(2).value).toBe('2025-02-12');
    });
});

