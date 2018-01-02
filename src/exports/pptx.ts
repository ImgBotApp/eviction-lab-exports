import * as fs from 'fs';
import { RequestData } from '../data/requestData';
import { Feature } from '../data/feature';
import { Export } from './export';
import { handler } from './handler';
import * as Canvas from 'canvas-aws-prebuilt';
// Need to use original canvas for local development
// import * as Canvas from 'canvas';
import { scaleLinear, scaleBand } from 'd3-scale';
import { line } from 'd3-shape';

export class PptxExport extends Export {
  pptx;
  fileExt = 'pptx';

  sourceText = 'Source: The Eviction Lab at Princeton University: www.evictionlab.org. ' +
   `Data extracted on ${new Date().toISOString().slice(0, 10)}`;
  colors = ['e24000', '434878', '2c897f'];

  titleParams = {
    align: 'c', font_size: 28, isTextBox: true, w: 9, h: 0.7, x: 0.5, y: 0.5
  };
  sourceParams = {
    align: 'c', font_size: 12, x: 0.55, y: 7.06, w: 8.91, h: 0.33
  };
  bulletParams = {
    font_size: 18, color: '000000', margin: 1, w: 9, x: 0.5, y: 5.35, h: 1.48
  };
  chartParams = {
    x: 1.25, y: 1.5, w: 7.5, h: 5, chartColors: this.colors,
    dataBorder: { pt: 2, color: 'FFFFFF' }, fill: 'ffffff'
  };

  constructor(requestData: RequestData) {
    super(requestData);
    this.key = this.createKey(requestData);
    // Recreating each time to avoid appending to previous buffer based on this issue:
    // https://github.com/gitbrent/PptxGenJS/issues/38#issuecomment-279001048
    delete require.cache[require.resolve('pptxgenjs')];
    this.pptx = require('pptxgenjs');
  };

  makeYearArr(yearRange: number[]): number[] {
    let years = [];
    for (let year = yearRange[0]; year <= yearRange[yearRange.length - 1]; ++year) {
      years.push(year);
    }
    return years;
  }

  createTitleSlide(features: Feature[]): void {
    this.pptx.setLayout('LAYOUT_4x3');

    const titleSlide = this.pptx.addNewSlide({ bkgd: 'ffffff' });
    let featureNames;
    if (features.length === 1) {
      featureNames = features[0].properties.n;
    } else if (features.length === 2) {
      featureNames = features.map(f => f.properties.n).join(' and ');
    } else {
      featureNames = `${features[0].properties.n}, ${features[1].properties.n}, and ${features[2].properties.n}`;
    }

    titleSlide.addText(`Understanding Eviction in ${featureNames}`, {
      align: 'c', x: 1.21, y: 2.61, w: 7.59, h: 1.8, color: '000000', fill: 'FFFFFF', font_size: 35, isTextBox: true
    });

    titleSlide.addText(
      'A PowerPoint Presentation generated by The Eviction Lab at Princeton University\n' +
      'For more information, go to www.evictionlab.org', {
        align: 'c', x: 2.21, y: 4.76, w: 5.58, h: 1.36, color: 'FFFFFF', font_size: 19, isTextBox: true
      }
    );

    titleSlide.addText(this.sourceText, { ...this.sourceParams, color: 'ffffff' });
  }

  createFeatureSlides(feature: Feature, index: number): void {
    const slideOne = this.pptx.addNewSlide({ bkgd: 'ffffff' });
    const year = this.years[this.years.length - 1];
    const daysInYear = year % 4 === 0 ? 366 : 365;
    const yearSuffix = year.toString().slice(2)

    slideOne.addText(
      `${feature.properties.n} EXPERIENCED ${feature.properties[`e-${yearSuffix}`]} EVICTIONS IN ${year}`,
      { ...this.titleParams, y: 3.75, color: this.colors[index] }
    );

    slideOne.addText(
      [
        {
          text: `This amounts to ${(year / daysInYear).toFixed(2)} of evictions per day`,
          options: { bullet: true }
        },
        {
          text: `The eviction rate was ${feature.properties[`er-${yearSuffix}`]} per 100 renter-occupied households`,
          options: { bullet: true }
        }
      ], this.bulletParams
    );

    slideOne.addText(this.sourceText, { ...this.sourceParams, color: '000000' });
  }

  createBarChart(features: Feature[]): any {
    const year = this.years[this.years.length - 1];

    const margin = {top: 20, left: 50, right: 20, bottom: 50};
    const fullWidth = 1000;
    const fullHeight = 600;
    const width = fullWidth - margin.left - margin.right;
    const height = fullHeight - margin.top - margin.bottom;
    const canvas = new Canvas(fullWidth, fullHeight);
    const context = canvas.getContext('2d');
    context.translate(margin.left, margin.top);

    const x = scaleBand()
      .rangeRound([0, width])
      .padding(0.3);

    const y = scaleLinear()
      .rangeRound([height, 0]);

    x.domain(features.map(f => f.properties.n));
    const maxY = Math.max(...features.map(f => f.properties[`er-${year.toString().slice(2)}`]));
    y.domain([0, maxY]);

    const yTicksCount = 5;
    const yTicks = y.ticks(yTicksCount);

    context.beginPath();
    x.domain().forEach(d => {
      context.moveTo(x(d) + x.bandwidth() / 2, height);
      context.lineTo(x(d) + x.bandwidth() / 2, height + 6);
    });
    context.strokeStyle = 'black';
    context.stroke();

    context.textAlign = "center";
    context.textBaseline = "top";
    context.font = "18px Helvetica";
    x.domain().forEach((d) => {
      context.fillText(d, x(d) + x.bandwidth() / 2, height + 6);
    });

    context.beginPath();
    yTicks.forEach((d) => {
      context.moveTo(0, y(d) + 0.5);
      context.lineTo(-6, y(d) + 0.5);
    });
    context.strokeStyle = "black";
    context.stroke();

    context.textAlign = "right";
    context.textBaseline = "middle";
    context.font = "16px Helvetica";
    yTicks.forEach(function (d) {
      context.fillText(d, -9, y(d));
    });

    context.beginPath();
    context.moveTo(-6.5, 0 + 0.5);
    context.lineTo(0.5, 0 + 0.5);
    context.lineTo(0.5, height + 0.5);
    context.lineTo(-6.5, height + 0.5);
    context.strokeStyle = "black";
    context.stroke();

    context.save();
    context.rotate(-Math.PI / 2);
    context.textAlign = "right";
    context.textBaseline = "top";
    context.font = "20px Helvetica";
    context.fillText("Eviction Rate", -10, 10);
    context.restore();

    features.forEach((f, i) => {
      context.fillStyle = '#' + this.colors[i];
      context.fillRect(
        x(f.properties.n),
        y(f.properties[`er-${year.toString().slice(2)}`]),
        x.bandwidth(),
        height - y(f.properties[`er-${year.toString().slice(2)}`])
      );
    });

    return canvas.toDataURL();
  }

