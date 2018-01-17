import { RequestData } from '../data/requestData';
import { Feature } from '../data/feature';
import { Export } from './export';
import { handler } from './handler';
import * as Canvas from 'canvas-aws-prebuilt';
// Need to use original canvas for local development
// import * as Canvas from 'canvas';
import { scaleLinear, scaleBand } from 'd3-scale';
import { line } from 'd3-shape';
import axios from 'axios';
import { S3 } from 'aws-sdk';

export class PptxExport extends Export {
  pptx;
  evictionText: string;
  fileExt = 'pptx';

  sourceText = 'Source: The Eviction Lab at Princeton University: www.evictionlab.org. ' +
   `Data extracted on ${new Date().toISOString().slice(0, 10)}`;
  colors = ['e24000', '434878', '2c897f'];
  screenshotBase = 'https://screenshot.evictionlab.org';
  assetBucket = process.env['asset_bucket'] || 'eviction-lab-exports';

  mainImage: string;
  titleImage: string;
  backgroundImage: string;
  logoImage: string;

  fullSlideParams = { w: 10, h: 5.625, y: 0, x: 0 };
  titleParams = {
    align: 'l', font_size: 20, font_face: 'Helvetica', isTextBox: true, w: 9.15, h: 0.44, x: 0.44, y: 0.5
  };
  sourceParams = {
    align: 'c', font_size: 12, x: 0.55, y: 7.06, w: 8.91, h: 0.33
  };
  bulletParams = {
    font_size: 12, color: '000000', margin: 1, w: 9.15, h: 0.56, x: 0.44, y: 4.15, font_face: 'Georgia'
  };
  chartParams = {
    x: 1.25, y: 1.5, w: 7.5, h: 5, chartColors: this.colors,
    dataBorder: { pt: 2, color: 'FFFFFF' }, fill: 'ffffff'
  };
  statTitleParams = {
    align: 'l', font_size: 11, w: 2.3, h: 0.5, x: 1.14, y: 0.33, font_face: 'Helvetica'
  };
  dataProps = {
    'e': 'Total Evictions',
    'p': 'Population',
    'roh': '% Renter-Occupied Households',
    'pr': 'Poverty Rate',
    'mgr': 'Median Gross Rent',
    'mhi': 'Median Household Income',
    'mpv': 'Median Property Value'
  }
  demDataProps = {
    'paa': 'Black',
    'pw': 'White',
    'ph': 'Hispanic/Latinx',
    'pa': 'Asian',
    'pai': 'American Indian/Alaska Native',
    'pnp': 'Native Hawaiian/Pacific Islander',
    'pm': 'Multiple Races',
    'po': 'Other Races'
  }

