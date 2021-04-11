import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);
import fetch from 'node-fetch';
import { CaseDatabase, CaseBase, Case, ReCase } from '../lib/CaseDatabase';
import { parseCommandLine } from '../lib/CommandParser';
import local from '../resources/story_converted.json';

const options = parseCommandLine(process.argv);
if (!options) {
  process.exit(+(options === undefined));
}
const printAsJson = (v: unknown) => console.log(JSON.stringify(v, null, 4));
const printResultArrayAsJson = (v: (CaseBase | Case | ReCase)[]) => {
  const re = v.map(e => ({
    ...e,
    oaDate: e.oaDate.format(),
  }));
  printAsJson(re);
};
const printLine = (v: Case | ReCase, i: number) =>
  console.log(`${i + 1},名探偵コナン第${v.story_num}話,${v.title},${v.oaDate.format('YYYY/M/D')}`);
const main = async () => {
  const url = 'https://www.ytv.co.jp/conan/data/case.json';
  const db = new CaseDatabase(local, await fetch(url).then(r => r.json()));
  switch (options.operator) {
    case 'storyNum': {
      const re = db.findByStoryNum(options.params[0]);
      if (!options.asJson) {
        re.forEach(printLine);
      } else {
        printResultArrayAsJson(re);
      }
      break;
    }
    case 'date': {
      const v = db.findByDate(dayjs(options.params[0]).tz(options.tz || 'Asia/Tokyo'));
      if (v) {
        if ('story_num' in v) {
          printLine(v, 0);
        } else {
          console.log(`1,${v.title},${v.oaDate.format('YYYY/M/D')}`);
        }
      }
      break;
    }
    case 'dateRange': {
      const tz = options.tz || 'Asia/Tokyo';
      const re = db.findByDateRange(dayjs(options.params[0]).tz(tz), dayjs(options.params[1]).tz(tz));
      if (!options.asJson) {
        re.forEach((v, i) => {
          if ('story_num' in v) {
            printLine(v, i);
          } else {
            console.log(`${i + 1},${v.title},${v.oaDate.format('YYYY/M/D')}`);
          }
        });
      } else {
        printResultArrayAsJson(re);
      }
      break;
    }
    case 'title': {
      const re = db.findByTitle(options.params[0]);
      if (!options.asJson) {
        re.forEach((v, i) => {
          if ('story_num' in v) {
            printLine(v, i);
          } else {
            console.log(`${i + 1},${v.title},${v.oaDate.format('YYYY/M/D')}`);
          }
        });
      } else {
        printResultArrayAsJson(re);
      }
      break;
    }
    default:
      break;
  }
};
main().catch(e => {
  console.error(e);
  process.exit(1);
});
