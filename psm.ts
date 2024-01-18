import * as fs from "fs";
import csv from 'csv-parser';


if (process.argv.length <= 3) {
  console.error('Usage: ts-node psm.ts --csvfile <CSV_FILE_PATH>');
  process.exit(1);
}

const csvFilePathIndex = process.argv.indexOf('--csvfile') + 1;

if (csvFilePathIndex === 0 || csvFilePathIndex === process.argv.length) {
  console.error('Please provide a CSV file path using --csvfile');
  process.exit(1);
}

const csvFilePath = process.argv[csvFilePathIndex];

// Read CSV file
const rawData: any[] = [];
fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (row) => {
    rawData.push(row);
  })
  .on('end', () => {
    // Data processing logic
    const df = rawData; // Assuming rawData structure is similar to a DataFrame

    const cat1 = ['高い', '高すぎる'];
    const cat2 = ['安い', '安すぎる'];
    const yValues = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600];

    // Create an empty result table
    const resultTable: any = {};
    cat1.concat(cat2).forEach((category) => {
      resultTable[category] = {};
    });


    cat1.forEach((category) => {
      yValues.forEach((yValue) => {
        const countIfCondition = df.filter((row) => row[category] <= yValue).length;
        const totalCount = df.length;
        resultTable[category][yValue] = countIfCondition / totalCount;
      });
    });

    cat2.forEach((category) => {
      yValues.forEach((yValue) => {
        const countIfCondition = df.filter((row) => row[category] >= yValue).length;
        const totalCount = df.length;
        resultTable[category][yValue] = countIfCondition / totalCount;
      });
    });


    const 最高価格_crossing_ranges = findCrossingRanges(yValues, resultTable, '高すぎる', '安い');
    const 最高価格_intersections = calculateIntersections(最高価格_crossing_ranges, resultTable, '高すぎる', '安い');
    const 最高価格 = 最高価格_intersections[0][0];

    const 妥協価格_crossing_ranges = findCrossingRanges(yValues, resultTable, '高い', '安い');
    const 妥協価格_intersections = calculateIntersections(妥協価格_crossing_ranges, resultTable, '高い', '安い');
    const 妥協価格 = 妥協価格_intersections[0][0];

    const 理想価格_crossing_ranges = findCrossingRanges(yValues, resultTable, '高すぎる', '安すぎる');
    const 理想価格_intersections = calculateIntersections(理想価格_crossing_ranges, resultTable, '高すぎる', '安すぎる');
    const 理想価格 = 理想価格_intersections[0][0];

    const 最低品質保証価格_crossing_ranges = findCrossingRanges(yValues, resultTable, '高い', '安すぎる');
    const 最低品質保証価格_intersections = calculateIntersections(最低品質保証価格_crossing_ranges, resultTable, '高い', '安すぎる');
    const 最低品質保証価格 = 最低品質保証価格_intersections[0][0];

    console.log("最高価格:", 最高価格);
    console.log("妥協価格:", 妥協価格);
    console.log("理想価格:", 理想価格);
    console.log("最低品質保証価格:", 最低品質保証価格);
  });

// Define a function to find crossing ranges
function findCrossingRanges(yValues: number[], resultTable: any, category1: string, category2: string): number[][] {
    const crossingRanges: number[][] = [];

    for (let i = 0; i < yValues.length - 1; i++) {
      const currentValue1 = resultTable[category1][yValues[i]];
      const nextValue1 = resultTable[category1][yValues[i + 1]];
      const currentValue2 = resultTable[category2][yValues[i]];
      const nextValue2 = resultTable[category2][yValues[i + 1]];

      if ((currentValue1 > currentValue2 && nextValue1 < nextValue2) ||
        (currentValue1 < currentValue2 && nextValue1 > nextValue2)) {
        crossingRanges.push([yValues[i], yValues[i + 1]]);
      }
    }

    return crossingRanges;
  }
    // Define a function to calculate intersections
    function calculateIntersections(crossingRanges: number[][], resultTable: any, category1: string, category2: string): number[][] {
    const intersections: number[][] = [];

    for (const rangePair of crossingRanges) {
        const [p1x, p2x] = rangePair;
        const p1y = resultTable[category1][p1x];
        const p2y = resultTable[category1][p2x];
        const p3y = resultTable[category2][p1x];
        const p4y = resultTable[category2][p2x];

        const [x, y] = intersection(p1x, p1y, p2x, p2y, p1x, p3y, p2x, p4y);
        intersections.push([x, y]);
    }

    return intersections;
    }
// Define a function to calculate intersections
function intersection(p1x: number, p1y: number, p2x: number, p2y: number, p3x: number, p3y: number, p4x: number, p4y: number): number[] {
  const xNum = (p1x * p2y - p1y * p2x) * (p3x - p4x) - (p1x - p2x) * (p3x * p4y - p3y * p4x);
  const xDenom = (p1x - p2x) * (p3y - p4y) - (p1y - p2y) * (p3x - p4x);

  const yNum = (p1x * p2y - p1y * p2x) * (p3y - p4y) - (p1y - p2y) * (p3x * p4y - p3y * p4x);
  const yDenom = (p1x - p2x) * (p3y - p4y) - (p1y - p2y) * (p3x - p4x);

  const x = xNum / xDenom;
  const y = yNum / yDenom;

  return [x, y];
}
