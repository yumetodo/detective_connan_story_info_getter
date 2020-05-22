import { hasProperty } from './util';
export interface HasTitile {
  title: string;
}
export interface HasTitileAndStoryNum extends HasTitile {
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
    hasProperty(c, 'oaDateId', 'title') &&
    typeof c.oaDateId === 'string' &&
    typeof c.title === 'string' &&
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
export class PureDatabase<CaseType extends HasTitileAndStoryNum> {
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
  get(title: string): CaseType {
    const i = this.titleMap_.get(title);
    if (i == null) {
      throw new Error('PureDatabase#get: not known such a titile');
    }
    return this.pure[i];
  }
  find(title: string, foundhandler: (storyNum: string, title: string, isPureTitle: boolean) => void): boolean {
    // just search by name
    if (this.titleMap_.has(title)) {
      foundhandler(this.get(title)['story_num'], title, true);
      return true;
    }
    // find "デジタルリマスター"
    if (title.endsWith('デジタルリマスター')) {
      const pureTitile = title.slice(0, -'デジタルリマスター'.length);
      if (this.titleMap_.has(pureTitile)) {
        foundhandler(this.get(pureTitile)['story_num'], pureTitile, false);
        return true;
      }
      return true;
    }
    const degitalReMasterSearchRegex = /(.+)[[（(［]デジタル *リマスター.*[）)\]］]$/;
    {
      const executed = degitalReMasterSearchRegex.exec(title);
      if (executed != null && executed.length === 2) {
        const pureTitile = executed[1].replace(/[ 〔（]+(.{1,2})編[〕） ]*$/, '（$1編）');
        if (this.titleMap_.has(pureTitile)) {
          foundhandler(this.get(pureTitile)['story_num'], pureTitile, false);
          return true;
        }
      }
    }
    // search by inner of bracket
    const bracket = /「(.+)」/.exec(title);
    if (bracket != null && bracket.length === 2) {
      const maybePureTitile = bracket[1];
      const executed = degitalReMasterSearchRegex.exec(maybePureTitile);
      const pureTitile = executed != null && executed.length === 2 ? executed[1] : maybePureTitile;
      if (this.titleMap_.has(pureTitile)) {
        foundhandler(this.get(pureTitile)['story_num'], pureTitile, false);
        return true;
      }
      const matched = this.pure.filter(c => c.title.includes(pureTitile));
      if (matched.length !== 0) {
        foundhandler(matched[matched.length - 1]['story_num'], pureTitile, false);
        return true;
      }
    }
    return false;
  }
}
