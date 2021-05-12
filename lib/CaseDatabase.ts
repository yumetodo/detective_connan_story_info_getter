'use strict';
import { hasProperty, isArray } from './util';
import * as PureDatabase from './PureDabase';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

interface RawCaseData {
  oa_date: string;
  title: string;
  episode: string;
}
interface RawCase {
  delete_flag: number;
  data: RawCaseData;
}
function isRawCase(i: unknown): i is RawCase {
  return (
    hasProperty(i, 'delete_flag', 'data') &&
    typeof i.delete_flag === 'number' &&
    hasProperty(i.data, 'oa_date', 'title', 'episode') &&
    i.data != null &&
    typeof i.data.oa_date === 'string' &&
    typeof i.data.title === 'string' &&
    typeof i.data.episode === 'string'
  );
}
function investigateWhyIsNotRawCase(i: unknown): string {
  const re: string[] = [];
  if (!hasProperty(i, 'delete_flag')) {
    re.push('Propaty of "delete_flag" is undefined');
  }
  if (!hasProperty(i, 'data')) {
    re.push('Propaty of "data" is undefined');
  } else {
    if (!hasProperty(i.data, 'oa_date')) {
      re.push('Propaty of "data.oa_date" is undefined');
    }
    if (!hasProperty(i.data, 'title')) {
      re.push('Propaty of "data.title" is undefined');
    }
    if (!hasProperty(i.data, 'episode')) {
      re.push('Propaty of "data.episode" is undefined');
    }
  }
  return re.join('\n');
}
export interface CaseBase {
  oaDate: dayjs.Dayjs;
  title: string;
}
const caseBaseCompare = (l: CaseBase, r: CaseBase) =>
  l.oaDate.isSame(r.oaDate) ? 0 : l.oaDate.isBefore(r.oaDate) ? -1 : 1;
export interface Case extends CaseBase {
  story_num: string;
}
export interface ReCase extends Case {
  pureTitle?: string;
}
interface LocalResult {
  pure: Case[];
  re: ReCase[];
  specials: CaseBase[];
  magicKaito: CaseBase[];
}

const parseLocal = (data: unknown): LocalResult => {
  if (
    !hasProperty(data, 'pure', 're', 'specials', 'magicKaito') ||
    !isArray(data.pure) ||
    !isArray(data.re) ||
    !isArray(data.specials) ||
    !isArray(data.magicKaito)
  ) {
    throw new Error('input data is broken.');
  }
  const pure: Case[] = data.pure.map(c => {
    if (!PureDatabase.isCase(c)) {
      throw new Error('input data is broken.');
    }
    return {
      oaDate: dayjs(c.oaDateId).tz('Asia/Tokyo'),
      title: c.title,
      story_num: c.story_num,
    };
  });
  const re: ReCase[] = data.re.map(c => {
    if (!PureDatabase.isReCase(c)) {
      throw new Error('input data is broken.');
    }
    return {
      oaDate: dayjs(c.oaDateId).tz('Asia/Tokyo'),
      title: c.title,
      story_num: c.story_num,
      pureTitle: c.pureTitle,
    };
  });
  const specials: CaseBase[] = data.specials.map(c => {
    if (!PureDatabase.isCaseBase(c)) {
      throw new Error('input data is broken.');
    }
    return {
      oaDate: dayjs(c.oaDateId).tz('Asia/Tokyo'),
      title: c.title,
    };
  });
  const magicKaito: CaseBase[] = data.magicKaito.map(c => {
    if (!PureDatabase.isCaseBase(c)) {
      throw new Error('input data is broken.');
    }
    return {
      oaDate: dayjs(c.oaDateId).tz('Asia/Tokyo'),
      title: c.title,
    };
  });
  return {
    pure: pure,
    re: re,
    specials: specials,
    magicKaito: magicKaito,
  };
};
const parseRemote = (data: unknown): [Case[], ReCase[]] => {
  // const url = 'https://www.ytv.co.jp/conan/data/case.json';
  // const data: unknown = await fetch(url).then(r => r.json());
  if (!isArray(data)) {
    throw new Error('iligal case.json spec detected.');
  }
  const pure: Case[] = [];
  const re: ReCase[] = [];
  for (const c of data) {
    if (!isRawCase(c)) {
      throw new Error(
        'iligal case.json spec detected.\n' +
          `reason: ${investigateWhyIsNotRawCase(c)}` +
          '\n' +
          `c=${JSON.stringify(c)}`
      );
    }
    if (c.delete_flag !== 0) continue;
    if (c.data.episode.startsWith('R')) {
      re.push({
        oaDate: dayjs(c.data.oa_date).tz('Asia/Tokyo'),
        title: c.data.title,
        // c.data.episode is unreliable so that we don't have to remove 'R' prefix.
        story_num: c.data.episode,
      });
    } else {
      pure.push({
        oaDate: dayjs(c.data.oa_date).tz('Asia/Tokyo'),
        title: c.data.title,
        story_num: c.data.episode,
      });
    }
  }
  return [pure, re];
};
const findByDateRange = <C extends CaseBase>(target: C[], before: dayjs.Dayjs, after: dayjs.Dayjs) =>
  target.filter(c => c.oaDate.isBetween(before, after, null, '[]')).reverse();