  createLineChart(features: Feature[]): any {
    const yearArr = this.makeYearArr(this.years);
    const margin = { top: 20, left: 50, right: 20, bottom: 50 };
    const fullWidth = 1000;
    const fullHeight = 600;
    const width = fullWidth - margin.left - margin.right;
    const height = fullHeight - margin.top - margin.bottom;
    const canvas = new Canvas(fullWidth, fullHeight);
    const context = canvas.getContext('2d');
    context.translate(margin.left, margin.top);

    const x = scaleLinear()
      .rangeRound([0, width]);

    const y = scaleLinear()
      .rangeRound([height, 0]);

    x.domain([yearArr[0], yearArr[yearArr.length - 1]]);
    const maxY = Math.max(...features.map(f => {
      return Math.max(...yearArr.map(y => {
        return f.properties[`er-${y.toString().slice(2)}`] || 0;
      }));
    }));
    y.domain([0, maxY]);

    const tickSize = 16;
    const xTicksCount = yearArr.length - 1;
    const xTicks = x.ticks(xTicksCount);
    const yTicksCount = 5;
    const yTicks = y.ticks(yTicksCount);

    context.beginPath();
    xTicks.forEach(d => {
      context.moveTo(x(d), height);
      context.lineTo(x(d), height + tickSize);
    });
    context.strokeStyle = "black";
    context.stroke();

    context.textAlign = "center";
    context.textBaseline = "top";
    context.font = "16px Helvetica";
    xTicks.forEach(d => {
      context.fillText(d, x(d), height + tickSize);
    });

    context.beginPath();
    yTicks.forEach(d => {
      context.moveTo(0, y(d) + 0.5);
      context.lineTo(-6, y(d) + 0.5);
    });
    context.strokeStyle = "black";
    context.stroke();

    context.textAlign = "right";
    context.textBaseline = "middle";
    context.font = "16px Helvetica";
    yTicks.forEach(d => {
      context.fillText(d, -9, y(d));
    });

    context.beginPath();
    context.moveTo(-6.5, 0 + 0.5);
    context.lineTo(0.5, 0 + 0.5);
    context.lineTo(0.5, height + 0.5);
    context.lineTo(-6.5, height + 0.5);
    context.strokeStyle = "black";
    context.stroke();

    context.save();
    context.rotate(-Math.PI / 2);
    context.textAlign = "right";
    context.textBaseline = "top";
    context.font = "20px Helvetica";
    context.fillText("Eviction Rate", -10, 10);
    context.restore();

    const lineChart = line()
      .x(d => x(d.year))
      .y(d => y(d.val))
      .context(context);

    features.forEach((f, i) => {
      context.beginPath();
      const data = yearArr.map(y => {
        return { year: y, val: f.properties[`er-${y.toString().slice(2)}`] };
      });
      lineChart(data);
      context.lineWidth = 3;
      context.strokeStyle = '#' + this.colors[i];
      context.stroke();
    });

    return canvas.toDataURL();
  }

  createDataSlides(features: Feature[]): void {
    const year = this.years[this.years.length - 1];
    if (features.length > 1) {
      // Create comparison if more than one feature provided
      const barChartSlide = this.pptx.addNewSlide({ bkgd: 'ffffff' });

      barChartSlide.addText(`Eviction Rates in ${year}`, this.titleParams);

      const barChartCanvas = this.createBarChart(features);
      barChartSlide.addImage({ data: barChartCanvas, x: 1.25, y: 1.5, w: 8, h: 4.8, });
    }

    // Create line chart
    const lineChartSlide = this.pptx.addNewSlide({ bkgd: 'ffffff' });
    const years = this.makeYearArr(this.years).map(y => y.toString());

    const lineChartCanvas = this.createLineChart(features);
    lineChartSlide.addImage({ data: lineChartCanvas, x: 1.25, y: 1.5, w: 8, h: 4.8, });

    // Create general stats slide
  }

  async saveWrapper(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.pptx.save('jszip', f => { resolve(f); }, 'nodebuffer');
    });
  }

  async createFile(): Promise<Buffer> {
    this.createTitleSlide(this.features);
    this.features.forEach((f, i) => this.createFeatureSlides(f, i));
    this.createDataSlides(this.features);
    return await this.saveWrapper().then((f) => { return f; });
  }
}

export async function fileHandler(event, context, callback): Promise<void> {
  return await handler(PptxExport, event, context, callback);
}