import { isCaseBase, isCase, isReCase, PureDatabase } from '../lib/PureDabase';
describe('PureDatabase', () => {
  it('typecheck.isCaseBase', () => {
    expect(isCaseBase({})).toBe(false);
    expect(
      isCaseBase({
        oaDateId: '20150103',
        title: '謹賀新年 毛利小五郎',
        url: 'k1169854.html',
      })
    ).toBe(true);
    expect(
      isCaseBase({
        oaDateId: '20121229',
        title: 'まじっく快斗　「ダーク・ナイトに愛の涙を」',
        url: 'k1169660.html',
      })
    ).toBe(true);
  });
  it('typecheck.isCase', () => {
    expect(isCase({})).toBe(false);
    expect(
      isCase({
        oaDateId: '20191123',
        title: '未亡人（ミズロンリー）と探偵団',
        story_num: '960',
        url: 'k11691094.html',
      })
    ).toBe(true);
  });
  it('typecheck.isReCase', () => {
    expect(isReCase({})).toBe(false);
    expect(
      isReCase({
        oaDateId: '20090404',
        title: 'ジェットコースター殺人事件',
        story_num: '1',
      })
    ).toBe(false);
    expect(
      isReCase({
        oaDateId: '20090404',
        title: 'ジェットコースター殺人事件',
        story_num: '1',
        url: 'k1169296.html',
      })
    ).toBe(true);
    expect(
      isReCase({
        oaDateId: '20090606',
        title: '大都会暗号マップ事件（デジタルリマスター）',
        story_num: '4',
        url: 'k1169305.html',
        pureTitle: '大都会暗号マップ事件',
      })
    ).toBe(true);
  });
  it('PureDatabase', () => {
    const pure = [
      {
        oaDateId: '19980202',
        title: 'ドラキュラ荘殺人事件（後編）',
        story_num: '89',
        url: 'k1169495.html',
      },
      {
        oaDateId: '19980126',
        title: 'ドラキュラ荘殺人事件（前編）',
        story_num: '88',
        url: 'k1169494.html',
      },
      {
        oaDateId: '19970210',
        title: 'スポーツクラブ殺人事件',
        story_num: '47',
        url: 'k1169453.html',
      },
      {
        oaDateId: '19970317',
        title: '霧天狗伝説殺人事件',
        story_num: '52',
        url: 'k1169458.html',
      },
      {
        oaDateId: '19961118',
        title: '赤鬼村火祭殺人事件',
        story_num: '38',
        url: 'k1169443.html',
      },
      {
        oaDateId: '20030127',
        title: '残された声なき証言（前編）',
        story_num: '307',
        url: 'k1169250.html',
      },
      {
        oaDateId: '19961125',
        title: '資産家令嬢殺人事件（前編）',
        story_num: '39',
        url: 'k1169444.html',
      },
      {
        oaDateId: '19960902',
        title: 'テレビ局殺人事件',
        story_num: '31',
        url: 'k1169436.html',
      },
      {
        oaDateId: '19960108',
        title: 'ジェットコースター殺人事件',
        story_num: '1',
        url: 'k1169406.html',
      },
    ];
    const db = new PureDatabase(pure);
    const exec = (key: string, expected: [string, string, boolean]) =>
      expect(
        db.find(key, (storyNum, title, isPureTitle) => {
          expect(storyNum).toBe(expected[0]);
          expect(title).toBe(expected[1]);
          expect(isPureTitle).toBe(expected[2]);
        })
      ).toBe(true);
    exec('スポーツクラブ殺人事件（デジタルリマスター）', ['47', 'スポーツクラブ殺人事件', false]);
    exec('名探偵コナンアンコールスペシャル！「霧天狗伝説殺人事件」（1時間）', ['52', '霧天狗伝説殺人事件', false]);
    exec('赤鬼村火祭殺人事件（デジタルリマスター）', ['38', '赤鬼村火祭殺人事件', false]);
    exec('残された声なき証言（前編）[デジタルリマスター版]', ['307', '残された声なき証言（前編）', false]);
    exec('ジェットコースター殺人事件', ['1', 'ジェットコースター殺人事件', true]);
  });
});