  constructor(requestData: RequestData) {
    super(requestData);
    this.key = this.createKey(requestData);
    this.evictionText = this.bubbleProp === 'er' ? 'Eviction' : 'Eviction Filing';
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

  async readImages(): Promise<void> {
    const s3 = new S3();
    const mainImage = await s3.getObject({ Bucket: this.assetBucket, Key: 'assets/evictionlab.jpg' }).promise();
    const titleImage = await s3.getObject({ Bucket: this.assetBucket, Key: 'assets/evictionlab-title.png' }).promise();
    const backgroundImage = await s3.getObject({ Bucket: this.assetBucket, Key: 'assets/evictionlab-bg.png' }).promise();
    const logoImage = await s3.getObject({ Bucket: this.assetBucket, Key: 'assets/evictionlab-logo.png' }).promise();

    const dataPrefix = 'image/png;base64,';
    this.mainImage = 'image/jpg;base64,' + (mainImage.Body as Buffer).toString('base64');
    this.titleImage = dataPrefix + (titleImage.Body as Buffer).toString('base64');
    this.backgroundImage = dataPrefix + (backgroundImage.Body as Buffer).toString('base64');
    this.logoImage = dataPrefix + (logoImage.Body as Buffer).toString('base64');
  }

  createIntroSlide(): void {
    this.pptx.setLayout('LAYOUT_16x9');
    const introSlide = this.pptx.addNewSlide();

    const fullSlide = { w: 10, h: 5.625, y: 0, x: 0 };
    introSlide.addImage({ data: this.mainImage, ...this.fullSlideParams});
    introSlide.addShape(this.pptx.shapes.RECTANGLE, { 
      ...this.fullSlideParams, fill: { type: 'solid', color: '000000', alpha: 36 }
    });
    introSlide.addImage({ data: this.titleImage, x: 2.25, y: 2.59, w: 5.5, h: 0.44 });
  }

  createTitleSlide(features: Feature[]): void {
    const titleSlide = this.pptx.addNewSlide();
    titleSlide.addImage({ data: this.mainImage, ...this.fullSlideParams });
    titleSlide.addShape(this.pptx.shapes.RECTANGLE, {
      ...this.fullSlideParams, fill: { type: 'solid', color: 'ffffff', alpha: 15 }
    });

    titleSlide.addText('UNDERSTANDING EVICTION IN', {
      align: 'l', x: 0.44, y: 0.85, w: 8.99, h: 0.27, color: '000000', isTextBox: true,
      font_face: 'Helvetica', font_size: 12, bold: true
    });

    titleSlide.addText(
      features.map((f, i) => {
        return {
          text: f.properties.n, options: { 
            color: this.colors[i], font_size: 26, font_face: 'Helvetica', bold: true
          }
        };
      }),
      { x: 0.43, y: 1.31, w: 9.16, h: 1.62, align: 'l' }
    );

    titleSlide.addText(
      [
        { text: 'A PowerPoint Presentation generated by The Eviction Lab at Princeton University', 
          options: { color: '000000', font_face: 'Georgia', font_size: 12, breakLine: true } },
        { text: `Data extracted on ${new Date().toISOString().slice(0, 10)}`, 
          options: { color: '666666', font_face: 'Georgia', font_size: 12 } }
      ],
      { x: 0.44, y: 3.47, w: 6.71, h: 0.53 }
    );

    titleSlide.addText(
      'For further information, visit www.evictionlab.org',
      { x: 0.44, y: 4.87, w: 5.72, h: 0.24, color: '666666', font_face: 'Georgia', font_size: 12 }
    );

    titleSlide.addImage({ data: this.logoImage, x: 8.33, y: 3.99, w: 1.26, h: 1.21 });

    titleSlide.addText(this.sourceText, { ...this.sourceParams, color: 'ffffff' });
  }

  async getMapScreenshot(feature: Feature, yearSuffix: string) {
    const bbox = {
      n: feature.bbox[3],
      s: feature.bbox[1],
      e: feature.bbox[2],
      w: feature.bbox[0]
    };
    const screenshotUrl = `${this.screenshotBase}/${bbox.n}/${bbox.s}/${bbox.e}/${bbox.w}/` +
      `${feature.properties.layerId}/${this.dataProp}-${yearSuffix}/${this.bubbleProp}-${yearSuffix}`;
    const img = await axios.get(screenshotUrl, { responseType: 'arraybuffer' }).catch(err => null);
    return img !== null ? 'image/png;base64,' + new Buffer(img.data, 'binary').toString('base64') : null;
  }

  async createFeatureSlide(feature: Feature, index: number): Promise<void> {
    const featSlide = this.pptx.addNewSlide({ bkgd: 'ffffff' });
    const daysInYear = this.year % 4 === 0 ? 366 : 365;
    const yearSuffix = this.year.toString().slice(2);
    const screenshot = await this.getMapScreenshot(feature, yearSuffix);
    const evictionTotal = feature.properties[`e-${yearSuffix}`];
    const evictionRate = feature.properties[`er-${yearSuffix}`];
    const evictionsPerDay = (feature.properties[`e-${yearSuffix}`] / daysInYear).toFixed(2);

    featSlide.addImage({ data: this.backgroundImage, ...this.fullSlideParams });

    if (screenshot !== null) {
      featSlide.addImage({ data: screenshot, w: 8.84, h: 2.67, y: 0.36, x: 0.52 });
    } else {
      featSlide.addShape(this.pptx.shapes.RECTANGLE, { w: 8.84, h: 2.67, y: 0.36, x: 0.52, fill: '666666' });
    }

    let featTitleText;
    if (evictionTotal >= 0) {
      featTitleText = `${feature.properties.n} experienced ${evictionTotal} evictions in ${this.year}`;
    } else {
      featTitleText = `${this.year} eviction data for ${feature.properties.n} is unavailable`;
    }

    featSlide.addText(
      featTitleText, { ...this.titleParams, y: 3.2, color: this.colors[index], bold: true }
    );

    featSlide.addText(
      [
        {
          text: `Number of evictions per day: ${evictionTotal >= 0 ? evictionsPerDay : 'Unavailable'}`,
          options: { bullet: true }
        },
        {
          text: `Overall eviction rate: ${evictionRate >= 0 ? evictionRate : 'Unavailable'}*`,
          options: { bullet: true }
        }
      ], this.bulletParams
    );

    featSlide.addText(
      '* An eviction rate is the number of evictions over the number of renter-occupied households',
      { w: 9.15, h: 0.24, isTextBox: true, x: 0.44, y: 5.02, font_size: 11, font_face: 'Georgia', color: '666666' }
    );
  }

  createBarChart(features: Feature[]): string {
    const margin = {top: 20, left: 120, right: 20, bottom: 80};
    const fullWidth = 945;
    const fullHeight = 795;
    const width = fullWidth - margin.left - margin.right;
    const height = fullHeight - margin.top - margin.bottom;
    const canvas = new Canvas(fullWidth, fullHeight);
    const context = canvas.getContext('2d');
    context.fillStyle = 'white';
    context.fillRect(0, 0, fullWidth, fullHeight);
    context.translate(margin.left, margin.top);

    const x = scaleBand()
      .rangeRound([0, width])
      .padding(0.3);

    const y = scaleLinear()
      .rangeRound([height, 0]);

    x.domain(features.map(f => f.properties.n));
    let maxY = Math.max(...features.map(f => f.properties[`${this.bubbleProp}-${this.year.toString().slice(2)}`]));
    // Minimum value of 1/1.1
    maxY = Math.max(maxY, 1 / 1.1);
    y.domain([0, maxY]);

    const yTicksCount = 5;
    const yTicks = y.ticks(yTicksCount);

    context.textAlign = "center";
    context.textBaseline = "top";
    context.font = "22px Helvetica";
    context.fillStyle = "#666666";

    context.beginPath();
    yTicks.forEach((d) => {
      context.moveTo(0, y(d) + 0.5);
      context.lineTo(width, y(d) + 0.5);
    });
    context.strokeStyle = "#666666";
    context.stroke();

    context.textAlign = "right";
    context.textBaseline = "middle";
    context.font = "20px Helvetica";
    yTicks.forEach(function (d) {
      context.fillText(d, -15, y(d));
    });

    context.save();
    context.rotate(-Math.PI / 2);
    context.textAlign = "right";
    context.textBaseline = "top";
    context.font = "24px Helvetica";
    context.fillText(`${this.evictionText} Rate`, -150, -70);
    context.restore();

    features.forEach((f, i) => {
      context.fillStyle = '#' + this.colors[i];

      // Set minimum bar height if null
      // TODO: Does this still apply for static image?
      const val = f.properties[`${this.bubbleProp}-${this.year.toString().slice(2)}`];
      const barDisplayVal = val >= 0.1 ? val : y.domain()[y.domain().length - 1] * 0.005;
      context.fillRect(
        x(f.properties.n),
        y(barDisplayVal),
        x.bandwidth(),
        height - y(barDisplayVal)
      );
    });

    return canvas.toDataURL();
  }

  createLineChart(features: Feature[]): string {
    const yearArr = this.makeYearArr(this.years);
    const margin = { top: 20, left: 120, right: 50, bottom: 80 };
    const fullWidth = 945;
    const fullHeight = 795;
    const width = fullWidth - margin.left - margin.right;
    const height = fullHeight - margin.top - margin.bottom;
    const canvas = new Canvas(fullWidth, fullHeight);
    const context = canvas.getContext('2d');
    context.fillStyle = 'white';
    context.fillRect(0, 0, fullWidth, fullHeight);
    context.translate(margin.left, margin.top);

    const x = scaleLinear()
      .rangeRound([0, width]);

    const y = scaleLinear()
      .rangeRound([height, 0]);

    x.domain([yearArr[0], yearArr[yearArr.length - 1]]);
    const maxY = Math.max(...features.map(f => {
      return Math.max(...yearArr.map(y => {
        return f.properties[`${this.bubbleProp}-${y.toString().slice(2)}`] || 0;
      }));
    }));
    y.domain([0, maxY]);

    const tickSize = 16;
    const xTicksCount = Math.floor((yearArr.length - 1) / 3);
    const xTicks = x.ticks(xTicksCount);
    const yTicksCount = 5;
    const yTicks = y.ticks(yTicksCount);

    context.beginPath();
    xTicks.forEach(d => {
      context.moveTo(x(d), height);
      context.lineTo(x(d), height + tickSize);
    });
    context.strokeStyle = "#666666";
    context.stroke();

    context.textAlign = "center";
    context.textBaseline = "top";
    context.font = "22px Helvetica";
    context.fillStyle = "#666666";
    xTicks.forEach(d => {
      context.fillText(d, x(d), height + tickSize + 10);
    });

    context.beginPath();
    yTicks.forEach(d => {
      context.moveTo(0, y(d) + 0.5);
      context.lineTo(width, y(d) + 0.5);
    });
    context.strokeStyle = "#666666";
    context.stroke();

    context.textAlign = "right";
    context.textBaseline = "middle";
    context.font = "20px Helvetica";
    yTicks.forEach(d => {
      context.fillText(d, -15, y(d));
    });

    context.save();
    context.rotate(-Math.PI / 2);
    context.textAlign = "right";
    context.textBaseline = "top";
    context.font = "24px Helvetica";
    context.fillText(`${this.evictionText} Rate`, -150, -70);
    context.restore();

    const lineChart = line()
      .x(d => x(d.year))
      .y(d => y(d.val))
      .defined(d => d.val >= 0)
      .context(context);

    features.forEach((f, i) => {
      context.beginPath();
      const data = yearArr.map(y => {
        return { year: y, val: f.properties[`${this.bubbleProp}-${y.toString().slice(2)}`] };
      });
      lineChart(data);
      context.lineWidth = 6;
      context.strokeStyle = '#' + this.colors[i];
      context.fillStyle = '#' + this.colors[i];
      if (i === 1) {
        context.setLineDash([2, 2]);
      } else if (i === 2) {
        context.setLineDash([8, 8]);
      }
      context.stroke();

      const radius = 7.5;
      data.filter(d => d.val > -1)
        .forEach(d => {
          context.beginPath();
          context.arc(x(d.year), y(d.val), radius, 0, 2 * Math.PI);
          context.fill();
        });
    });

    return canvas.toDataURL();
  }

  createLineChartLegend(features: Feature, index: number): string {
    const canvas = new Canvas(37, 4);
    const context = canvas.getContext('2d');

    context.strokeStyle = "#" + this.colors[index];
    context.lineWidth = 4;
    if (index === 1) {
      context.setLineDash([2, 2]);
    } else if (index === 2) {
      context.setLineDash([8, 8]);
    }
    context.moveTo(0, 2);
    context.lineTo(37, 2);
    context.stroke();
    return canvas.toDataURL();
  }

  createDataTable(slide: any, yearSuffix: string, feature: Feature, count: number, idx: number): void {
    const padding = 0.2;
    const shapePadding = 0.08;
    const width = 3;
    const xVal = (0.3 + ((width + padding) * idx)) + ((3 - count) * ((width + padding) / 2)); 
    const daysInYear = +yearSuffix % 4 === 0 ? 366 : 365;
    slide.addShape(this.pptx.shapes.RECTANGLE, {
      x: xVal - (shapePadding / 2), y: 0.36, w: width + shapePadding, h: 4.92, fill: 'ffffff'
    });
    slide.addText(
      [{
        text: feature.properties.n,
        options: { color: this.colors[idx], bold: true }
      },
      {
        text: '20' + yearSuffix,
        options: { color: '666666', font_face: 'Georgia', font_size: 9 }
      }],
      { ...this.statTitleParams, x: xVal }
    );

    slide.addText(
      [{
        text: `${feature.properties[`e-${yearSuffix}`] >= 0 ?
          (feature.properties[`e-${yearSuffix}`] / daysInYear).toFixed(2) :
          'Unavailable'}`,
        options: { font_size: 12 }
      },
      {
        text: 'EVICTIONS PER DAY',
        options: { font_size: 6 }
      }],
      { align: 'c', x: xVal, y: 0.75, w: width / 2, h: 0.65, bold: true, font_face: 'Helvetica' }
    );
    slide.addText(
      [{
        text: `${feature.properties[`e-${yearSuffix}`] >= 0 ?
            feature.properties[`er-${yearSuffix}`] : 'Unavailable'}`,
        options: { font_size: 12 }
      },
      {
        text: 'EVICTION RATE',
        options: { font_size: 6 }
      }],
      { align: 'c', x: xVal + (width / 2), y: 0.75, w: width / 2, h: 0.65, bold: true, font_face: 'Helvetica'}
    );

    slide.addTable(
      Object.keys(this.dataProps).map((k, i) => [
        { text: this.dataProps[k], options: { fill: i % 2 === 1 ? 'efefef' : 'ffffff' } },
        { text: feature.properties[`${k}-${yearSuffix}`] >= 0 ? feature.properties[`${k}-${yearSuffix}`] : 'Unavailable',
          options: { fill: i % 2 === 1 ? 'efefef' : 'ffffff' } }
      ]),
      { align: 'l', w: width, h: 1.8, x: xVal, y: 1.38, rowH: [0.08, 0.08, 0.16, 0.08, 0.08, 0.16, 0.16],
        colW: [width * 0.66, width * 0.33], valign: 'm', autoPage: false },
      { font_size: 9, border: { pt: '0', color: 'ffffff' } }
    );
    slide.addText('RACE/ETHNICITY', {
      align: 'c', font_size: 6, h: 0.17, w: width, x: xVal, y: 3.09, bold: true, color: '666666'
    });
    slide.addTable(
      Object.keys(this.demDataProps).map((k, i) => [
        { text: this.demDataProps[k], options: { fill: i % 2 === 1 ? 'efefef' : 'ffffff' } },
        { text: feature.properties[`${k}-${yearSuffix}`] >= 0 ? feature.properties[`${k}-${yearSuffix}`] : 'Unavailable',
          options: { fill: i % 2 === 1 ? 'efefef' : 'ffffff' } }
      ]),
      { align: 'l', w: width, h: 1.6, x: xVal, y: 3.38, rowH: [0.08, 0.08, 0.08, 0.08, 0.16, 0.16, 0.08, 0.16],
        colW: [width * 0.66, width * 0.33], autoPage: false, valign: 'm' },
      { font_size: 9, border: { pt: '0', color: 'ffffff' } }
    );
  }

  createDataSlides(features: Feature[]): void {
    const chartSlide = this.pptx.addNewSlide();
    chartSlide.addImage({ data: this.backgroundImage, ...this.fullSlideParams });

    const chartTitleParams = {
      w: 3.89, h: 0.27, y: 0.27, align: 'l', font_face: 'Helvetica', font_size: 12, bold: true
    }
    // TODO: Should this be included regardless of how many features are selected?
    // Create comparison if more than one feature provided
    chartSlide.addText(`Comparison of ${this.evictionText} rates in ${this.year}`, {
      ...chartTitleParams, x: 0.86
    });

    const barChartCanvas = this.createBarChart(features);
    chartSlide.addImage({ data: barChartCanvas, x: 0.53, y: 0.67, w: 4.21, h: 3.54, });

    // Create line chart
    chartSlide.addText(`Comparison of ${this.evictionText} rates over time`, {
      ...chartTitleParams, x: 5.57
    });

    const years = this.makeYearArr(this.years).map(y => y.toString());

    const lineChartCanvas = this.createLineChart(features);
    chartSlide.addImage({ data: lineChartCanvas, x: 5.22, y: 0.67, w: 4.21, h: 3.54 });

    features.forEach((f, i) => {
      const yVal = 4.38 + (0.3 * i);

      // Add bar chart legend
      chartSlide.addShape(this.pptx.shapes.OVAL, { x: 0.53, y: yVal - 0.05, w: 0.2, h: 0.2, fill: this.colors[i] });
      chartSlide.addText(f.properties.n, { x: 0.93, y: yVal, w: 4, h: 0.1, color: this.colors[i], font_size: 12, bold: true });

      // Add line chart legend
      chartSlide.addImage({
        data: this.createLineChartLegend(f, i), x: 5.22, y: yVal, w: 0.5, h: 0.06
      });
      chartSlide.addText(f.properties.n, { x: 5.89, y: yVal, w: 4, h: 0.1, color: this.colors[i], font_size: 12, bold: true });
    });

    // Create general stats slide
    const statSlide = this.pptx.addNewSlide();
    statSlide.addImage({ data: this.backgroundImage, ...this.fullSlideParams });
    const yearSuffix = this.year.toString().slice(2);
    features.forEach((f, i) => this.createDataTable(statSlide, yearSuffix, f, features.length, i));
  }

  async saveWrapper(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.pptx.save('jszip', f => { resolve(f); }, 'nodebuffer');
    });
  }

  async createFile(): Promise<Buffer> {
    await this.readImages();
    this.createIntroSlide();
    this.createTitleSlide(this.features);
    for (let i = 0; i < this.features.length; ++i) {
      await this.createFeatureSlide(this.features[i], i);
    }
    this.createDataSlides(this.features);
    return await this.saveWrapper().then((f) => { return f; });
  }
}

export async function fileHandler(event, context, callback): Promise<void> {
  return await handler(PptxExport, event, context, callback);
}