const push_ = Array.prototype.push;
const replaceScarletCase = (title: string) => {
  if (!title.startsWith('緋色の帰還')) return undefined;
  const k = '（デジタルリマスター）';
  // 2021-04-10放送のタイトルは、緋色の帰還（真相）、なんと（デジタルリマスター）って書いてない！
  const t = title.endsWith(k) ? title.substring(0, title.length - k.length) : title;
  return t.replace(/緋色の帰還（([^）]+)）/, '緋色の$1');
};
const replaceMap = new Map([['大捜索 ９つのドア', '大捜索九つのドア']]);
const replaceOrDefault = (title: string) => replaceMap.get(title) || replaceScarletCase(title) || title;
export class CaseDatabase {
  private pure_: Case[];
  private pureDB_: PureDatabase.PureDatabase<Case>;
  private re_: ReCase[];
  private specials_: CaseBase[];
  private magicKaito_: CaseBase[];
  private pureStoryNumIndex_ = new Map<string, number>();
  private reStoryNumIndex_ = new Map<string, number[]>();
  constructor(localData: unknown, remoteData: unknown) {
    const local = parseLocal(localData);
    const [pure, re] = parseRemote(remoteData);
    push_.apply(pure, local.pure);
    this.pure_ = pure;
    this.pureDB_ = new PureDatabase.PureDatabase(pure);
    this.specials_ = local.specials;
    this.magicKaito_ = local.magicKaito;
    const iligal: ReCase[] = [];
    for (const c of re) {
      const er = this.pureDB_.find(replaceOrDefault(c.title), (storyNum, title, isPureTitle) => {
        c.story_num = storyNum;
        if (!isPureTitle) {
          c.pureTitle = title;
        }
      });
      if (!er) {
        iligal.push(c);
      }
    }
    if (iligal.length !== 0) {
      throw new Error(
        'CaseDatabase#constructor: iligal case.json spec detected.\n' +
          'Please report to https://github.com/yumetodo/detective_connan_story_info_getter/issues \n' +
          JSON.stringify(iligal, null, 4)
      );
    }
    push_.apply(re, local.re);
    this.re_ = re;
    this.pure_.forEach((c, i) => {
      this.pureStoryNumIndex_.set(c.story_num, i);
    });
    this.re_.forEach((c, i) => {
      const n = c.story_num;
      const a = this.reStoryNumIndex_.get(n);
      if (a != null) {
        a.push(i);
      } else {
        this.reStoryNumIndex_.set(n, [i]);
      }
    });
  }
  private findByDateRangeImpl(before: dayjs.Dayjs, after: dayjs.Dayjs): (CaseBase | Case | ReCase)[] {
    return [
      ...findByDateRange(this.pure_, before, after),
      ...findByDateRange(this.re_, before, after),
      ...findByDateRange(this.specials_, before, after),
      ...findByDateRange(this.magicKaito_, before, after),
    ];
  }
  findByDateRange(before: dayjs.Dayjs, after: dayjs.Dayjs): (CaseBase | Case | ReCase)[] {
    return (
      before.isBefore(after) ? this.findByDateRangeImpl(before, after) : this.findByDateRangeImpl(after, before)
    ).sort(caseBaseCompare);
  }
  findByDate(date: dayjs.Dayjs): CaseBase | Case | ReCase | null {
    const cond = <C extends CaseBase>(c: C) => c.oaDate.isSame(date, 'day');
    const checkLen = <T>(c: T[]) => {
      if (c.length !== 0) {
        throw new Error('CaseDatabase#findByDate: database is broken');
      }
    };
    for (const target of [this.pure_, this.re_, this.specials_, this.magicKaito_]) {
      const filtered = target.filter(cond);
      if (filtered.length === 1) {
        return filtered[0];
      }
      checkLen(filtered);
    }
    return null;
  }
  private findByStoryNumimpl(n: string, pure: Case): (Case | ReCase)[] {
    const re = this.reStoryNumIndex_.get(n);
    if (re == null) return [pure];
    return [pure, ...re.map(i => this.re_[i])];
  }
  findByStoryNum(n: string): (Case | ReCase)[] {
    const i = this.pureStoryNumIndex_.get(n);
    return i == null ? [] : this.findByStoryNumimpl(n, this.pure_[i]);
  }
  findByTitle(k: string): (CaseBase | Case | ReCase)[] {
    const re: (CaseBase | Case | ReCase)[] = [];
    const cond = <C extends CaseBase>(c: C) => c.title.includes(k);
    for (const target of [this.pure_, this.re_, this.specials_, this.magicKaito_]) {
      push_.apply(re, target.filter(cond));
    }
    re.sort(caseBaseCompare);
    return re;
  }
}
