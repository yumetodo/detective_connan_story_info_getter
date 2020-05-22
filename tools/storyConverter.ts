import * as fs from 'fs';
import * as path from 'path';
const resourcesPath = path.join(__dirname, '..', 'resources');
interface CaseBase {
  oaDateId: string;
  title: string;
  story_num?: string;
  url: string;
}
interface Case extends CaseBase {
  oaDateId: string;
  title: string;
  story_num: string;
  url: string;
  pureTitle?: string;
}
const data: Case[] = JSON.parse(fs.readFileSync(path.join(resourcesPath, 'story.json'), { encoding: 'utf-8' }))['item'];
// fill missing story number
{
  let b = false;
  for (const c of data) {
    if (!b && c.title === '名探偵コナンスペシャル　『風林火山　迷宮の鎧武者』') {
      b = true;
      c['story_num'] = '516';
    } else if (c.title === '怪盗キッドの瞬間移動魔術') {
      c['story_num'] = '515';
      break;
    }
  }
}
const pure = data.filter(c => c.story_num.length !== 0 && !c.story_num.startsWith('R'));
for (const c of pure) {
  c.title = c.title.replace(/(.+)\((.+)\)(.*)/, '$1（$2）$3');
}
class PureDatabase {
  pure: Case[];
  private titleMap: Map<string, number>;
  constructor(pure: Case[]) {
    this.pure = pure;
    this.titleMap = new Map<string, number>();
    let foundDuplicated = false;
    pure.forEach((c, i) => {
      if (this.titleMap.has(c.title)) {
        foundDuplicated = true;
        console.error(JSON.stringify(c));
      }
      this.titleMap.set(c.title, i);
    });
    if (foundDuplicated) {
      throw new Error('PureDatabase: duplicated title detected');
    }
  }
  get(title: string) {
    const i = this.titleMap.get(title);
    if (i == null) {
      throw new Error('PureDatabase#get: not known such a titile');
    }
    return pure[i];
  }
  find(title: string, foundhandler: (storyNum: string, title: string, isPureTitle: boolean) => void) {
    // just search by name
    if (this.titleMap.has(title)) {
      foundhandler(this.get(title)['story_num'], title, true);
      return true;
    }
    // find "デジタルリマスター"
    if (title.endsWith('デジタルリマスター')) {
      const pureTitile = title.slice(0, -'デジタルリマスター'.length);
      if (this.titleMap.has(pureTitile)) {
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
        if (this.titleMap.has(pureTitile)) {
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
      if (this.titleMap.has(pureTitile)) {
        foundhandler(this.get(pureTitile)['story_num'], pureTitile, false);
        return true;
      }
      const matched = pure.filter(c => c.title.includes(pureTitile));
      if (matched.length !== 0) {
        foundhandler(matched[matched.length - 1]['story_num'], pureTitile, false);
        return true;
      }
    }
    return false;
  }
}
const pureDatabase = new PureDatabase(pure);
const re = data.filter(c => c.story_num.length !== 0 && c.story_num.startsWith('R'));
const blank = data.filter(c => c.story_num.length === 0);

//
// simply find blank case's original
//
const re2 = [...re];
for (const c of re2) {
  c['story_num'] = c['story_num'].slice(1);
}
const appendRe2 = (c: Case, storyNum: string, title: string, isPureTitle = false) => {
  const n = { ...c };
  n['story_num'] = storyNum;
  if (!isPureTitle) {
    n['pureTitle'] = title;
  }
  re2.push(n);
};
const blank2 = blank.filter(
  c => !pureDatabase.find(c.title, (storyNum, title, isPureTitle) => appendRe2(c, storyNum, title, isPureTitle))
);
const blank3 = blank2.filter(c => {
  const title = c.title;
  if (title.startsWith('ブラックインパクト')) {
    appendRe2(c, '425', '名探偵コナン放送10周年記念超拡大スペシャル「ブラックインパクト！組織の手が届く瞬間」');
    return false;
  }
  if (title.startsWith('闇の男爵殺人事件')) {
    const pureTitile = title.replace(
      /闇の男爵殺人事件・(.+)編\(デジタルリマスター\)/,
      '闇の男爵（ﾅｲﾄﾊﾞﾛﾝ）殺人事件（$1篇）'
    );
    appendRe2(c, pureDatabase.get(pureTitile)['story_num'], pureTitile);
    return false;
  }
  if (title.startsWith('園子のアブナイ夏物語')) {
    const pureTitile = title.replace(
      /園子のアブナイ夏物語（(.+)編）\(デジタル・*リマスター\)/,
      '園子のアブない夏物語（$1編）'
    );
    appendRe2(c, pureDatabase.get(pureTitile)['story_num'], pureTitile);
    return false;
  }
  const replaceList = [
    ['TVドラマロケ殺人事件（デジタルリマスター）', 'ＴＶドラマロケ殺人事件'],
    ['標的（ターゲット）は毛利小五郎（デジタルリマスター）', '標的は毛利小五郎'],
    ['帝丹小7不思議事件（デジタルリマスター）', '帝丹小７不思議事件'],
    ['１年B組大作戦！(デジタルリマスター版)', '1年B組大作戦！'],
    ['黒の組織との再会', '黒の組織との再会（灰原編）'],
    ['名探偵コナンスペシャル「工藤新一NYの事件」', '工藤新一ＮＹの事件（事件編）'],
    ['黒の組織との接触（デジタルリマスター特別編集版）', '黒の組織との接触（交渉編）'],
    ['そして人魚はいなくなった（デジタルリマスター特別編集版）', 'そして人魚はいなくなった（事件編）'],
    ['名探偵コナン10周年記念スペシャル 「コナンＶＳ怪盗キッド」（デジタルリマスター版）', 'コナンVS怪盗キッド'],
    ['名探偵コナン１時間スペシャル「空飛ぶ密室　工藤新一最初の事件」', '空飛ぶ密室 工藤新一最初の事件'],
    [
      '名探偵コナン秋の本格ミステリー2時間スペシャル　揺れる警視庁1200万人の人質」（デジタルリマスター版） ',
      '揺れる警視庁　1200万人の人質',
    ],
    ['1時間スペシャル（デジタルリマスター版）「迷宮への入り口 巨大神像の怒り」', '迷宮への入口　巨大神像の怒り'],
    ['怪盗キッドの驚異空中歩行', '怪盗キッドの驚異空中歩行」1時間スペシャル】'],
  ];
  for (const [s, pureTitile] of replaceList) {
    if (s === title) {
      appendRe2(c, pureDatabase.get(pureTitile)['story_num'], pureTitile);
      return false;
    }
  }
  return true;
});
const blank4 = blank3.filter(c => !c.title.includes('映画'));
const magicKaito: CaseBase[] = [];
const specials: CaseBase[] = [];
for (const c of blank4) {
  const n: CaseBase = { ...c };
  n['story_num'] = undefined;
  if (['まじっく快斗', '怪盗キッド'].some(k => c.title.includes(k)) || c.title === '聖夜（イブ）は恋するゲレンデで') {
    magicKaito.push(n);
  } else {
    specials.push(n);
  }
}
re2.sort((l, r) => parseInt(r.oaDateId) - parseInt(l.oaDateId));
// Write out
const converted = {
  pure: pure,
  re: re2,
  specials: specials,
  magicKaito: magicKaito,
};
fs.writeFileSync(path.join(resourcesPath, 'story_converted.json'), JSON.stringify(converted, null, 4), {
  encoding: 'utf-8',
});
console.log('converted!');