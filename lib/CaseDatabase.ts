'use strict';
import { hasProperty, isArray } from './util';
import * as PureDatabase from './PureDabase';
import moment from 'moment';

interface RawCaseData {
  oa_date: string;
  title: string;
  episode: string;
}
interface RawCase {
  elete_flag: number;
  data: RawCaseData;
}
function isRawCase(i: unknown): i is RawCase {
  return (
    hasProperty(i, 'delete_flag', 'data') &&
    i.delete_flag !== 0 &&
    hasProperty(i.data, 'oa_date', 'title', 'episode') &&
    i.data != null &&
    typeof i.data.oa_date === 'string' &&
    typeof i.data.title === 'string' &&
    typeof i.data.episode === 'string'
  );
}
export interface CaseBase {
  oaDate: moment.Moment;
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
      oaDate: moment(c.oaDateId),
      title: c.title,
      story_num: c.story_num,
    };
  });
  const re: ReCase[] = data.re.map(c => {
    if (!PureDatabase.isReCase(c)) {
      throw new Error('input data is broken.');
    }
    return {
      oaDate: moment(c.oaDateId),
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
      oaDate: moment(c.oaDateId),
      title: c.title,
    };
  });
  const magicKaito: CaseBase[] = data.magicKaito.map(c => {
    if (!PureDatabase.isCaseBase(c)) {
      throw new Error('input data is broken.');
    }
    return {
      oaDate: moment(c.oaDateId),
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
      throw new Error('iligal case.json spec detected.');
    }
    if (c.data.episode.startsWith('R')) {
      re.push({
        oaDate: moment(c.data.oa_date),
        title: c.data.title,
        story_num: c.data.episode,
      });
    } else {
      pure.push({
        oaDate: moment(c.data.oa_date),
        title: c.data.title,
        story_num: c.data.episode,
      });
    }
  }
  return [pure, re];
};
const findByDateRange = <C extends CaseBase>(target: C[], before: moment.Moment, after: moment.Moment) =>
  target.filter(c => c.oaDate.isBetween(before, after, null, '[]')).reverse();
const push_ = Array.prototype.push;
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
    for (const c of re) {
      const er = this.pureDB_.find(c.title, (storyNum, title, isPureTitle) => {
        c.story_num = storyNum;
        if (!isPureTitle) {
          c.pureTitle = title;
        }
      });
      if (!er) {
        throw new Error(`CaseDatabase#constructor: iligal case.json spec detected. c=${c}`);
      }
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
  private findByDateRangeImpl(before: moment.Moment, after: moment.Moment): (CaseBase | Case | ReCase)[] {
    return [
      ...findByDateRange(this.pure_, before, after),
      ...findByDateRange(this.re_, before, after),
      ...findByDateRange(this.specials_, before, after),
      ...findByDateRange(this.magicKaito_, before, after),
    ];
  }
  findByDateRange(before: moment.Moment, after: moment.Moment): (CaseBase | Case | ReCase)[] {
    return (before.isBefore(after)
      ? this.findByDateRangeImpl(before, after)
      : this.findByDateRangeImpl(after, before)
    ).sort(caseBaseCompare);
  }
  findByDate(date: moment.Moment): CaseBase | Case | ReCase | null {
    const cond = <C extends CaseBase>(c: C) => c.oaDate.isSame(date);
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
  findByTitile(k: string): (CaseBase | Case | ReCase)[] {
    const re: (CaseBase | Case | ReCase)[] = [];
    const cond = <C extends CaseBase>(c: C) => c.title.includes(k);
    for (const target of [this.pure_, this.re_, this.specials_, this.magicKaito_]) {
      push_.apply(re, target.filter(cond));
    }
    re.sort(caseBaseCompare);
    return re;
  }
}