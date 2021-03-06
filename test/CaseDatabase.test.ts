import { CaseDatabase } from '../lib/CaseDatabase';
import { readFile } from 'fs';
import { promisify } from 'util';
import * as path from 'path';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);
import fetch from 'node-fetch';
const readFileAsync = promisify(readFile);
let db: CaseDatabase | undefined;
describe('CaseDatabase', () => {
  beforeAll(async () => {
    const url = 'https://www.ytv.co.jp/conan/data/case.json';
    const resourcesPath = path.join(__dirname, '..', 'resources');
    const data: [unknown, unknown] = await Promise.all([
      readFileAsync(path.join(resourcesPath, 'story_converted.json'), { encoding: 'utf-8' }).then(r => JSON.parse(r)),
      fetch(url).then(r => r.json()),
    ]);
    db = new CaseDatabase(data[0], data[1]);
  }, 15000);
  it('findByStoryNum', () => {
    expect(db).not.toBeUndefined();
    if (db) {
      const endOfSearchDay = dayjs('2020-07-19T10:00:00+09:00').tz('Asia/Tokyo');
      expect(db.findByStoryNum('1').filter(c => c.oaDate.isBefore(endOfSearchDay))).toHaveLength(2);
      expect(db.findByStoryNum('143').filter(c => c.oaDate.isBefore(endOfSearchDay))).toHaveLength(2);
      expect(db.findByStoryNum('974').filter(c => c.oaDate.isBefore(endOfSearchDay))).toHaveLength(1);
    }
  });
  it('findByDate', () => {
    expect(db).not.toBeUndefined();
    if (db) {
      expect(db.findByDate(dayjs('20191123').tz('Asia/Tokyo'))).not.toBeNull();
    }
  });
  it('findByDateRange', () => {
    expect(db).not.toBeUndefined();
    if (db) {
      expect(
        db.findByDateRange(dayjs('20191123').tz('Asia/Tokyo'), dayjs('2020-01-04 18:00:00').tz('Asia/Tokyo'))
      ).toHaveLength(7);
    }
  });
  it('findByTitle', () => {
    expect(db).not.toBeUndefined();
    if (db) {
      expect(db.findByTitle('ジェットコースター殺人事件')).toHaveLength(2);
    }
  });
});
