import * as fs from 'fs';
import { RequestData } from '../data/requestData';
import { Feature } from '../data/feature';
import { Export } from './export';
import { handler } from './handler';

export class PptxExport extends Export {
  pptx;
  fileExt = 'pptx';
  sourceText = 'Source: The Eviction Lab at Princeton University: www.evictionlab.org. Data extracted on [DATE]';
  sourceParams = { font_size: 12, align: 'c', x: 0.55, y: 7.06, w: 8.91, h: 0.33 }
  chartParams = {
    x: 1.56,
    y: 2.8,
    h: 3.37,
    w: 7.09,
    valAxisLabelFormatCode: '#%',
    chartColors: ['f6a21d'],
    showTitle: true,
    titleAlign: 'center'
  };
  titleParams = {
    align: 'center',
    x: 1.75,
    y: 0.21,
    w: 6.49,
    h: 1.3,
    color: '000000',
    fill: 'FFFFFF',
    font_size: 28,
    isTextBox: true
  };
  bulletParams = { x: 0.54, y: 1.64, w: 9, h: 4.95, color: '000000', margin: 1 };

  constructor(requestData: RequestData) {
    super(requestData);
    this.key = this.createKey(requestData);
    // Recreating each time to avoid appending to previous buffer based on this issue:
    // https://github.com/gitbrent/PptxGenJS/issues/38#issuecomment-279001048
    delete require.cache[require.resolve('pptxgenjs')];
    this.pptx = require('pptxgenjs');
  };

  createSlide(feature: Feature): void {
    this.pptx.setLayout('LAYOUT_4x3');

    const titleSlide = this.pptx.addNewSlide({ bkgd: '6B8890' });

    titleSlide.addText(`UNDERSTANDING EVICTION IN ${feature.properties.name}`, {
      align: 'center',
      x: 1.21,
      y: 2.61,
      w: 7.59,
      h: 1.8,
      color: '000000',
      fill: 'FFFFFF',
      font_size: 35,
      isTextBox: true
    });

    titleSlide.addText(
      'A PowerPoint Presentation generated by The Eviction Lab at Princeton University\n' +
      'For more information, go to www.evictionlab.org', {
        align: 'center',
        x: 2.21,
        y: 4.76,
        w: 5.58,
        h: 1.36,
        color: 'FFFFFF',
        font_size: 19,
        isTextBox: true
      }
    );

    titleSlide.addText( this.sourceText, { ...this.sourceParams, color: 'ffffff' });

    const slideOne = this.pptx.addNewSlide({ bkgd: 'f2f2f2' });

    slideOne.addText(
      `${feature.name} EXPERIENCED [NUMBER] OF EVICTIONS IN [MOST RECENT YEAR]`,
      this.titleParams
    );

    slideOne.addText(
      [
        {
          text: 'This amounts to [Number] of evictions per day',
          options: { bullet: true }
        },
        {
          text: 'In neighborhoods where the poverty rate exceeds 20%, that ratio is 1 in [NUMBER]',
          options: { bullet: true }
        },
        {
          text: `Below is a graph of estimated eviction rates in ${feature.properties.name} over the last six years`,
          options: { bullet: true }
        }
      ],
      this.bulletParams
    );

    slideOne.addChart(this.pptx.charts.BAR, [{
        name: 'Eviction Rate',
        labels: ['2010', '2011', '2012', '2013', '2014', '2015'],
        values: [0.04, 0.032, 0.021, 0.045, 0.05, 0.04]
      }], 
      { ...this.chartParams, title: 'Eviction Rates in [AREA]' }
    );

    slideOne.addText(this.sourceText, { ...this.sourceParams, color: '000000' });

    const slideTwo = this.pptx.addNewSlide({ bkgd: 'f2f2f2' });
    slideTwo.addText('COMPARABLE EVICTION RATES', this.titleParams);
    slideTwo.addText(
      [
        {
          text: 'Within the regions selected, comparable [regions] had eviction rates ' + 
                'in [Most recent Year] according to the following chart:',
          options: { bullet: true }
        }
      ],
      this.bulletParams
    );

    slideTwo.addChart(this.pptx.charts.BAR, [{
        name: "Comparable Cities' Eviction Rates",
        labels: ['New York City, NY', 'Boston, MA', 'Newark, NJ', 'District of Columbia'],
        values: [0.067, 0.045, 0.021, 0.081, 0.057]
      }], 
      { ...this.chartParams, title: 'Eviction Rate' }
    );

    slideTwo.addText(this.sourceText, { ...this.sourceParams, color: '000000' });
  }

  async saveWrapper(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.pptx.save('jszip', f => { resolve(f); }, 'nodebuffer');
    });
  }

  async createFile(): Promise<Buffer> {
    this.features.forEach((f) => this.createSlide(f));
    return await this.saveWrapper().then((f) => { return f; });
  }
}

export async function fileHandler(event, context, callback): Promise<void> {
  return await handler(PptxExport, event, context, callback);
}