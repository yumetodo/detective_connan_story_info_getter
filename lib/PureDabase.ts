import { hasProperty } from './util';
export interface HasTitle {
  title: string;
}
export interface HasTitleAndStoryNum extends HasTitle {
  story_num: string;
}
export interface CaseBase {
  oaDateId: string;
  title: string;
  story_num?: string;
  url: string;
}
export function isCaseBase(c: unknown): c is CaseBase {
  return (
    hasProperty(c, 'oaDateId', 'title', 'url') &&
    typeof c.oaDateId === 'string' &&
    typeof c.title === 'string' &&
    typeof c.url === 'string' &&
    (!hasProperty(c, 'story_num') || typeof c.story_num === 'string')
  );
}
export interface Case extends CaseBase {
  story_num: string;
}
export function isCase(c: unknown): c is Case {
  return isCaseBase(c) && hasProperty(c, 'story_num');
}
export interface ReCase extends Case {
  pureTitle?: string;
}
export function isReCase(c: unknown): c is ReCase {
  return isCase(c) && (!hasProperty(c, 'pureTitle') || typeof c.pureTitle === 'string');
}
export class PureDatabase<CaseType extends HasTitleAndStoryNum> {
  pure: CaseType[];
  private titleMap_ = new Map<string, number>();
  constructor(pure: CaseType[]) {
    this.pure = pure;
    let foundDuplicated = false;
    this.pure.forEach((c, i) => {
      if (this.titleMap_.has(c.title)) {
        foundDuplicated = true;
        console.error(JSON.stringify(c));
      }
      this.titleMap_.set(c.title, i);
    });
    if (foundDuplicated) {
      throw new Error('PureDatabase: duplicated title detected');
    }
  }
  get(title: string): CaseType | undefined {
    const i = this.titleMap_.get(title);
    if (i == null) {
      return undefined;
    }
    return this.pure[i];
  }
  getStoryNum(title: string): string | undefined {
    const c = this.get(title);
    if (c == null) {
      return undefined;
    }
    return c.story_num;
  }
  find(title: string, foundhandler: (storyNum: string, title: string, isPureTitle: boolean) => void): boolean {
    // just search by name
    const storyNum = this.getStoryNum(title);
    if (storyNum != null) {
      foundhandler(storyNum, title, true);
      return true;
    }
    // find "デジタルリマスター"
    if (title.endsWith('デジタルリマスター')) {
      const pureTitle = title.slice(0, -'デジタルリマスター'.length);
      const storyNum = this.getStoryNum(pureTitle);
      if (storyNum != null) {
        foundhandler(storyNum, pureTitle, false);
        return true;
      }
      return true;
    }
    const degitalReMasterSearchRegex = /(.+)[[（(［]デジタル *リマスター.*[）)\]］]$/;
    {
      const executed = degitalReMasterSearchRegex.exec(title);
      if (executed != null && executed.length === 2) {
        const pureTitle = executed[1].replace(/[ 〔（]+(.{1,2})編[〕） ]*$/, '（$1編）');
        const storyNum = this.getStoryNum(pureTitle);
        if (storyNum != null) {
          foundhandler(storyNum, pureTitle, false);
          return true;
        }
      }
    }
    // search by inner of bracket
    const bracket = /「(.+)」/.exec(title);
    if (bracket != null && bracket.length === 2) {
      const maybePureTitle = bracket[1];
      const executed = degitalReMasterSearchRegex.exec(maybePureTitle);
      const pureTitle = executed != null && executed.length === 2 ? executed[1] : maybePureTitle;
      const storyNum = this.getStoryNum(pureTitle);
      if (storyNum != null) {
        foundhandler(storyNum, pureTitle, false);
        return true;
      }
      const matched = this.pure.filter(c => c.title.includes(pureTitle));
      if (matched.length !== 0) {
        foundhandler(matched[matched.length - 1]['story_num'], pureTitle, false);
        return true;
      }
    }
    return false;
  }
}
